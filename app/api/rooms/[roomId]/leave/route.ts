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

    // Check if player exists
    const player = await db.player.findByRoomAndUserId(roomId, session.user.id);
    
    if (player) {
      // Create activity with team_index
      const user = await db.user.findById(session.user.id);
      await db.activity.create({
        room_id: roomId,
        user_id: session.user.id,
        user_name: user?.name || "Unknown",
        action: "left",
        team_index: player.team_index,
      });

      // Delete player
      await db.player.delete(roomId, session.user.id);

      // Broadcast player left
      await pusherServer.trigger(`room-${roomId}`, "player-left", {
        userId: session.user.id,
        userName: user?.name || "Unknown",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error leaving room:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

