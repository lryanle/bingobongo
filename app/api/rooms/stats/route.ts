import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find room owned by user
    const room = await db.room.findByOwnerId(session.user.id);
    
    if (!room) {
      return NextResponse.json({ room: null });
    }

    // Get player count
    const players = await db.player.findByRoomId(room._id.toString());
    const playerCount = players.length;

    // Get activity count using proper count query
    const activityCount = await db.activity.countByRoomId(room._id.toString());

    // Get game mode name
    const getModeName = (gameMode: string) => {
      if (gameMode.includes("battleship")) return "Battleship Bingo";
      if (gameMode.includes("classic")) return "Classic Bingo";
      return "Bingo";
    };

    return NextResponse.json({
      room: {
        id: room._id.toString(),
        roomName: room.roomName,
        gameMode: getModeName(room.gameMode),
        playerCount,
        activityCount,
      },
    });
  } catch (error) {
    console.error("Error fetching room stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

