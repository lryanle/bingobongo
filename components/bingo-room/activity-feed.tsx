"use client";

import { useState, useEffect, useRef } from "react";

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

interface ActivityFeedProps {
  readonly activities: Activity[];
  readonly teams: Array<{ name: string; color: string }>;
  readonly players: Array<{ userId: string; teamIndex?: number }>;
}

export default function ActivityFeed({
  activities,
  teams,
  players,
}: ActivityFeedProps) {
  const [hoveredActivityId, setHoveredActivityId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Sort activities by createdAt (oldest first, newest last - for bottom display)
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  // Auto-scroll to bottom when activities change
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      });
    }
  }, [sortedActivities.length, activities.length]);

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

  return (
    <div className="flex flex-col gap-2 h-full min-h-0">
      <h3 className="text-foreground text-lg font-semibold shrink-0">Bingo Activity Feed</h3>
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
    </div>
  );
}

