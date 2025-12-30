import { db } from "@/lib/db";
import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Trophy, Users, Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { generateBingoData, getGridSize } from "@/lib/bingo-utils";
import BingoCard from "@/components/bingo-card/bingocard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface PageProps {
  params: Promise<{
    matchId: string;
  }>;
}

export default async function MatchPreviewPage({ params }: PageProps) {
  const { matchId } = await params;

  // Validate matchId format
  const isValidObjectId = ObjectId.isValid(matchId);
  
  if (!isValidObjectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-destructive/50 rounded-lg shadow-lg p-8 text-center space-y-4">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Invalid Match ID</h1>
            <p className="text-muted-foreground">
              The match ID is not valid.
            </p>
          </div>
          <Link href="/matches">
            <Button>Return to Matches</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if room exists
  const room = await db.room.findById(matchId);
  
  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-destructive/50 rounded-lg shadow-lg p-8 text-center space-y-4">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Match Not Found</h1>
            <p className="text-muted-foreground">
              The match you're looking for doesn't exist or may have been deleted.
            </p>
          </div>
          <Link href="/matches">
            <Button>Return to Matches</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Get session for current user
  const authInstance = await auth;
  const session = await authInstance.api.getSession({ headers: await headers() });
  const currentUserId = session?.user?.id;

  // Fetch all match data
  const [players, activities] = await Promise.all([
    db.player.findByRoomId(matchId),
    db.activity.findByRoomId(matchId, 100),
  ]);

  // Get owner info
  let owner = await db.user.findById(room.owner_id);
  if (!owner && session?.user && room.owner_id.toString() === session.user.id) {
    owner = {
      _id: room.owner_id,
      name: session.user.name || undefined,
      email: session.user.email || undefined,
      image: session.user.image || undefined,
      created: new Date(),
    };
  }

  // Get game mode name
  const getModeName = (gameMode: string) => {
    if (gameMode.includes("battleship")) return "Battleship Bingo";
    if (gameMode.includes("classic")) return "Classic Bingo";
    return "Bingo";
  };

  // Determine winning team
  const gridSize = getGridSize(room.boardSize);
  let winningTeam: number | undefined;
  
  if (room.gameMode.includes("classic")) {
    const modeMatch = room.gameMode.match(/classic-(\d+)/);
    const requiredBingos = modeMatch ? parseInt(modeMatch[1], 10) : 1;

    // Check each team for wins
    for (const player of players) {
      if (player.team_index !== undefined) {
        const markedItems = player.marked_items;
        if (markedItems.length >= gridSize * requiredBingos) {
          // Simple check - if player has enough marked items, consider them a winner
          // (Full bingo detection would require more complex logic)
          const bingoCount = Math.floor(markedItems.length / gridSize);
          if (bingoCount >= requiredBingos) {
            winningTeam = player.team_index;
            break;
          }
        }
      }
    }
  }

  // Get current user's player data
  const currentPlayer = players.find((p) => p.user_id.toString() === currentUserId);

  // Generate bingo data for preview
  const teams = room.teams && Array.isArray(room.teams) && room.teams.length > 0
    ? room.teams
    : [{ name: "Team 1", color: "#6b7280" }, { name: "Team 2", color: "#1d4ed8" }];
  
  const bingoData = generateBingoData(
    room.bingoSeed,
    gridSize,
    teams
  );

  // Update bingo data with marked items from all players
  // For preview, show all marked items (union of all players' marked items)
  const allMarkedItems = new Set<number>();
  players.forEach((player) => {
    player.marked_items.forEach((index) => allMarkedItems.add(index));
  });

  // Remove onClick handlers for preview (read-only)
  const previewBingoData = bingoData.map((cell, index) => {
    const { onClick, ...cellWithoutOnClick } = cell;
    return {
      ...cellWithoutOnClick,
      disabled: allMarkedItems.has(index),
    };
  });

  // Calculate team stats
  const teamStats = teams.map((team, index) => {
    const teamPlayers = players.filter((p) => p.team_index === index);
    const totalMarked = teamPlayers.reduce((sum, p) => sum + p.marked_items.length, 0);
    return {
      name: team.name,
      color: team.color,
      index,
      playerCount: teamPlayers.length,
      totalMarked,
      players: teamPlayers,
    };
  });

  // Get player details with user info
  const playersWithDetails = await Promise.all(
    players.map(async (player) => {
      const user = await db.user.findById(player.user_id);
      return {
        id: player._id.toString(),
        userId: player.user_id.toString(),
        userName: user?.name || "Unknown",
        userImage: user?.image || "",
        teamIndex: player.team_index,
        markedItems: player.marked_items,
        markedCount: player.marked_items.length,
      };
    })
  );

  // Sort activities by time (newest first for preview)
  const sortedActivities = [...activities].sort(
    (a, b) => b.created_at.getTime() - a.created_at.getTime()
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6">
        <Link href="/matches">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Matches
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{room.roomName}</h1>
            <p className="text-muted-foreground">
              {getModeName(room.gameMode)} • {gridSize}x{gridSize} • Match ended
            </p>
          </div>
          {winningTeam !== undefined && (
            <Badge className="bg-green-500 text-white px-4 py-2 text-lg">
              <Trophy className="w-5 h-5 mr-2" />
              {teams[winningTeam]?.name || `Team ${winningTeam + 1}`} Won!
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Bingo Card Preview - 2 columns */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Final Board State</CardTitle>
              <CardDescription>
                All marked items from all players (read-only preview)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <BingoCard
                  mode="default"
                  modeName={getModeName(room.gameMode)}
                  lobbyName={room.roomName}
                  size={gridSize}
                  bingoData={previewBingoData}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Team Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Teams
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamStats.map((team, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    winningTeam === index ? "border-green-500 bg-green-500/10" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="font-semibold">{team.name}</span>
                      {winningTeam === index && (
                        <Trophy className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {team.totalMarked} marked
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {team.playerCount} {team.playerCount === 1 ? "player" : "players"}
                  </div>
                  <div className="mt-2 space-y-1">
                    {playersWithDetails
                      .filter((p) => p.teamIndex === index)
                      .map((player) => (
                        <div
                          key={player.id}
                          className="text-sm flex items-center justify-between"
                        >
                          <span>{player.userName}</span>
                          <span className="text-muted-foreground">
                            {player.markedCount} items
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Match Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Match Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Players:</span>
                <span className="font-semibold">{players.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Actions:</span>
                <span className="font-semibold">{activities.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Owner:</span>
                <span className="font-semibold">{owner?.name || "Unknown"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Final Activity Feed</CardTitle>
              <CardDescription>Last 10 actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sortedActivities.slice(0, 10).map((activity) => {
                  const player = playersWithDetails.find(
                    (p) => p.userId === activity.user_id.toString()
                  );
                  const team = teams[activity.team_index ?? -1];
                  
                  return (
                    <div
                      key={activity._id.toString()}
                      className="text-sm p-2 rounded border"
                    >
                      <div className="flex items-center gap-2">
                        {team && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: team.color }}
                          />
                        )}
                        <span className="font-medium">
                          {activity.user_name || player?.userName || "Unknown"}
                        </span>
                        <span className="text-muted-foreground">
                          {activity.action === "marked" ? "marked" : activity.action}
                        </span>
                        {activity.item_title && (
                          <span className="text-muted-foreground truncate">
                            {activity.item_title}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.created_at).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

