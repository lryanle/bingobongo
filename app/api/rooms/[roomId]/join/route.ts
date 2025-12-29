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
    const { teamIndex } = body;

    // Check if room exists
    const room = await db.room.findById(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if player already exists
    const existingPlayer = await db.player.findByRoomAndUserId(roomId, session.user.id);
    
    // Get user info from Better Auth session (users are stored by Better Auth)
    // Better Auth stores users in the 'user' collection, but we need to ensure the user exists
    let userName = session.user.name || "Unknown";
    let userImage = session.user.image || "";
    
    // Try to get user from database, but fallback to session data
    try {
      const user = await db.user.findById(session.user.id);
      if (user) {
        userName = user.name || userName;
        userImage = user.image || userImage;
      }
    } catch (error) {
      // User might not exist in database yet, use session data
      console.log("User not found in database, using session data", error instanceof Error ? error.message : String(error));
    }
    
    if (existingPlayer) {
      const previousTeamIndex = existingPlayer.team_index;
      const newTeamIndex = teamIndex ?? existingPlayer.team_index;
      
      // Only update if team actually changed
      if (teamIndex !== undefined && teamIndex !== previousTeamIndex) {
        // Update last active and team
        await db.player.update(roomId, session.user.id, {
          team_index: newTeamIndex,
          last_active: new Date(),
        });

        // Create team change activity
        await db.activity.create({
          room_id: roomId,
          user_id: session.user.id,
          user_name: userName,
          action: "team-changed",
          team_index: newTeamIndex,
        });

        // Broadcast team changed
        await pusherServer.trigger(`room-${roomId}`, "team-changed", {
          userId: session.user.id,
          userName: userName,
          teamIndex: newTeamIndex,
        });
      } else {
        // Just update last active if team didn't change
        await db.player.update(roomId, session.user.id, {
          last_active: new Date(),
        });
      }
      // Don't create "joined" activity if player already exists
    } else {
      // Create new player
      await db.player.create({
        room_id: roomId,
        user_id: session.user.id,
        team_index: teamIndex,
        marked_items: [],
      });

      // Create activity with team_index
      await db.activity.create({
        room_id: roomId,
        user_id: session.user.id,
        user_name: userName,
        action: "joined",
        team_index: teamIndex,
      });

      // Broadcast player joined
      await pusherServer.trigger(`room-${roomId}`, "player-joined", {
        userId: session.user.id,
        userName: userName,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error joining room:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

