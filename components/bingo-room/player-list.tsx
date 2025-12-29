"use client";

import { Crown, Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

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
}

export default function PlayerList({ players, ownerId, teams, currentUserId, selectedTeam, onTeamSelect }: PlayerListProps) {
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

          // If this is the current user, wrap in popover for team selection
          if (isUser && onTeamSelect) {
            return (
              <Popover key={player.id}>
                <PopoverTrigger asChild>
                  {playerRow}
                </PopoverTrigger>
                <PopoverContent className="w-56">
                  <div className="flex flex-col gap-2">
                    <h4 className="text-foreground font-semibold text-sm">Select Team</h4>
                    <div className="flex flex-col gap-2">
                      {teams.map((team, index) => {
                        const isSelected = selectedTeam === index;
                        const textColor = getContrastColor(team.color);
                        
                        return (
                          <Button
                            key={`${team.name}-${team.color}`}
                            onClick={() => onTeamSelect(index)}
                            className="w-full justify-start transition-all"
                            style={{
                              backgroundColor: isSelected ? team.color : `${team.color}80`,
                              color: textColor,
                              border: isSelected ? `2px solid ${team.color}` : "1px solid transparent",
                            }}
                          >
                            {team.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            );
          }

          return <div key={player.id}>{playerRow}</div>;
        })}
        {players.length === 0 && (
          <p className="text-muted-foreground text-sm">No players yet</p>
        )}
      </div>
    </div>
  );
}

