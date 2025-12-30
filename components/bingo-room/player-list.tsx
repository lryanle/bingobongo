"use client";

import { useState } from "react";
import { Crown, Coins, LogOut, Users, Trophy, Target, TrendingUp, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface Player {
  id: string;
  userId: string;
  userName: string;
  userImage: string;
  teamIndex?: number;
  markedItems: number[];
  joinedAt: string;
  lastActive: string;
}

interface PlayerListProps {
  readonly players: Player[];
  readonly ownerId?: string;
  readonly teams: Array<{ name: string; color: string }>;
  readonly currentUserId?: string;
  readonly selectedTeam?: number;
  readonly onTeamSelect?: (teamIndex: number) => void;
  readonly onKickPlayer?: (userId: string) => void;
}

interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  totalItemsMarked: number;
  totalBingos: number;
  currentWinStreak: number;
  longestWinStreak: number;
  winRate: number;
  avgItemsPerGame: number;
  favoriteGameMode?: string;
}

export default function PlayerList({ players, ownerId, teams, currentUserId, selectedTeam, onTeamSelect, onKickPlayer }: PlayerListProps) {
  const [userStats, setUserStats] = useState<Map<string, UserStats>>(new Map());
  const [loadingStats, setLoadingStats] = useState<Set<string>>(new Set());

  // Fetch stats for a user
  const fetchUserStats = async (userId: string) => {
    if (loadingStats.has(userId) || userStats.has(userId)) return;
    
    setLoadingStats((prev) => new Set(prev).add(userId));
    try {
      const response = await fetch(`/api/users/${userId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setUserStats((prev) => {
          const next = new Map(prev);
          next.set(userId, data.stats);
          return next;
        });
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoadingStats((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const getTeamColor = (teamIndex?: number) => {
    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      return "#6b7280"; // gray
    }
    if (teamIndex === undefined || teamIndex < 0 || teamIndex >= teams.length) {
      return "#6b7280"; // gray
    }
    const team = teams[teamIndex];
    return team?.color || "#6b7280"; // gray fallback
  };

  const getTeamNumber = (teamIndex?: number) => {
    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      return 0;
    }
    if (teamIndex === undefined || teamIndex < 0 || teamIndex >= teams.length) {
      return 0;
    }
    return teamIndex + 1;
  };

  // Calculate points (using markedItems.length as points for now)
  const getPoints = (player: Player) => {
    return player.markedItems.length;
  };

  // Helper function to determine if text should be black or white based on background
  const getContrastColor = (hexColor: string): string => {
    const r = Number.parseInt(hexColor.slice(1, 3), 16);
    const g = Number.parseInt(hexColor.slice(3, 5), 16);
    const b = Number.parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000000" : "#ffffff";
  };

  const isCurrentUser = (player: Player) => {
    return currentUserId && player.userId === currentUserId;
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-foreground text-lg font-semibold">Player List</h3>
      <div className="flex flex-col gap-2">
        {players.map((player) => {
          const isOwner = ownerId === player.userId;
          const teamColor = getTeamColor(player.teamIndex);
          const teamNumber = getTeamNumber(player.teamIndex);
          const points = getPoints(player);
          const isUser = isCurrentUser(player);
          
          const playerRow = (
            <div
              className={`flex items-center gap-2 p-2 rounded-lg ${isUser ? "cursor-pointer bg-muted/50 hover:bg-muted transition-colors" : ""}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Team circle with number */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: teamColor }}
                >
                  {teamNumber}
                </div>
                {/* Crown icon for owner (filled) */}
                {isOwner && (
                  <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                )}
                {/* Player name */}
                <span className="text-foreground text-sm truncate">{player.userName}</span>
              </div>
              {/* Points badge */}
              <Badge variant="secondary" className="shrink-0 flex items-center gap-1">
                <Coins className="w-3 h-3" />
                <span>{points}</span>
              </Badge>
            </div>
          );

          // Wrap all players in popover for profile view
          const stats = userStats.get(player.userId);
          const isLoading = loadingStats.has(player.userId);
          
          return (
            <Popover key={player.id} onOpenChange={(open) => {
              if (open && !stats && !isLoading) {
                fetchUserStats(player.userId);
              }
            }}>
              <PopoverTrigger asChild>
                <div className="cursor-pointer">{playerRow}</div>
              </PopoverTrigger>
              <PopoverContent className="w-96">
                <div className="flex flex-col gap-4">
                  {/* Profile Header */}
                  <div className="flex items-center gap-3">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={player.userImage} alt={player.userName} />
                      <AvatarFallback className="text-lg">
                        {player.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-foreground font-semibold text-base truncate">
                          {player.userName}
                        </h4>
                        {isOwner && (
                          <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: teamColor }}
                        />
                        <span className="text-sm text-muted-foreground truncate">
                          {teams[player.teamIndex ?? 0]?.name || "No Team"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Current Match Stats */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-foreground">Current Match</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Coins className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Items Marked</div>
                          <div className="text-sm font-semibold">{points}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-xs text-muted-foreground">Team</div>
                          <div className="text-sm font-semibold">#{teamNumber}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Lifetime Stats */}
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-foreground">Lifetime Stats</h5>
                    {isLoading ? (
                      <div className="text-sm text-muted-foreground text-center py-2">
                        Loading stats...
                      </div>
                    ) : stats ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground">Games Won</div>
                            <div className="text-sm font-semibold">{stats.gamesWon}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <Target className="w-4 h-4 text-blue-500" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground">Games Played</div>
                            <div className="text-sm font-semibold">{stats.gamesPlayed}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground">Win Rate</div>
                            <div className="text-sm font-semibold">{stats.winRate}%</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <Award className="w-4 h-4 text-purple-500" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground">Win Streak</div>
                            <div className="text-sm font-semibold">{stats.currentWinStreak}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <Coins className="w-4 h-4 text-orange-500" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground">Total Items</div>
                            <div className="text-sm font-semibold">{stats.totalItemsMarked}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                          <Users className="w-4 h-4 text-red-500" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-muted-foreground">Avg/Game</div>
                            <div className="text-sm font-semibold">{stats.avgItemsPerGame}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-2">
                        No stats available
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {isUser && onTeamSelect && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h5 className="text-sm font-semibold text-foreground">Switch Team</h5>
                        <div className="flex flex-col gap-2">
                          {teams.map((team, index) => {
                            const isSelected = selectedTeam === index;
                            const textColor = getContrastColor(team.color);
                            
                            return (
                              <Button
                                key={`${team.name}-${team.color}`}
                                onClick={() => onTeamSelect(index)}
                                className="w-full justify-start transition-all"
                                variant={isSelected ? "default" : "outline"}
                                style={{
                                  backgroundColor: isSelected ? team.color : undefined,
                                  color: isSelected ? textColor : undefined,
                                  border: isSelected ? `2px solid ${team.color}` : undefined,
                                }}
                              >
                                <div
                                  className="w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: team.color }}
                                />
                                {team.name}
                                {isSelected && " ✓"}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Kick Button (Owner only, not for self) */}
                  {/* Show kick button if current user is owner AND this player is not the current user */}
                  {ownerId === currentUserId && !isUser && onKickPlayer && (
                    <>
                      <Separator />
                      <Button
                        onClick={() => onKickPlayer(player.userId)}
                        variant="destructive"
                        className="w-full"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Kick Player
                      </Button>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
        {players.length === 0 && (
          <p className="text-muted-foreground text-sm">No players yet</p>
        )}
      </div>
    </div>
  );
}

