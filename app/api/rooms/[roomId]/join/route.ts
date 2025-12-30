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
    // Better Auth stores users in the 'Users' collection (capitalized)
    let userName = session.user.name || "Unknown";
    let userImage = session.user.image || "";
    
    // Try to get user from database, but fallback to session data
    // Better Auth should create users automatically, so we'll just try to find it
    // If it doesn't exist, we'll use session data (Better Auth will create it eventually)
    try {
      const user = await db.user.findById(session.user.id);
      if (user) {
        userName = user.name || userName;
        userImage = user.image || userImage;
      } else {
        // User doesn't exist yet - Better Auth will create it automatically
        // For now, just use session data
        userName = session.user.name || "Unknown";
        userImage = session.user.image || "";
        
        // Optionally, ensure user exists with stats initialized (using upsert to avoid duplicates)
        // This is safe because the create method now uses upsert
        try {
          await db.user.create({
            _id: session.user.id as any,
            name: session.user.name || undefined,
            email: session.user.email || undefined,
            image: session.user.image || undefined,
          } as any);
        } catch (createError) {
          // User might already exist (created by Better Auth), that's fine
          // Just use session data
        }
      }
    } catch (error) {
      // User lookup failed, use session data
      console.log("User lookup failed, using session data", error instanceof Error ? error.message : String(error));
      userName = session.user.name || "Unknown";
      userImage = session.user.image || "";
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
      // Default to team 0 if teamIndex is undefined
      const defaultTeamIndex = teamIndex ?? 0;
      await db.player.create({
        room_id: roomId,
        user_id: session.user.id,
        team_index: defaultTeamIndex,
        marked_items: [],
      });

      // Create activity with team_index
      await db.activity.create({
        room_id: roomId,
        user_id: session.user.id,
        user_name: userName,
        action: "joined",
        team_index: defaultTeamIndex,
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

