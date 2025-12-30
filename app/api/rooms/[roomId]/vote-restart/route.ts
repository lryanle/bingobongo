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
    const room = await db.room.findById(roomId);
    
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (!room.gameFinished) {
      return NextResponse.json({ error: "Game is not finished" }, { status: 400 });
    }

    const userId = new ObjectId(session.user.id);
    const currentVotes = room.restartVotes || [];
    
    // Check if user already voted
    const hasVoted = currentVotes.some((vote) => vote.toString() === session.user.id);
    
    if (hasVoted) {
      return NextResponse.json({ error: "Already voted" }, { status: 400 });
    }

    // Add vote
    const updatedVotes = [...currentVotes, userId];
    
    // Get player count
    const players = await db.player.findByRoomId(roomId);
    const playerCount = players.length;
    const majority = Math.ceil(playerCount / 2);
    
    // Check if majority reached
    let restartCountdown: number | undefined;
    let restartScheduled: Date | undefined;
    
    if (updatedVotes.length >= majority && !room.restartScheduled) {
      // Schedule restart in 10 seconds
      restartCountdown = 10;
      restartScheduled = new Date(Date.now() + 10000);
      
      // Broadcast restart scheduled
      await pusherServer.trigger(`room-${roomId}`, "restart-scheduled", {
        countdown: 10,
        scheduledAt: restartScheduled.toISOString(),
      });

      // Start countdown updates
      let remaining = 10;
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
    }
    
    // Update room
    await db.room.update(roomId, {
      restartVotes: updatedVotes,
      restartCountdown,
      restartScheduled,
    });

    // Broadcast vote update
    await pusherServer.trigger(`room-${roomId}`, "restart-vote", {
      userId: session.user.id,
      votes: updatedVotes.length,
      playerCount,
      majority,
      restartScheduled: restartScheduled?.toISOString(),
      countdown: restartCountdown,
    });

    return NextResponse.json({ 
      success: true, 
      votes: updatedVotes.length,
      playerCount,
      majority,
      restartScheduled: restartScheduled?.toISOString(),
      countdown: restartCountdown,
    });
  } catch (error) {
    console.error("Error voting for restart:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

