import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Activity, Trophy, XCircle, Clock, Play, Crown } from "lucide-react";
import { db } from "@/lib/db";
import { getGridSize, checkTeamBingoWin } from "@/lib/bingo-utils";

type MatchStatus = "not_started" | "in_progress" | "finished_won" | "finished_lost" | "cancelled";

interface TeamStats {
  name: string;
  color: string;
  playerCount: number;
  totalMarked: number;
  totalTiles: number;
}

interface Match {
  id: string;
  roomId: string; // Original room ID for navigation
  roomName: string;
  gameMode: string;
  boardSize: number;
  status: MatchStatus;
  ownerName: string;
  ownerId: string;
  playerCount: number;
  activityCount: number;
  lastUpdated: string;
  teams: TeamStats[];
  winningTeam?: number;
  winningTeamName?: string;
  winningTeamColor?: string;
}

// Determine match status
function getMatchStatus(
  players: Array<{ markedItems: number[]; teamIndex?: number; lastActive?: Date }>,
  activities: Array<{ action: string; teamIndex?: number; createdAt: Date }>,
  gameMode: string,
  boardSize: number,
  room: { gameFinished?: boolean; winningTeam?: number; claimedItems?: Array<{ cellIndex: number; teamIndex: number }> },
  currentUserId?: string
): { status: MatchStatus; winningTeam?: number } {
  // Check if all players disconnected for more than 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const allPlayersDisconnected = players.length > 0 && players.every((p) => {
    if (!p.lastActive) return true; // If no lastActive, consider disconnected
    return p.lastActive < oneHourAgo;
  });
  
  if (allPlayersDisconnected && players.length > 0) {
    return { status: "cancelled" };
  }

  // Not started: No players
  if (players.length === 0) {
    return { status: "not_started" };
  }

  // Check room's gameFinished status first (most reliable)
  if (room.gameFinished && room.winningTeam !== undefined) {
    return { status: "finished_won", winningTeam: room.winningTeam };
  }

  // Check for win activities (find the most recent win)
  const winActivities = activities.filter((a) => a.action === "win" || a.action === "bingo");
  if (winActivities.length > 0) {
    // Sort by createdAt descending to get most recent win
    const sortedWins = [...winActivities].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const mostRecentWin = sortedWins[0];
    
    // Check if there's a board-reset after this win (meaning new game started)
    const resetAfterWin = activities.find((a) => {
      if (a.action !== "board-reset") return false;
      return new Date(a.createdAt) > new Date(mostRecentWin.createdAt);
    });
    
    // If no reset after win, game is still finished
    if (!resetAfterWin && mostRecentWin.teamIndex !== undefined) {
      return { status: "finished_won", winningTeam: mostRecentWin.teamIndex };
    }
  }

  // Check for classic bingo wins by analyzing claimed items (classic mode uses team-based claiming)
  if (gameMode.includes("classic")) {
    const gridSize = getGridSize(boardSize);
    // Extract required bingos from gameMode (e.g., "classic-3" means 3 bingos required)
    const modeMatch = /classic-(\d+)/.exec(gameMode);
    const requiredBingos = modeMatch ? Number.parseInt(modeMatch[1], 10) : 1;

    // Get unique team indices from players
    const teamIndices = new Set<number>();
    players.forEach((player) => {
      if (player.teamIndex !== undefined) {
        teamIndices.add(player.teamIndex);
      }
    });

    // Check each team for wins using claimedItems (classic mode uses team-based claiming, not player markedItems)
    const claimedItems = room.claimedItems || [];
    const teamIndicesArray = Array.from(teamIndices);
    for (const teamIndex of teamIndicesArray) {
      const winCheck = checkTeamBingoWin(claimedItems, teamIndex, gridSize, requiredBingos);
      if (winCheck.hasWon) {
        // Game finished - first team to win
        return { status: "finished_won", winningTeam: teamIndex };
      }
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
  const allMatches: Match[] = [];
  
  await Promise.all(
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

      // Calculate total tiles based on board size
      const gridSize = getGridSize(room.boardSize);
      const totalTiles = gridSize * gridSize;

      // Determine match status
      const matchStatus = getMatchStatus(
        players.map((p) => ({
          markedItems: p.marked_items,
          teamIndex: p.team_index,
          lastActive: p.last_active,
        })),
        activities.map((a) => ({
          action: a.action,
          teamIndex: a.team_index,
          createdAt: a.created_at,
          cellIndex: a.cell_index,
        })),
        room.gameMode,
        room.boardSize,
        {
          gameFinished: room.gameFinished,
          winningTeam: room.winningTeam,
          claimedItems: room.claimedItems || [],
        },
        currentUserId
      );

      // Get current user's player data if they're in this room
      const currentPlayer = players.find((p) => p.user_id.toString() === currentUserId);
      const userTeamIndex = currentPlayer?.team_index;

      // Determine if user won or lost
      let status: MatchStatus = matchStatus.status;
      if (matchStatus.status === "finished_won" && matchStatus.winningTeam !== undefined) {
        if (userTeamIndex === matchStatus.winningTeam) {
          status = "finished_won";
        } else if (userTeamIndex !== undefined) {
          status = "finished_lost";
        }
      }

      // Pre-calculate win and reset activities for reuse
      const winActivitiesForStats = activities.filter((a) => a.action === "win" || a.action === "bingo");
      const resetActivitiesForStats = activities.filter((a) => a.action === "board-reset");
      
      // Calculate team stats
      // For finished games with resets, we need to calculate based on activities up to the win time
      let teamStats: TeamStats[];
      
      // Check if we need to calculate stats for a finished game (before reset)
      if (winActivitiesForStats.length > 0 && resetActivitiesForStats.length > 0) {
        const sortedWins = [...winActivitiesForStats].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const sortedResets = [...resetActivitiesForStats].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        const mostRecentWin = sortedWins[0];
        const mostRecentReset = sortedResets[0];
        const resetAfterWin = new Date(mostRecentReset.created_at).getTime() > new Date(mostRecentWin.created_at).getTime();
        
        if (resetAfterWin && matchStatus.status === "finished_won") {
          // Calculate stats based on activities up to the win time
          const winTime = new Date(mostRecentWin.created_at).getTime();
          
          // Get all marked/claimed activities before the win
          const markedActivities = activities.filter((a) => {
            const activityTime = new Date(a.created_at).getTime();
            return activityTime <= winTime && 
                   (a.action === "marked" || a.action === "claimed") && 
                   a.cell_index !== undefined &&
                   a.team_index !== undefined;
          });
          
          // Count marked items per team
          const teamMarkedCounts = new Map<number, Set<number>>();
          markedActivities.forEach((activity) => {
            if (activity.team_index !== undefined && activity.cell_index !== undefined) {
              if (!teamMarkedCounts.has(activity.team_index)) {
                teamMarkedCounts.set(activity.team_index, new Set());
              }
              teamMarkedCounts.get(activity.team_index)?.add(activity.cell_index);
            }
          });
          
          // Get players at the time of the win (before reset)
          // We'll use current players but calculate marked items from activities
          teamStats = room.teams.map((team, index) => {
            const teamPlayers = players.filter((p) => p.team_index === index);
            const markedSet = teamMarkedCounts.get(index) || new Set();
            const totalMarked = markedSet.size;
            
            return {
              name: team.name,
              color: team.color,
              playerCount: teamPlayers.length,
              totalMarked,
              totalTiles,
            };
          });
        } else {
          // Use current player state (for in-progress games)
          teamStats = room.teams.map((team, index) => {
            const teamPlayers = players.filter((p) => p.team_index === index);
            const totalMarked = teamPlayers.reduce((sum, p) => sum + p.marked_items.length, 0);
            return {
              name: team.name,
              color: team.color,
              playerCount: teamPlayers.length,
              totalMarked,
              totalTiles,
            };
          });
        }
      } else if (winActivitiesForStats.length > 0 && matchStatus.status === "finished_won") {
        // Game finished but no reset - calculate from activities up to win time
        const sortedWins = [...winActivitiesForStats].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const mostRecentWin = sortedWins[0];
        const winTime = new Date(mostRecentWin.created_at).getTime();
        
        // Get all marked/claimed activities before the win
        const markedActivities = activities.filter((a) => {
          const activityTime = new Date(a.created_at).getTime();
          return activityTime <= winTime && 
                 (a.action === "marked" || a.action === "claimed") && 
                 a.cell_index !== undefined &&
                 a.team_index !== undefined;
        });
        
        // Count marked items per team
        const teamMarkedCounts = new Map<number, Set<number>>();
        markedActivities.forEach((activity) => {
          if (activity.team_index !== undefined && activity.cell_index !== undefined) {
            if (!teamMarkedCounts.has(activity.team_index)) {
              teamMarkedCounts.set(activity.team_index, new Set());
            }
            teamMarkedCounts.get(activity.team_index)?.add(activity.cell_index);
          }
        });
        
        // Calculate team stats from activities
        teamStats = room.teams.map((team, index) => {
          const teamPlayers = players.filter((p) => p.team_index === index);
          const markedSet = teamMarkedCounts.get(index) || new Set();
          const totalMarked = markedSet.size;
          
          return {
            name: team.name,
            color: team.color,
            playerCount: teamPlayers.length,
            totalMarked,
            totalTiles,
          };
        });
      } else {
        // Use current player state (no reset scenario, game in progress)
        teamStats = room.teams.map((team, index) => {
          const teamPlayers = players.filter((p) => p.team_index === index);
          const totalMarked = teamPlayers.reduce((sum, p) => sum + p.marked_items.length, 0);
          return {
            name: team.name,
            color: team.color,
            playerCount: teamPlayers.length,
            totalMarked,
            totalTiles,
          };
        });
      }

      // Get winning team info
      let winningTeamName: string | undefined;
      let winningTeamColor: string | undefined;
      if (matchStatus.winningTeam !== undefined) {
        const winningTeam = room.teams[matchStatus.winningTeam];
        if (winningTeam) {
          winningTeamName = winningTeam.name;
          winningTeamColor = winningTeam.color;
        }
      }

      const baseMatch: Match = {
        id: room._id.toString(),
        roomId: room._id.toString(), // Store original room ID for navigation
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
        winningTeam: matchStatus.winningTeam,
        winningTeamName,
        winningTeamColor,
      };

      // Check if there's a finished game AND a restart (new game in progress)
      // Find the most recent win activity
      const winActivities = activities.filter((a) => a.action === "win" || a.action === "bingo");
      const resetActivities = activities.filter((a) => a.action === "board-reset");
      
      if (winActivities.length > 0 && resetActivities.length > 0) {
        // Sort by date (reuse the sorted arrays if already calculated, otherwise sort)
        const sortedWins = [...winActivitiesForStats].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const sortedResets = [...resetActivitiesForStats].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        const mostRecentWin = sortedWins[0];
        const mostRecentReset = sortedResets[0];
        
        // If reset happened after win, we have two game sessions
        const resetAfterWin = new Date(mostRecentReset.created_at).getTime() > new Date(mostRecentWin.created_at).getTime();
        if (resetAfterWin) {
          // Add finished game (with win info from the win activity)
          const finishedWinningTeam = mostRecentWin.team_index;
          const finishedWinningTeamInfo = finishedWinningTeam === undefined ? undefined : room.teams[finishedWinningTeam];
          
          // Determine finished game status
          let finishedStatus: MatchStatus = "finished_won";
          if (currentPlayer) {
            finishedStatus = currentPlayer.team_index === finishedWinningTeam ? "finished_won" : "finished_lost";
          }
          
          // Calculate team stats for the finished game based on activities up to win time
          const winTime = new Date(mostRecentWin.created_at).getTime();
          const markedActivitiesForFinished = activities.filter((a) => {
            const activityTime = new Date(a.created_at).getTime();
            return activityTime <= winTime && 
                   (a.action === "marked" || a.action === "claimed") && 
                   a.cell_index !== undefined &&
                   a.team_index !== undefined;
          });
          
          // Count marked items per team for finished game
          const finishedTeamMarkedCounts = new Map<number, Set<number>>();
          markedActivitiesForFinished.forEach((activity) => {
            if (activity.team_index !== undefined && activity.cell_index !== undefined) {
              if (!finishedTeamMarkedCounts.has(activity.team_index)) {
                finishedTeamMarkedCounts.set(activity.team_index, new Set());
              }
              finishedTeamMarkedCounts.get(activity.team_index)?.add(activity.cell_index);
            }
          });
          
          // Calculate finished game team stats
          const finishedTeamStats = room.teams.map((team, index) => {
            const teamPlayers = players.filter((p) => p.team_index === index);
            const markedSet = finishedTeamMarkedCounts.get(index) || new Set();
            const totalMarked = markedSet.size;
            
            return {
              name: team.name,
              color: team.color,
              playerCount: teamPlayers.length,
              totalMarked,
              totalTiles,
            };
          });
          
          const originalRoomId = room._id.toString();
          
          const finishedMatch: Match = {
            ...baseMatch,
            id: `${originalRoomId}-finished`,
            roomId: originalRoomId, // Keep original room ID for navigation
            status: finishedStatus,
            winningTeam: finishedWinningTeam,
            winningTeamName: finishedWinningTeamInfo?.name,
            winningTeamColor: finishedWinningTeamInfo?.color,
            lastUpdated: mostRecentWin.created_at.toISOString(),
            teams: finishedTeamStats, // Use calculated stats for finished game
          };
          
          const currentMatch: Match = {
            ...baseMatch,
            id: `${originalRoomId}-current`,
            roomId: originalRoomId, // Keep original room ID for navigation
            status: "in_progress",
            winningTeam: undefined,
            winningTeamName: undefined,
            winningTeamColor: undefined,
          };
          
          // Add both matches
          allMatches.push(finishedMatch, currentMatch);
          
          return;
        }
      }
      
      // Single game session (no restart after win, or no win yet)
      allMatches.push(baseMatch);
    })
  );

  // Sort by lastUpdated descending
  allMatches.sort((a, b) => 
    new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );

  return allMatches;
}

function getStatusBadge(status: MatchStatus) {
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
        <Badge variant="default" className="bg-red-500">
          <XCircle className="w-3 h-3 mr-1" />
          Lost
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="outline" className="bg-gray-300">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelled
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
  
  const needsYear = date.getFullYear() === now.getFullYear();
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  if (!needsYear) {
    options.year = "numeric";
  }
  return date.toLocaleDateString(undefined, options);
}

export default async function MatchesPage() {
  const authInstance = auth;
  const headersList = await headers();
  const session = await authInstance.api.getSession({ headers: headersList });
  
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
            <Link key={match.id} href={match.status === "finished_won" || match.status === "finished_lost" ? `/matches/${match.roomId}` : `/bingo/${match.roomId}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg line-clamp-2">{match.roomName}</CardTitle>
                    {getStatusBadge(match.status)}
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <span>{match.gameMode}</span>
                    <span>•</span>
                    <span>
                      {(() => {
                        if (match.boardSize === 0) return "5x5";
                        if (match.boardSize === 50) return "7x7";
                        return "10x10";
                      })()}
                    </span>
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
                      <div className="space-y-1.5">
                        {match.teams.map((team, teamIndex) => {
                          const isWinner = match.status === "finished_won" || match.status === "finished_lost"
                            ? match.winningTeam === teamIndex
                            : false;
                          
                          return (
                            <div
                              key={`${team.name}-${team.color}`}
                              className={`flex items-center justify-between text-sm p-2 rounded transition-all ${
                                isWinner ? "border-2" : ""
                              }`}
                              style={isWinner ? {
                                backgroundColor: team.color,
                                borderColor: team.color,
                                boxShadow: `0 0 8px ${team.color}50, 0 0 16px ${team.color}60`,
                                color: "#ffffff",
                              } : {
                                backgroundColor: `${team.color}20`,
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {isWinner && (
                                  <Crown className="w-4 h-4" fill="#ffffff" style={{ color: "#ffffff" }} />
                                )}
                                {!isWinner && (
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: isWinner ? "#ffffff" : team.color }}
                                    />
                                )}
                                <span className={`font-medium ${isWinner ? "text-white" : ""}`}>
                                  {team.name}
                                </span>
                              </div>
                              <div className={`flex items-center gap-3 ${isWinner ? "text-white/90" : "text-muted-foreground"}`}>
                                <span>{team.playerCount} players</span>
                                <span>•</span>
                                <span>{team.totalMarked}/{team.totalTiles} marked</span>
                              </div>
                            </div>
                          );
                        })}
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

