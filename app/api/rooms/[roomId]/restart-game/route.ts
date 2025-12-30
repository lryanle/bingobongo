import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { ObjectId } from "mongodb";

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
    const { instant = false, countdown = 5 } = body;
    
    const room = await db.room.findById(roomId);
    
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if user is the owner
    if (room.owner_id.toString() !== session.user.id) {
      return NextResponse.json({ error: "Only the room owner can restart" }, { status: 403 });
    }

    if (!room.gameFinished) {
      return NextResponse.json({ error: "Game is not finished" }, { status: 400 });
    }

    const restartCountdown = instant ? countdown : 10;
    const restartScheduled = new Date(Date.now() + restartCountdown * 1000);
    
    // Update room with restart schedule
    await db.room.update(roomId, {
      restartCountdown: restartCountdown,
      restartScheduled: restartScheduled,
    });

    // Broadcast restart scheduled
    await pusherServer.trigger(`room-${roomId}`, "restart-scheduled", {
      countdown: restartCountdown,
      scheduledAt: restartScheduled.toISOString(),
      instant,
    });

    // Broadcast countdown updates every second
    let remaining = restartCountdown;
    const countdownInterval = setInterval(async () => {
      remaining--;
      await pusherServer.trigger(`room-${roomId}`, "restart-countdown", {
        countdown: remaining,
      });
      
      if (remaining <= 0) {
        clearInterval(countdownInterval);
        
        try {
          // Reset board but preserve stats
          await db.room.update(roomId, {
            claimedItems: [],
            gameFinished: false,
            winningTeam: undefined,
            restartVotes: [],
            restartCountdown: undefined,
            restartScheduled: undefined,
          });

          // Delete all player marked items
          const players = await db.player.findByRoomId(roomId);
          for (const player of players) {
            await db.player.update(roomId, player.user_id, {
              marked_items: [],
            });
          }

          // Create restart activity
          const user = await db.user.findById(session.user.id);
          await db.activity.create({
            room_id: roomId,
            user_id: session.user.id,
            user_name: user?.name || "Unknown",
            action: "board-reset",
          });

          // Broadcast restart
          await pusherServer.trigger(`room-${roomId}`, "board-reset", {
            userId: session.user.id,
            userName: user?.name || "Unknown",
          });
        } catch (error) {
          console.error("Error during scheduled restart:", error);
        }
      }
    }, 1000);

    return NextResponse.json({ 
      success: true, 
      countdown: restartCountdown,
      scheduledAt: restartScheduled.toISOString(),
    });
  } catch (error) {
    console.error("Error restarting game:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

