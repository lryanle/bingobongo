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
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Check if room exists and user is owner
    const room = await db.room.findById(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.owner_id.toString() !== session.user.id) {
      return NextResponse.json({ error: "Only the room owner can kick players" }, { status: 403 });
    }

    // Don't allow kicking yourself
    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot kick yourself" }, { status: 400 });
    }

    // Check if player exists
    const player = await db.player.findByRoomAndUserId(roomId, userId);
    
    if (player) {
      // Get user info
      const user = await db.user.findById(userId);
      const userName = user?.name || "Unknown";

      // Create activity
      await db.activity.create({
        room_id: roomId,
        user_id: userId,
        user_name: userName,
        action: "kicked",
        team_index: player.team_index,
      });

      // Delete player
      await db.player.delete(roomId, userId);

      // Broadcast player kicked
      await pusherServer.trigger(`room-${roomId}`, "player-kicked", {
        userId: userId,
        userName: userName,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error kicking player:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

