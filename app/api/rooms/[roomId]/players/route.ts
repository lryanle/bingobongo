import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    const currentUserId = session?.user?.id;
    
    const players = await db.player.findByRoomId(roomId);
    
    // Get user details for each player
    const playersWithDetails = await Promise.all(
      players.map(async (player) => {
        let userName = "Unknown";
        let userImage = "";
        
        // If this is the current user, use session data (more reliable)
        if (player.user_id.toString() === currentUserId && session?.user) {
          userName = session.user.name || "Unknown";
          userImage = session.user.image || "";
        } else {
          // For other users, try database
          try {
            const user = await db.user.findById(player.user_id);
            if (user) {
              userName = user.name || "Unknown";
              userImage = user.image || "";
            }
          } catch (error) {
            // User might not exist in database, keep "Unknown"
            console.log(`User ${player.user_id} not found in database`, error instanceof Error ? error.message : String(error));
          }
        }
        
        return {
          id: player._id.toString(),
          userId: player.user_id.toString(),
          userName,
          userImage,
          teamIndex: player.team_index,
          markedItems: player.marked_items,
          joinedAt: player.joined_at.toISOString(),
          lastActive: player.last_active.toISOString(),
        };
      })
    );

    return NextResponse.json(playersWithDetails);
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

