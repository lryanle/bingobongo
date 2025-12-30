import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getGridSize } from "@/lib/bingo-utils";

// Helper to check if a player has won (for classic bingo mode)
function checkBingoWin(markedItems: number[], gridSize: number, requiredBingos: number = 1): boolean {
  if (markedItems.length < gridSize * requiredBingos) return false;
  
  // Create a grid representation
  const grid: boolean[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
  markedItems.forEach((index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    if (row < gridSize && col < gridSize) {
      grid[row][col] = true;
    }
  });

  let bingoCount = 0;

  // Check rows
  for (let row = 0; row < gridSize; row++) {
    if (grid[row].every((cell) => cell)) {
      bingoCount++;
    }
  }

  // Check columns
  for (let col = 0; col < gridSize; col++) {
    if (grid.map((row) => row[col]).every((cell) => cell)) {
      bingoCount++;
    }
  }

  // Check diagonals
  let diag1 = true;
  let diag2 = true;
  for (let i = 0; i < gridSize; i++) {
    if (!grid[i][i]) diag1 = false;
    if (!grid[i][gridSize - 1 - i]) diag2 = false;
  }
  if (diag1) bingoCount++;
  if (diag2) bingoCount++;

  return bingoCount >= requiredBingos;
}

// Determine match status
function getMatchStatus(
  players: Array<{ markedItems: number[]; teamIndex?: number }>,
  activities: Array<{ action: string; teamIndex?: number }>,
  gameMode: string,
  boardSize: number
): { status: "not_started" | "in_progress" | "finished_won" | "finished_lost"; winningTeam?: number } {
  // Not started: No players
  if (players.length === 0) {
    return { status: "not_started" };
  }

  // Check for win activities
  const winActivity = activities.find((a) => a.action === "win" || a.action === "bingo");
  if (winActivity && winActivity.teamIndex !== undefined) {
    // Game finished - determine if current user won or lost
    // For now, we'll return finished_won if there's a win activity
    // The frontend can determine won/lost based on user's team
    return { status: "finished_won", winningTeam: winActivity.teamIndex };
  }

  // Check for classic bingo wins by analyzing marked items
  if (gameMode.includes("classic")) {
    const gridSize = getGridSize(boardSize);
    // Extract required bingos from gameMode (e.g., "classic-3" means 3 bingos required)
    const modeMatch = gameMode.match(/classic-(\d+)/);
    const requiredBingos = modeMatch ? parseInt(modeMatch[1], 10) : 1;

    // Check each team for wins
    const teamWins = new Map<number, boolean>();
    players.forEach((player) => {
      if (player.teamIndex !== undefined) {
        const hasWon = checkBingoWin(player.markedItems, gridSize, requiredBingos);
        if (hasWon && !teamWins.has(player.teamIndex)) {
          teamWins.set(player.teamIndex, true);
        }
      }
    });

    if (teamWins.size > 0) {
      // Game finished - first team to win
      const winningTeam = Array.from(teamWins.keys())[0];
      return { status: "finished_won", winningTeam };
    }
  }

  // Has players and activities but no win detected = in progress
  if (players.length > 0 && activities.length > 0) {
    return { status: "in_progress" };
  }

  // Default: in progress if has players
  return { status: "in_progress" };
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all rooms (recent first)
    const rooms = await db.room.findAll(50, "last_updated");

    // Get game mode name helper
    const getModeName = (gameMode: string) => {
      if (gameMode.includes("battleship")) return "Battleship Bingo";
      if (gameMode.includes("classic")) return "Classic Bingo";
      return "Bingo";
    };

    // Fetch stats for each room
    const matches = await Promise.all(
      rooms.map(async (room) => {
        const [players, activities] = await Promise.all([
          db.player.findByRoomId(room._id.toString()),
          db.activity.findByRoomId(room._id.toString(), 100), // Get more activities to check for wins
        ]);

        // Get owner info
        const owner = await db.user.findById(room.owner_id);

        // Determine match status
        const matchStatus = getMatchStatus(
          players.map((p) => ({
            markedItems: p.marked_items,
            teamIndex: p.team_index,
          })),
          activities.map((a) => ({
            action: a.action,
            teamIndex: a.team_index,
          })),
          room.gameMode,
          room.boardSize
        );

        // Get current user's player data if they're in this room
        const currentPlayer = players.find((p) => p.user_id.toString() === session.user.id);
        const userTeamIndex = currentPlayer?.team_index;

        // Determine if user won or lost
        let status: "not_started" | "in_progress" | "finished_won" | "finished_lost" = matchStatus.status;
        if (matchStatus.status === "finished_won" && matchStatus.winningTeam !== undefined) {
          if (userTeamIndex === matchStatus.winningTeam) {
            status = "finished_won";
          } else if (userTeamIndex !== undefined) {
            status = "finished_lost";
          }
        }

        // Calculate team stats
        const teamStats = room.teams.map((team, index) => {
          const teamPlayers = players.filter((p) => p.team_index === index);
          const totalMarked = teamPlayers.reduce((sum, p) => sum + p.marked_items.length, 0);
          return {
            name: team.name,
            color: team.color,
            playerCount: teamPlayers.length,
            totalMarked,
          };
        });

        return {
          id: room._id.toString(),
          roomName: room.roomName,
          gameMode: getModeName(room.gameMode),
          boardSize: room.boardSize,
          status,
          ownerName: owner?.name || "Unknown",
          ownerId: room.owner_id.toString(),
          playerCount: players.length,
          activityCount: activities.length,
          lastUpdated: room.last_updated.toISOString(),
          teams: teamStats,
        };
      })
    );

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

