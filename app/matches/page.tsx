import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Activity, Trophy, XCircle, Clock, Play } from "lucide-react";
import { db } from "@/lib/db";
import { getGridSize } from "@/lib/bingo-utils";

interface Match {
  id: string;
  roomName: string;
  gameMode: string;
  boardSize: number;
  status: "not_started" | "in_progress" | "finished_won" | "finished_lost";
  ownerName: string;
  ownerId: string;
  playerCount: number;
  activityCount: number;
  lastUpdated: string;
  teams: Array<{
    name: string;
    color: string;
    playerCount: number;
    totalMarked: number;
  }>;
}

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
  boardSize: number,
  currentUserId?: string
): { status: "not_started" | "in_progress" | "finished_won" | "finished_lost"; winningTeam?: number } {
  // Not started: No players
  if (players.length === 0) {
    return { status: "not_started" };
  }

  // Check for win activities
  const winActivity = activities.find((a) => a.action === "win" || a.action === "bingo");
  if (winActivity && winActivity.teamIndex !== undefined) {
    // Game finished - determine if current user won or lost
    const currentPlayer = players.find((p) => p.teamIndex === winActivity.teamIndex);
    if (currentPlayer) {
      return { status: "finished_won", winningTeam: winActivity.teamIndex };
    }
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

async function getMatches(currentUserId: string, session?: { user?: { id: string; name?: string | null; email?: string | null; image?: string | null } }): Promise<Match[]> {
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

      // Get owner info - try database first, fallback to session if available
      let owner = await db.user.findById(room.owner_id);
      
      // If owner not found in database but we have session info, use that
      if (!owner && session?.user && room.owner_id.toString() === session.user.id) {
        owner = {
          _id: room.owner_id,
          name: session.user.name || undefined,
          email: session.user.email || undefined,
          image: session.user.image || undefined,
          created: new Date(),
        };
      }

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
        room.boardSize,
        currentUserId
      );

      // Get current user's player data if they're in this room
      const currentPlayer = players.find((p) => p.user_id.toString() === currentUserId);
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

  return matches;
}

function getStatusBadge(status: Match["status"]) {
  switch (status) {
    case "not_started":
      return (
        <Badge variant="outline" className="bg-muted">
          <Clock className="w-3 h-3 mr-1" />
          Not Started
        </Badge>
      );
    case "in_progress":
      return (
        <Badge variant="default" className="bg-blue-500">
          <Play className="w-3 h-3 mr-1" />
          In Progress
        </Badge>
      );
    case "finished_won":
      return (
        <Badge variant="default" className="bg-green-500">
          <Trophy className="w-3 h-3 mr-1" />
          Won
        </Badge>
      );
    case "finished_lost":
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Lost
        </Badge>
      );
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default async function MatchesPage() {
  const authInstance = await auth;
  const session = await authInstance.api.getSession({ headers: await headers() });
  
  if (!session?.user?.id) {
    redirect("/");
  }

  const matches = await getMatches(session.user.id, session);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Recent Matches</h1>
        <p className="text-muted-foreground">
          View your recent bingo matches and their statistics
        </p>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No matches found. Create a bingo room to get started!</p>
            <Link
              href="/bingo/create"
              className="mt-4 inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Create Bingo Room
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <Link key={match.id} href={match.status === "finished_won" || match.status === "finished_lost" ? `/matches/${match.id}` : `/bingo/${match.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg line-clamp-2">{match.roomName}</CardTitle>
                    {getStatusBadge(match.status)}
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <span>{match.gameMode}</span>
                    <span>•</span>
                    <span>{match.boardSize === 0 ? "5x5" : match.boardSize === 50 ? "7x7" : "10x10"}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{match.playerCount} players</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="w-4 h-4" />
                      <span>{match.activityCount} actions</span>
                    </div>
                  </div>

                  {match.teams.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Teams:</p>
                      <div className="space-y-1">
                        {match.teams.map((team, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm p-2 rounded"
                            style={{ backgroundColor: `${team.color}20` }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: team.color }}
                              />
                              <span className="font-medium">{team.name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <span>{team.playerCount} players</span>
                              <span>•</span>
                              <span>{team.totalMarked} marked</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
                    <Calendar className="w-3 h-3" />
                    <span>Updated {formatDate(match.lastUpdated)}</span>
                    <span className="ml-auto">by {match.ownerName}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

