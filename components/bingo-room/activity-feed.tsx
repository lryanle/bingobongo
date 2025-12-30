"use client";

import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Trophy, Users, User } from "lucide-react";

interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  itemTitle?: string;
  cellIndex?: number;
  teamIndex?: number;
  createdAt: string;
}

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

interface ActivityFeedProps {
  readonly activities: Activity[];
  readonly teams: Array<{ name: string; color: string }>;
  readonly players: Array<{ userId: string; teamIndex?: number }>;
  readonly fullPlayers?: Player[];
  readonly claimedItems?: Array<{
    cellIndex: number;
    teamIndex: number;
    claimedAt: Date | string;
    claimedBy: string;
  }>;
  readonly currentUserId?: string;
}

export default function ActivityFeed({
  activities,
  teams,
  players,
  fullPlayers = [],
  claimedItems = [],
  currentUserId,
}: ActivityFeedProps) {
  const [hoveredActivityId, setHoveredActivityId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastActivityIdRef = useRef<string | null>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Sort activities by createdAt (oldest first, newest last - for bottom display)
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  // Check if user is near the bottom of the scroll container
  const isNearBottom = () => {
    if (!scrollContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const threshold = 100; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  };
  
  // Auto-scroll to bottom when new activities are added
  useEffect(() => {
    const latestActivity = sortedActivities.at(-1);
    const latestActivityId = latestActivity?.id;
    
    // Only auto-scroll if:
    // 1. There's a new activity (ID changed)
    // 2. User is near the bottom (or it's the first activity)
    // 3. User isn't actively scrolling
    if (latestActivityId && latestActivityId !== lastActivityIdRef.current) {
      const shouldAutoScroll = lastActivityIdRef.current === null || (isNearBottom() && !isUserScrollingRef.current);
      
      if (shouldAutoScroll && scrollContainerRef.current) {
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
              top: scrollContainerRef.current.scrollHeight,
              behavior: 'smooth',
            });
          }
        });
      }
      
      lastActivityIdRef.current = latestActivityId;
    }
  }, [sortedActivities]);
  
  // Track user scrolling to prevent auto-scroll when user is reading old messages
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      isUserScrollingRef.current = true;
      
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Reset scrolling flag after user stops scrolling for 1 second
      scrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 1000);
    };
    
    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const getTeamInfo = (teamIndex?: number) => {
    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      return { color: "#6b7280", number: 0 };
    }
    if (teamIndex === undefined || teamIndex < 0 || teamIndex >= teams.length) {
      return { color: "#6b7280", number: 0 };
    }
    const team = teams[teamIndex];
    return { 
      color: team?.color || "#6b7280", 
      number: teamIndex + 1 
    };
  };

  const formatTimestamp = (createdAt: string): string => {
    const date = new Date(createdAt);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isSameYear = date.getFullYear() === now.getFullYear();

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };

    if (isToday) {
      return date.toLocaleTimeString(undefined, timeOptions);
    } else if (isSameYear) {
      const dateOptions: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
      };
      return `${date.toLocaleDateString(undefined, dateOptions)} ${date.toLocaleTimeString(undefined, timeOptions)}`;
    } else {
      const dateOptions: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
      };
      return `${date.toLocaleDateString(undefined, dateOptions)} ${date.toLocaleTimeString(undefined, timeOptions)}`;
    }
  };

  const formatActivity = (activity: Activity) => {
    // Use stored team_index from activity (for historic events) or fallback to current player team
    const teamIndex = activity.teamIndex ?? players.find((p) => p.userId === activity.userId)?.teamIndex;
    const teamInfo = getTeamInfo(teamIndex);
    
    const timestamp = formatTimestamp(activity.createdAt);
    const isHovered = hoveredActivityId === activity.id;

    if (activity.action === "marked" && activity.itemTitle) {
      return (
        <div 
          key={activity.id} 
          className="flex items-center gap-2 text-sm group"
          role="none"
          tabIndex={-1}
          onMouseEnter={() => setHoveredActivityId(activity.id)}
          onMouseLeave={() => setHoveredActivityId(null)}
        >
          {/* Team circle with number */}
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: teamInfo.color }}
          >
            {teamInfo.number}
          </div>
          {/* Username and action */}
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span
              className="font-semibold text-foreground"
              style={{ color: teamInfo.color }}
            >
              {activity.userName}
            </span>
            <span className="text-muted-foreground">has marked</span>
            <span className="text-foreground font-medium truncate">{activity.itemTitle}</span>
          </div>
          {isHovered && (
            <span className="text-muted-foreground/30 text-xs font-mono shrink-0">
              {timestamp}
            </span>
          )}
        </div>
      );
    }
    
    if (activity.action === "unmarked" && activity.itemTitle) {
      return (
        <div 
          key={activity.id} 
          className="flex items-center gap-2 text-sm group"
          role="none"
          tabIndex={-1}
          onMouseEnter={() => setHoveredActivityId(activity.id)}
          onMouseLeave={() => setHoveredActivityId(null)}
        >
          {/* Team circle with number */}
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: teamInfo.color }}
          >
            {teamInfo.number}
          </div>
          {/* Username and action */}
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span
              className="font-semibold text-foreground"
              style={{ color: teamInfo.color }}
            >
              {activity.userName}
            </span>
            <span className="text-muted-foreground">has unmarked</span>
            <span className="text-foreground font-medium truncate">{activity.itemTitle}</span>
          </div>
          {isHovered && (
            <span className="text-muted-foreground/30 text-xs font-mono shrink-0">
              {timestamp}
            </span>
          )}
        </div>
      );
    }
    
    if (activity.action === "claimed" && activity.itemTitle) {
      return (
        <div 
          key={activity.id} 
          className="flex items-center gap-2 text-sm group"
          role="none"
          tabIndex={-1}
          onMouseEnter={() => setHoveredActivityId(activity.id)}
          onMouseLeave={() => setHoveredActivityId(null)}
        >
          {/* Team circle with number */}
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: teamInfo.color }}
          >
            {teamInfo.number}
          </div>
          {/* Username and action */}
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span
              className="font-semibold text-foreground"
              style={{ color: teamInfo.color }}
            >
              {activity.userName}
            </span>
            <span className="text-muted-foreground">claimed</span>
            <span className="text-foreground font-medium truncate">{activity.itemTitle}</span>
          </div>
          {isHovered && (
            <span className="text-muted-foreground/30 text-xs font-mono shrink-0">
              {timestamp}
            </span>
          )}
        </div>
      );
    }
    
    if (activity.action === "unclaimed" && activity.itemTitle) {
      return (
        <div 
          key={activity.id} 
          className="flex items-center gap-2 text-sm group"
          role="none"
          tabIndex={-1}
          onMouseEnter={() => setHoveredActivityId(activity.id)}
          onMouseLeave={() => setHoveredActivityId(null)}
        >
          {/* Team circle with number */}
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: teamInfo.color }}
          >
            {teamInfo.number}
          </div>
          {/* Username and action */}
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span
              className="font-semibold text-foreground"
              style={{ color: teamInfo.color }}
            >
              {activity.userName}
            </span>
            <span className="text-muted-foreground">unclaimed</span>
            <span className="text-foreground font-medium truncate">{activity.itemTitle}</span>
          </div>
          {isHovered && (
            <span className="text-muted-foreground/30 text-xs font-mono shrink-0">
              {timestamp}
            </span>
          )}
        </div>
      );
    }
    
    if (activity.action === "win") {
      return (
        <div 
          key={activity.id} 
          className="flex items-center gap-2 text-sm group"
          role="none"
          tabIndex={-1}
          onMouseEnter={() => setHoveredActivityId(activity.id)}
          onMouseLeave={() => setHoveredActivityId(null)}
        >
          {/* Team circle with number */}
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: teamInfo.color }}
          >
            {teamInfo.number}
          </div>
          {/* Username and action */}
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span className="text-muted-foreground">🎉</span>
            <span
              className="font-semibold text-foreground"
              style={{ color: teamInfo.color }}
            >
              {teamInfo.number > 0 ? `Team ${teamInfo.number}` : "Unknown Team"}
            </span>
            <span className="text-muted-foreground">won the game!</span>
          </div>
          {isHovered && (
            <span className="text-muted-foreground/30 text-xs font-mono shrink-0">
              {timestamp}
            </span>
          )}
        </div>
      );
    }
    
    if (activity.action === "board-reset") {
      return (
        <div 
          key={activity.id} 
          className="flex items-center gap-2 text-sm group"
          role="none"
          tabIndex={-1}
          onMouseEnter={() => setHoveredActivityId(activity.id)}
          onMouseLeave={() => setHoveredActivityId(null)}
        >
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 bg-muted">
            🔄
          </div>
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span className="font-semibold text-foreground">{activity.userName}</span>
            <span className="text-muted-foreground">reset the board</span>
          </div>
          {isHovered && (
            <span className="text-muted-foreground/30 text-xs font-mono shrink-0">
              {timestamp}
            </span>
          )}
        </div>
      );
    }
    
    if (activity.action === "joined") {
      return (
        <div 
          key={activity.id} 
          className="flex items-center gap-2 text-sm text-muted-foreground group"
          role="none"
          tabIndex={-1}
          onMouseEnter={() => setHoveredActivityId(activity.id)}
          onMouseLeave={() => setHoveredActivityId(null)}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: teamInfo.color }}
          >
            {teamInfo.number}
          </div>
          <span
            className="font-semibold"
            style={{ color: teamInfo.color }}
          >
            {activity.userName}
          </span>
          <span>joined the room</span>
          {isHovered && (
            <span className="text-muted-foreground/30 text-xs font-mono shrink-0 ml-auto">
              {timestamp}
            </span>
          )}
        </div>
      );
    }
    
    if (activity.action === "left") {
      return (
        <div 
          key={activity.id} 
          className="flex items-center gap-2 text-sm text-muted-foreground group"
          role="none"
          tabIndex={-1}
          onMouseEnter={() => setHoveredActivityId(activity.id)}
          onMouseLeave={() => setHoveredActivityId(null)}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: teamInfo.color }}
          >
            {teamInfo.number}
          </div>
          <span
            className="font-semibold"
            style={{ color: teamInfo.color }}
          >
            {activity.userName}
          </span>
          <span>left the room</span>
          {isHovered && (
            <span className="text-muted-foreground/30 text-xs font-mono shrink-0 ml-auto">
              {timestamp}
            </span>
          )}
        </div>
      );
    }
    
    if (activity.action === "team-changed") {
      const teamName = teamIndex !== undefined && teams[teamIndex] 
        ? teams[teamIndex].name 
        : `Team ${teamInfo.number}`;
      return (
        <div 
          key={activity.id} 
          className="flex items-center gap-2 text-sm text-muted-foreground group"
          role="none"
          tabIndex={-1}
          onMouseEnter={() => setHoveredActivityId(activity.id)}
          onMouseLeave={() => setHoveredActivityId(null)}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: teamInfo.color }}
          >
            {teamInfo.number}
          </div>
          <span
            className="font-semibold"
            style={{ color: teamInfo.color }}
          >
            {activity.userName}
          </span>
          <span>changed to {teamName}</span>
          {isHovered && (
            <span className="text-muted-foreground/30 text-xs font-mono shrink-0 ml-auto">
              {timestamp}
            </span>
          )}
        </div>
      );
    }

    if (activity.action === "disconnected") {
      return (
        <div 
          key={activity.id} 
          className="flex items-center gap-2 text-sm text-muted-foreground group"
          role="none"
          tabIndex={-1}
          onMouseEnter={() => setHoveredActivityId(activity.id)}
          onMouseLeave={() => setHoveredActivityId(null)}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: teamInfo.color }}
          >
            {teamInfo.number}
          </div>
          <span
            className="font-semibold"
            style={{ color: teamInfo.color }}
          >
            {activity.userName}
          </span>
          <span>disconnected</span>
          {isHovered && (
            <span className="text-muted-foreground/30 text-xs font-mono shrink-0 ml-auto">
              {timestamp}
            </span>
          )}
        </div>
      );
    }

    if (activity.action === "reconnected") {
      return (
        <div 
          key={activity.id} 
          className="flex items-center gap-2 text-sm text-muted-foreground group"
          role="none"
          tabIndex={-1}
          onMouseEnter={() => setHoveredActivityId(activity.id)}
          onMouseLeave={() => setHoveredActivityId(null)}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: teamInfo.color }}
          >
            {teamInfo.number}
          </div>
          <span
            className="font-semibold"
            style={{ color: teamInfo.color }}
          >
            {activity.userName}
          </span>
          <span>reconnected</span>
          {isHovered && (
            <span className="text-muted-foreground/30 text-xs font-mono shrink-0 ml-auto">
              {timestamp}
            </span>
          )}
        </div>
      );
    }
    
    return null;
  };

  // Calculate leaderboard stats
  const calculateLeaderboard = () => {
    // Individual stats (by user)
    const userStats = new Map<string, {
      userId: string;
      userName: string;
      userImage: string;
      teamIndex?: number;
      claimedCount: number;
      markedCount: number;
    }>();

    // Count claims per user
    claimedItems.forEach((item) => {
      const existing = userStats.get(item.claimedBy) || {
        userId: item.claimedBy,
        userName: fullPlayers.find((p) => p.userId === item.claimedBy)?.userName || "Unknown",
        userImage: fullPlayers.find((p) => p.userId === item.claimedBy)?.userImage || "",
        teamIndex: item.teamIndex,
        claimedCount: 0,
        markedCount: 0,
      };
      existing.claimedCount++;
      userStats.set(item.claimedBy, existing);
    });

    // Count marked items per user (for lockout mode)
    fullPlayers.forEach((player) => {
      const existing = userStats.get(player.userId) || {
        userId: player.userId,
        userName: player.userName,
        userImage: player.userImage,
        teamIndex: player.teamIndex,
        claimedCount: 0,
        markedCount: 0,
      };
      existing.markedCount = player.markedItems.length;
      existing.teamIndex = player.teamIndex;
      userStats.set(player.userId, existing);
    });

    // Team stats
    const teamStats = teams.map((team, index) => {
      const teamClaims = claimedItems.filter((item) => item.teamIndex === index);
      const teamPlayers = fullPlayers.filter((p) => p.teamIndex === index);
      const teamMarked = teamPlayers.reduce((sum, p) => sum + p.markedItems.length, 0);
      
      return {
        teamIndex: index,
        teamName: team.name,
        teamColor: team.color,
        claimedCount: teamClaims.length,
        markedCount: teamMarked,
        playerCount: teamPlayers.length,
      };
    });

    return {
      userStats: Array.from(userStats.values()).toSorted((a, b) => {
        const aTotal = a.claimedCount + a.markedCount;
        const bTotal = b.claimedCount + b.markedCount;
        return bTotal - aTotal;
      }),
      teamStats: teamStats.toSorted((a, b) => {
        const aTotal = a.claimedCount + a.markedCount;
        const bTotal = b.claimedCount + b.markedCount;
        return bTotal - aTotal;
      }),
    };
  };

  const leaderboard = calculateLeaderboard();
  const [showLobbyStats, setShowLobbyStats] = useState(false);

  return (
    <div className="flex flex-col gap-2 h-full min-h-0">
      <Tabs defaultValue="activity" className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2 shrink-0">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="activity" className="flex-1 min-h-0 flex flex-col mt-2">
          <h3 className="text-foreground text-lg font-semibold shrink-0 mb-2">Bingo Activity Feed</h3>
          <div 
            ref={scrollContainerRef}
            className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0"
          >
            {sortedActivities.length === 0 ? (
              <p className="text-muted-foreground text-sm">No activity yet</p>
            ) : (
              sortedActivities.map(formatActivity)
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="leaderboard" className="flex-1 min-h-0 flex flex-col mt-2">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <h3 className="text-foreground text-lg font-semibold">Leaderboard</h3>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={showLobbyStats}
                  onChange={(e) => setShowLobbyStats(e.target.checked)}
                  className="w-3 h-3"
                />
                Lobby Stats
              </label>
            </div>
          </div>
          
          <div className="flex-1 min-h-0 overflow-y-auto">
            {showLobbyStats ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4" />
                    <h4 className="font-semibold text-sm">By Team</h4>
                  </div>
                  <div className="space-y-2">
                    {leaderboard.teamStats.map((team, idx) => (
                      <Card key={team.teamIndex} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: team.teamColor }}
                            />
                            <span className="font-medium">{team.teamName}</span>
                            {idx === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">{team.claimedCount} claimed</span>
                            <span className="text-muted-foreground">{team.markedCount} marked</span>
                            <span className="font-semibold">{team.claimedCount + team.markedCount} total</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    <h4 className="font-semibold text-sm">By User</h4>
                  </div>
                  <div className="space-y-2">
                    {leaderboard.userStats.map((user, idx) => {
                      const team = user.teamIndex !== undefined ? teams[user.teamIndex] : undefined;
                      return (
                        <Card 
                          key={user.userId} 
                          className={`p-3 cursor-pointer hover:bg-muted/50 ${user.userId === currentUserId ? "border-2 border-primary" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {team && (
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: team.color }}
                                />
                              )}
                              <span className="font-medium">{user.userName}</span>
                              {idx === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">{user.claimedCount} claimed</span>
                              <span className="text-muted-foreground">{user.markedCount} marked</span>
                              <span className="font-semibold">{user.claimedCount + user.markedCount} total</span>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4" />
                    <h4 className="font-semibold text-sm">Team Stats</h4>
                  </div>
                  <div className="space-y-2">
                    {leaderboard.teamStats.map((team, idx) => (
                      <Card key={team.teamIndex} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: team.teamColor }}
                            />
                            <span className="font-medium">{team.teamName}</span>
                            {idx === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">{team.claimedCount} claimed</span>
                            <span className="text-muted-foreground">{team.markedCount} marked</span>
                            <span className="font-semibold">{team.claimedCount + team.markedCount} total</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    <h4 className="font-semibold text-sm">Your Stats</h4>
                  </div>
                  {currentUserId && leaderboard.userStats.find((u) => u.userId === currentUserId) ? (
                    <Card className="p-3 border-2 border-primary">
                      {(() => {
                        const user = leaderboard.userStats.find((u) => u.userId === currentUserId)!;
                        const team = user.teamIndex !== undefined ? teams[user.teamIndex] : undefined;
                        return (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {team && (
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: team.color }}
                                />
                              )}
                              <span className="font-medium">{user.userName}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">{user.claimedCount} claimed</span>
                              <span className="text-muted-foreground">{user.markedCount} marked</span>
                              <span className="font-semibold">{user.claimedCount + user.markedCount} total</span>
                            </div>
                          </div>
                        );
                      })()}
                    </Card>
                  ) : (
                    <Card className="p-3">
                      <p className="text-muted-foreground text-sm">No stats available</p>
                    </Card>
                  )}
                  
                  {currentUserId && (() => {
                    const currentUser = leaderboard.userStats.find((u) => u.userId === currentUserId);
                    if (!currentUser) return null;
                    const userTeam = currentUser.teamIndex !== undefined ? teams[currentUser.teamIndex] : undefined;
                    if (!userTeam) return null;
                    
                    const teamMembers = leaderboard.userStats.filter((u) => u.teamIndex === currentUser.teamIndex);
                    const teamStats = leaderboard.teamStats.find((t) => t.teamIndex === currentUser.teamIndex);
                    
                    return (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: userTeam.color }}
                          />
                          <h4 className="font-semibold text-sm">{userTeam.name} Stats</h4>
                        </div>
                        {teamStats && (
                          <Card className="p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Team Total</span>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">{teamStats.claimedCount} claimed</span>
                                <span className="text-muted-foreground">{teamStats.markedCount} marked</span>
                                <span className="font-semibold">{teamStats.claimedCount + teamStats.markedCount} total</span>
                              </div>
                            </div>
                          </Card>
                        )}
                        <div className="mt-2 space-y-1">
                          {teamMembers.map((member) => (
                            <Card key={member.userId} className="p-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className={member.userId === currentUserId ? "font-semibold" : ""}>
                                  {member.userName}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className="text-muted-foreground">{member.claimedCount} claimed</span>
                                  <span className="text-muted-foreground">{member.markedCount} marked</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

