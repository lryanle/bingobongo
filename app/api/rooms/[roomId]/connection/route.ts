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
    const { action } = body; // "disconnected" or "reconnected"

    if (action !== "disconnected" && action !== "reconnected") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Check if player exists
    const player = await db.player.findByRoomAndUserId(roomId, session.user.id);

    if (!player) {
      // If player doesn't exist and trying to reconnect, they need to join first
      if (action === "reconnected") {
        return NextResponse.json({ error: "Player not in room" }, { status: 403 });
      }
      // For disconnect, we can still log it even if player doesn't exist
      return NextResponse.json({ success: true });
    }

    // Get user info
    const user = await db.user.findById(session.user.id);
    const userName = user?.name || session.user.name || "Unknown";

    // Create activity with team_index
    await db.activity.create({
      room_id: roomId,
      user_id: session.user.id,
      user_name: userName,
      action: action,
      team_index: player.team_index,
    });

    // Broadcast connection status change
    await pusherServer.trigger(`room-${roomId}`, action === "disconnected" ? "player-disconnected" : "player-reconnected", {
      userId: session.user.id,
      userName: userName,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling connection event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

