import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    
    // Get user with stats
    const user = await db.user.findById(userId);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return stats with defaults if not present
    const stats = user.stats || {
      gamesPlayed: 0,
      gamesWon: 0,
      totalItemsMarked: 0,
      totalBingos: 0,
      currentWinStreak: 0,
      longestWinStreak: 0,
    };

    // Calculate win rate
    const winRate = stats.gamesPlayed > 0 
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
      : 0;

    // Calculate average items per game
    const avgItemsPerGame = stats.gamesPlayed > 0
      ? Math.round((stats.totalItemsMarked / stats.gamesPlayed) * 10) / 10
      : 0;

    return NextResponse.json({
      userId: user._id.toString(),
      userName: user.name || "Unknown",
      userImage: user.image || "",
      stats: {
        ...stats,
        winRate,
        avgItemsPerGame,
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

