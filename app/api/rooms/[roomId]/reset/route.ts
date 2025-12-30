import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    const room = await db.room.findById(roomId);
    
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if user is the owner
    if (room.owner_id.toString() !== session.user.id) {
      return NextResponse.json({ error: "Only the room owner can reset the board" }, { status: 403 });
    }

    // Reset claimed items, game finished status, and winning team (preserve stats)
    await db.room.update(roomId, {
      claimedItems: [],
      gameFinished: false,
      winningTeam: undefined,
      restartVotes: [],
      restartCountdown: undefined,
      restartScheduled: undefined,
    });

    // Delete all player marked items (for lockout mode)
    const players = await db.player.findByRoomId(roomId);
    for (const player of players) {
      await db.player.update(roomId, player.user_id, {
        marked_items: [],
      });
    }

    // Create reset activity
    const user = await db.user.findById(session.user.id);
    await db.activity.create({
      room_id: roomId,
      user_id: session.user.id,
      user_name: user?.name || "Unknown",
      action: "board-reset",
    });

    // Broadcast board reset
    await pusherServer.trigger(`room-${roomId}`, "board-reset", {
      userId: session.user.id,
      userName: user?.name || "Unknown",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resetting board:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

