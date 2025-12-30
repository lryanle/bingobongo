"use client";

import { useEffect, useState, useLayoutEffect, useRef } from "react";
import BingoCard, { BingoCardProps } from "@/components/bingo-card/bingocard";
import PlayerList from "./player-list";
import ActivityFeed from "./activity-feed";
import RoomLink from "./room-link";
import ActionButtons from "./action-buttons";
import Confetti from "./confetti";
import WinModal from "./win-modal";
import { generateBingoData, getGridSize } from "@/lib/bingo-utils";
import { pusherClient } from "@/lib/pusher";
import { useSession } from "@/lib/auth-client";

interface BingoRoomProps {
  readonly roomId: string;
  readonly initialRoom: {
    id: string;
    roomName: string;
    bingoSeed: string;
    gameMode: string;
    boardSize: number;
    teams: Array<{ name: string; color: string }>;
    ownerId: string;
    bingoItems?: string[];
    claimedItems?: Array<{
      cellIndex: number;
      teamIndex: number;
      claimedAt: Date | string;
      claimedBy: string;
    }>;
    gameFinished?: boolean;
    winningTeam?: number;
    restartVotes?: string[];
    restartCountdown?: number;
  };
  readonly initialPlayers: Array<{
    id: string;
    userId: string;
    userName: string;
    userImage: string;
    teamIndex?: number;
    markedItems: number[];
    joinedAt: string;
    lastActive: string;
  }>;
  readonly initialActivities: Array<{
    id: string;
    userId: string;
    userName: string;
    action: string;
    itemTitle?: string;
    cellIndex?: number;
    teamIndex?: number;
    createdAt: string;
  }>;
  readonly initialMarkedItems?: number[];
}

export default function BingoRoom({
  roomId,
  initialRoom,
  initialPlayers,
  initialActivities,
  initialMarkedItems = [],
}: BingoRoomProps) {
  const session = useSession();
  const [players, setPlayers] = useState(initialPlayers);
  const [activities, setActivities] = useState(initialActivities);
  const [markedItems, setMarkedItems] = useState<number[]>(initialMarkedItems);
  const [claimedItems, setClaimedItems] = useState<Array<{
    cellIndex: number;
    teamIndex: number;
    claimedAt: Date | string;
    claimedBy: string;
  }>>(initialRoom.claimedItems || []);
  const [gameFinished, setGameFinished] = useState(initialRoom.gameFinished || false);
  const [winningTeam, setWinningTeam] = useState<number | undefined>(initialRoom.winningTeam);
  const [winningLines, setWinningLines] = useState<Array<{ type: 'row' | 'col' | 'diag'; index: number; cells: number[] }>>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWinModal, setShowWinModal] = useState(initialRoom.gameFinished || false);
  const [restartVotes, setRestartVotes] = useState<number>(initialRoom.restartVotes?.length || 0);
  const [restartCountdown, setRestartCountdown] = useState<number | undefined>(initialRoom.restartCountdown);
  const [restartScheduledAt, setRestartScheduledAt] = useState<string | undefined>(undefined);
  const [bingoItems, setBingoItems] = useState<string[]>(initialRoom.bingoItems || []);
  const [hasVoted, setHasVoted] = useState(
    initialRoom.restartVotes?.includes(session.data?.user?.id || "") || false
  );
  
  // Initialize selectedTeam to 0 (first team) by default
  // This allows new users to join immediately without waiting
  // The useEffect below will update it to the actual team when session loads
  // if the user is already in the room
  const [selectedTeam, setSelectedTeam] = useState<number>(0);
  
  // Update selectedTeam when session data becomes available
  useEffect(() => {
    const currentUserId = session.data?.user?.id;
    if (currentUserId) {
      const currentPlayer = players.find((p) => p.userId === currentUserId);
      if (currentPlayer?.teamIndex !== undefined && currentPlayer.teamIndex !== selectedTeam) {
        setSelectedTeam(currentPlayer.teamIndex);
      }
    }
  }, [session.data?.user?.id, players, selectedTeam]);

  // Ensure teams is always an array
  const teams = initialRoom.teams && Array.isArray(initialRoom.teams) && initialRoom.teams.length > 0
    ? initialRoom.teams
    : [{ name: "Team 1", color: "#6b7280" }, { name: "Team 2", color: "#1d4ed8" }];

  // Generate bingo data using stored items (empty at start if not provided)
  const gridSize = getGridSize(initialRoom.boardSize);
  const bingoData = generateBingoData(
    initialRoom.bingoSeed,
    gridSize,
    teams,
    bingoItems // Use stored items (empty strings if not provided)
  );

  // Check if this is lockout mode
  const isLockout = initialRoom.gameMode.includes("lockout");

  // Check if a cell is part of a winning line
  const isWinningCell = (cellIndex: number): boolean => {
    return winningLines.some((line) => line.cells.includes(cellIndex));
  };

  // Update bingo data with claimed states and onClick handlers
  const updatedBingoData: BingoCardProps["bingoData"] = bingoData.map(
    (cell, index) => {
      const claimedItem = claimedItems.find((item) => item.cellIndex === index);
      const claimedTeam = claimedItem ? teams[claimedItem.teamIndex] : undefined;
      const isWinning = isWinningCell(index);
      const winningTeamData = winningTeam !== undefined ? teams[winningTeam] : undefined;
      
      // Add team circles to slot items for all teams that claimed this cell
      // Multiple teams can claim the same cell
      let updatedSlotItems = cell.slotItems || [];
      const allClaimsForCell = claimedItems.filter((item) => item.cellIndex === index);
      if (allClaimsForCell.length > 0) {
        // Add a team circle for each team that claimed this cell
        updatedSlotItems = allClaimsForCell.map((claim) => {
          const team = teams[claim.teamIndex];
          return {
            color: team?.color || "#6b7280",
            number: claim.teamIndex + 1, // Team number (1-indexed)
          };
        });
      }
      
      // Use the first claim for claimedBy (for tooltip/display purposes)
      const firstClaim = allClaimsForCell[0];
      const firstClaimedTeam = firstClaim ? teams[firstClaim.teamIndex] : undefined;
      
      return {
        ...cell,
        slotItems: updatedSlotItems,
        disabled: isLockout ? markedItems.includes(index) : false, // Only disable in lockout mode
        claimedBy: firstClaim ? {
          teamIndex: firstClaim.teamIndex,
          teamColor: firstClaimedTeam?.color || "#6b7280",
          claimedAt: typeof firstClaim.claimedAt === 'string' 
            ? new Date(firstClaim.claimedAt) 
            : firstClaim.claimedAt,
        } : undefined,
        isWinning: isWinning && winningTeamData ? {
          teamColor: winningTeamData.color,
        } : undefined,
        onClick: () => handleCellClick(index),
      };
    }
  );

  // Join room on mount and when selectedTeam changes
  // Only join if we have a session (user is authenticated) and selectedTeam is defined
  useEffect(() => {
    const currentUserId = session.data?.user?.id;
    if (!currentUserId) {
      // Wait for session to load before joining
      return;
    }

    // selectedTeam is always defined (defaults to 0 for new users)

    const joinRoom = async () => {
      try {
        await fetch(`/api/rooms/${roomId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamIndex: selectedTeam }),
        });
      } catch (error) {
        console.error("Error joining room:", error);
      }
    };

    joinRoom();
  }, [roomId, selectedTeam, session.data?.user?.id]);

  // Track connection status for disconnect/reconnect
  useEffect(() => {
    let wasConnected = true;
    let disconnectTimeout: NodeJS.Timeout | null = null;
    let lastDisconnectTime = 0;
    const DEBOUNCE_MS = 3000; // Don't report disconnect/reconnect more than once every 3 seconds

    const reportDisconnect = () => {
      const now = Date.now();
      if (wasConnected && now - lastDisconnectTime > DEBOUNCE_MS) {
        wasConnected = false;
        lastDisconnectTime = now;
        
        // Use fetch with keepalive for reliability when page is closing
        const blob = new Blob([JSON.stringify({ action: "disconnected" })], {
          type: "application/json",
        });
        
        if (navigator.sendBeacon) {
          navigator.sendBeacon(`/api/rooms/${roomId}/connection`, blob);
        } else {
          fetch(`/api/rooms/${roomId}/connection`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "disconnected" }),
            keepalive: true,
          }).catch(() => {}); // Ignore errors on disconnect
        }
      }
    };

    const reportReconnect = () => {
      const now = Date.now();
      if (!wasConnected && now - lastDisconnectTime > DEBOUNCE_MS) {
        wasConnected = true;
        lastDisconnectTime = now; // Update timing to prevent rapid reconnect attempts
        fetch(`/api/rooms/${roomId}/connection`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reconnected" }),
        }).catch(() => {}); // Ignore errors
      }
    };

    // Track Pusher connection state
    pusherClient.connection.bind("disconnected", () => {
      if (disconnectTimeout) {
        clearTimeout(disconnectTimeout);
      }
      disconnectTimeout = setTimeout(reportDisconnect, 3000); // Wait 3s to see if it reconnects
    });

    pusherClient.connection.bind("connected", () => {
      if (disconnectTimeout) {
        clearTimeout(disconnectTimeout);
        disconnectTimeout = null;
      }
      reportReconnect();
    });

    // Track browser visibility (tab hidden/visible)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (disconnectTimeout) {
          clearTimeout(disconnectTimeout);
        }
        disconnectTimeout = setTimeout(reportDisconnect, 10000); // Wait 10s before reporting disconnect (tab might just be hidden briefly)
      } else {
        if (disconnectTimeout) {
          clearTimeout(disconnectTimeout);
          disconnectTimeout = null;
        }
        reportReconnect();
      }
    };

    // Track network online/offline
    const handleOnline = () => {
      if (disconnectTimeout) {
        clearTimeout(disconnectTimeout);
        disconnectTimeout = null;
      }
      reportReconnect();
    };

    const handleOffline = () => {
      if (disconnectTimeout) {
        clearTimeout(disconnectTimeout);
      }
      disconnectTimeout = setTimeout(reportDisconnect, 3000);
    };

    // Track beforeunload (page closing)
    const handleBeforeUnload = () => {
      reportDisconnect();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    globalThis.addEventListener("online", handleOnline);
    globalThis.addEventListener("offline", handleOffline);
    globalThis.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (disconnectTimeout) {
        clearTimeout(disconnectTimeout);
      }
      pusherClient.connection.unbind("disconnected");
      pusherClient.connection.unbind("connected");
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      globalThis.removeEventListener("online", handleOnline);
      globalThis.removeEventListener("offline", handleOffline);
      globalThis.removeEventListener("beforeunload", handleBeforeUnload);
      // Don't report disconnect on cleanup - let beforeunload handle it
    };
  }, [roomId]);

  // Set up Pusher real-time updates
  useEffect(() => {
    const channel = pusherClient.subscribe(`room-${roomId}`);

    channel.bind("player-joined", (data: { userId: string; userName: string }) => {
      fetch(`/api/rooms/${roomId}/players`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch players: ${res.status}`);
          }
          return res.json();
        })
        .then((newPlayers) => setPlayers(newPlayers))
        .catch((err) => console.error("Error fetching players:", err));
      
      fetch(`/api/rooms/${roomId}/activities?limit=50`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch activities: ${res.status}`);
          }
          return res.json();
        })
        .then((newActivities) => setActivities(newActivities))
        .catch((err) => console.error("Error fetching activities:", err));
    });

    channel.bind("player-left", (data: { userId: string; userName: string }) => {
      fetch(`/api/rooms/${roomId}/players`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch players: ${res.status}`);
          }
          return res.json();
        })
        .then((newPlayers) => setPlayers(newPlayers))
        .catch((err) => console.error("Error fetching players:", err));
      
      fetch(`/api/rooms/${roomId}/activities?limit=50`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch activities: ${res.status}`);
          }
          return res.json();
        })
        .then((newActivities) => setActivities(newActivities))
        .catch((err) => console.error("Error fetching activities:", err));
    });

    channel.bind("player-disconnected", (data: { userId: string; userName: string }) => {
      fetch(`/api/rooms/${roomId}/activities?limit=50`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch activities: ${res.status}`);
          }
          return res.json();
        })
        .then((newActivities) => setActivities(newActivities))
        .catch((err) => console.error("Error fetching activities:", err));
    });

    channel.bind("player-reconnected", (data: { userId: string; userName: string }) => {
      fetch(`/api/rooms/${roomId}/activities?limit=50`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch activities: ${res.status}`);
          }
          return res.json();
        })
        .then((newActivities) => setActivities(newActivities))
        .catch((err) => console.error("Error fetching activities:", err));
    });

    channel.bind("team-changed", (data: { userId: string; userName: string; teamIndex: number }) => {
      // Refresh players for all users
      fetch(`/api/rooms/${roomId}/players`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch players: ${res.status}`);
          }
          return res.json();
        })
        .then((newPlayers) => setPlayers(newPlayers))
        .catch((err) => console.error("Error fetching players:", err));
      
      // For current user's own team change, don't refresh activities (optimistic update already handled it)
      // For other users, refresh activities normally
      if (data.userId !== session.data?.user?.id) {
        fetch(`/api/rooms/${roomId}/activities?limit=50`)
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Failed to fetch activities: ${res.status}`);
            }
            return res.json();
          })
          .then((newActivities) => {
            // Deduplicate activities by ID and sort by createdAt
            setActivities((prev) => {
              const existingIds = new Set(prev.map(a => a.id));
              const allActivities = [...prev, ...newActivities.filter((a: typeof newActivities[0]) => !existingIds.has(a.id))];
              // Remove duplicates by ID (keep first occurrence)
              const uniqueActivities = Array.from(
                new Map(allActivities.map(a => [a.id, a])).values()
              );
              return uniqueActivities.sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
            });
          })
          .catch((err) => console.error("Error fetching activities:", err));
      }
    });

    // Listen for item-claimed events (team-based claiming)
    channel.bind("item-claimed", (data: {
      userId: string;
      userName: string;
      cellIndex: number;
      itemTitle?: string;
      teamIndex: number;
      claimed: boolean;
      previousTeam?: number;
    }) => {
      // Ignore Pusher events for our own actions (we already have server response)
      const isOwnAction = data.userId === session.data?.user?.id;
      const optimisticUpdate = optimisticUpdates.current.get(data.cellIndex);
      
      if (isOwnAction && optimisticUpdate) {
        // This is our own action and we have an optimistic update
        // The server response already updated the state, so ignore this Pusher event
        return;
      }
      
      // Update claimed items for other users' actions
      // Support multiple teams claiming the same cell
      setClaimedItems((prev) => {
        if (data.claimed) {
          // Add claim for this team (multiple teams can claim same cell)
          return [
            ...prev,
            {
              cellIndex: data.cellIndex,
              teamIndex: data.teamIndex,
              claimedAt: new Date().toISOString(),
              claimedBy: data.userId,
            },
          ];
        } else {
          // Remove all claims for this team on this cell
          return prev.filter(
            (item) => !(item.cellIndex === data.cellIndex && item.teamIndex === data.teamIndex)
          );
        }
      });
      
      // Refresh players and activities
      fetch(`/api/rooms/${roomId}/players`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch players: ${res.status}`);
          }
          return res.json();
        })
        .then((newPlayers) => setPlayers(newPlayers))
        .catch((err) => console.error("Error fetching players:", err));
      
      fetch(`/api/rooms/${roomId}/activities?limit=50`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch activities: ${res.status}`);
          }
          return res.json();
        })
        .then((newActivities) => setActivities(newActivities))
        .catch((err) => console.error("Error fetching activities:", err));
    });

    // Listen for item-marked events (lockout mode)
    channel.bind("item-marked", (data: {
      userId: string;
      userName: string;
      cellIndex: number;
      itemTitle?: string;
      marked: boolean;
    }) => {
      // Update marked items for the user who marked it
      if (data.userId === session.data?.user?.id) {
        setMarkedItems((prev) => {
          if (data.marked) {
            return prev.includes(data.cellIndex) ? prev : [...prev, data.cellIndex];
          } else {
            return prev.filter((idx) => idx !== data.cellIndex);
          }
        });
      }
      
      // Refresh players to update marked items count
      fetch(`/api/rooms/${roomId}/players`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch players: ${res.status}`);
          }
          return res.json();
        })
        .then((newPlayers) => setPlayers(newPlayers))
        .catch((err) => console.error("Error fetching players:", err));
      
      // Refresh activities
      fetch(`/api/rooms/${roomId}/activities?limit=50`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch activities: ${res.status}`);
          }
          return res.json();
        })
        .then((newActivities) => setActivities(newActivities))
        .catch((err) => console.error("Error fetching activities:", err));
    });

    // Listen for team win events
    channel.bind("team-won", (data: {
      teamIndex: number;
      teamName: string;
      winningLines?: Array<{ type: 'row' | 'col' | 'diag'; index: number; cells: number[] }>;
    }) => {
      setGameFinished(true);
      setWinningTeam(data.teamIndex);
      if (data.winningLines) {
        setWinningLines(data.winningLines);
      }
      setShowConfetti(true);
      setShowWinModal(true);
      setHasVoted(false);
      setRestartVotes(0);
      setRestartCountdown(undefined);
      setRestartScheduledAt(undefined);
      // Hide confetti after 5 seconds
      setTimeout(() => setShowConfetti(false), 5000);
    });

    // Listen for restart vote events
    channel.bind("restart-vote", (data: {
      userId: string;
      votes: number;
      playerCount: number;
      majority: number;
      restartScheduled?: string;
      countdown?: number;
    }) => {
      setRestartVotes(data.votes);
      if (data.countdown !== undefined) {
        setRestartCountdown(data.countdown);
      }
      if (data.restartScheduled) {
        setRestartScheduledAt(data.restartScheduled);
      }
    });

    // Listen for restart scheduled events
    channel.bind("restart-scheduled", (data: {
      countdown: number;
      scheduledAt: string;
      instant?: boolean;
    }) => {
      setRestartCountdown(data.countdown);
      setRestartScheduledAt(data.scheduledAt);
    });

    // Listen for restart countdown updates
    channel.bind("restart-countdown", (data: {
      countdown: number;
    }) => {
      setRestartCountdown(data.countdown);
    });

    // Listen for board reset events
    channel.bind("board-reset", () => {
      setClaimedItems([]);
      setGameFinished(false);
      setWinningTeam(undefined);
      setWinningLines([]);
      setMarkedItems([]);
      setShowWinModal(false);
      setRestartVotes(0);
      setRestartCountdown(undefined);
      setRestartScheduledAt(undefined);
      setHasVoted(false);
      // Refresh room data
      fetch(`/api/rooms/${roomId}`)
        .then((res) => res.json())
        .then((roomData) => {
          if (roomData.claimedItems) {
            setClaimedItems(roomData.claimedItems);
          }
          setGameFinished(roomData.gameFinished || false);
          setWinningTeam(roomData.winningTeam);
        })
        .catch((err) => console.error("Error fetching room:", err));
      
      // Refresh players and activities
      fetch(`/api/rooms/${roomId}/players`)
        .then((res) => res.json())
        .then((newPlayers) => setPlayers(newPlayers))
        .catch((err) => console.error("Error fetching players:", err));
      
      fetch(`/api/rooms/${roomId}/activities?limit=50`)
        .then((res) => res.json())
        .then((newActivities) => setActivities(newActivities))
        .catch((err) => console.error("Error fetching activities:", err));
    });

    channel.bind("room-deleted", (data: { roomId: string }) => {
      // Redirect all users to bingo page when room is deleted
      globalThis.location.href = "/bingo";
    });

    return () => {
      pusherClient.unsubscribe(`room-${roomId}`);
    };
  }, [roomId, session.data?.user?.id]);

  // Cleanup old optimistic updates periodically to prevent memory leaks
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = 5000; // 5 seconds
      optimisticUpdates.current.forEach((value, key) => {
        if (now - value.timestamp > maxAge) {
          optimisticUpdates.current.delete(key);
        }
      });
    }, 2000); // Check every 2 seconds

    return () => clearInterval(cleanupInterval);
  }, []);

  // Handle cell click with optimistic update
  // Track pending requests per cell to prevent concurrent requests
  const pendingCellRequests = useRef<Set<number>>(new Set());
  // Track cells that we've optimistically updated to ignore Pusher events for our own actions
  const optimisticUpdates = useRef<Map<number, { timestamp: number; teamIndex: number }>>(new Map());
  
  const handleCellClick = async (index: number) => {
    // Prevent concurrent requests for the same cell
    if (pendingCellRequests.current.has(index)) {
      return;
    }

    if (gameFinished) {
      return; // Don't allow clicks if game is finished
    }

    const cell = bingoData[index];
    const currentPlayer = players.find((p) => p.userId === session.data?.user?.id);
    
    if (!currentPlayer || currentPlayer.teamIndex === undefined) {
      return; // Player must be on a team
    }
    
    // Track this request
    pendingCellRequests.current.add(index);
    
    // For non-lockout modes, use team-based claiming
    if (!isLockout) {
      // Check if my team already claimed this cell (support multiple teams)
      const myTeamClaims = claimedItems.filter(
        (item) => item.cellIndex === index && item.teamIndex === currentPlayer.teamIndex
      );
      const isClaimedByMyTeam = myTeamClaims.length > 0;
      
      // Optimistically update claimed items
      const optimisticClaimedItems = isClaimedByMyTeam
        ? claimedItems.filter(
            (item) => !(item.cellIndex === index && item.teamIndex === currentPlayer.teamIndex)
          )
        : [
            ...claimedItems,
            {
              cellIndex: index,
              teamIndex: currentPlayer.teamIndex,
              claimedAt: new Date().toISOString(),
              claimedBy: session.data?.user?.id || "",
            },
          ];
      
      // Track this optimistic update to ignore Pusher events for our own action
      optimisticUpdates.current.set(index, {
        timestamp: Date.now(),
        teamIndex: currentPlayer.teamIndex,
      });
      
      setClaimedItems(optimisticClaimedItems);
      
      // Make API call
      fetch(`/api/rooms/${roomId}/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cellIndex: index,
          itemTitle: cell.title,
        }),
      })
        .then(async (response) => {
          if (response.ok) {
            const data = await response.json();
            // Update with server response (source of truth)
            if (data.claimedItems) {
              setClaimedItems(data.claimedItems);
            }
            // Clear optimistic update tracking after server confirms
            // Wait a bit to allow any delayed Pusher event to arrive and be ignored
            setTimeout(() => {
              optimisticUpdates.current.delete(index);
            }, 2000);
            
            // Handle win detection
            if (data.winDetected && data.winningTeam !== undefined) {
              setGameFinished(true);
              setWinningTeam(data.winningTeam);
              if (data.winningLines) {
                setWinningLines(data.winningLines);
              }
              setShowConfetti(true);
              setShowWinModal(true);
              setHasVoted(false);
              setRestartVotes(0);
              setRestartCountdown(undefined);
              setRestartScheduledAt(undefined);
              // Hide confetti after 5 seconds
              setTimeout(() => setShowConfetti(false), 5000);
            }
          } else {
            // Revert optimistic update on error
            optimisticUpdates.current.delete(index);
            setClaimedItems(claimedItems);
          }
        })
        .catch((error) => {
          console.error("Error claiming item:", error);
          // Revert optimistic update on error
          optimisticUpdates.current.delete(index);
          setClaimedItems(claimedItems);
        })
        .finally(() => {
          pendingCellRequests.current.delete(index);
        });
    } else {
      // Lockout mode - use old system
      setMarkedItems((prevMarkedItems) => {
        const isMarked = prevMarkedItems.includes(index);
        const optimisticMarkedItems = isMarked
          ? prevMarkedItems.filter((idx) => idx !== index)
          : [...prevMarkedItems, index];
        
        fetch(`/api/rooms/${roomId}/mark`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cellIndex: index,
            itemTitle: cell.title,
          }),
        })
          .then(async (response) => {
            if (response.ok) {
              const data = await response.json();
              setMarkedItems(data.markedItems);
            } else {
              setMarkedItems(prevMarkedItems);
            }
          })
          .catch((error) => {
            console.error("Error marking item:", error);
            setMarkedItems(prevMarkedItems);
          })
          .finally(() => {
            pendingCellRequests.current.delete(index);
          });
        
        return optimisticMarkedItems;
      });
    }
  };

  // Handle team selection with optimistic update
  const handleTeamSelect = async (teamIndex: number) => {
    // If selecting the same team, do nothing
    if (selectedTeam === teamIndex) {
      return;
    }
    
    // Optimistically update UI immediately
    const previousTeam = selectedTeam;
    setSelectedTeam(teamIndex);
    
    // Optimistically update player's team in the players list
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.userId === session.data?.user?.id
          ? { ...player, teamIndex }
          : player
      )
    );

    try {
      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamIndex }),
      });
      
      if (response.ok) {
        // Refresh players list to get server state (only if different)
        fetch(`/api/rooms/${roomId}/players`)
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Failed to fetch players: ${res.status}`);
            }
            return res.json();
          })
          .then((newPlayers) => {
            // Only update if there are actual differences
            const currentPlayer = newPlayers.find((p: typeof newPlayers[0]) => p.userId === session.data?.user?.id);
            if (currentPlayer?.teamIndex !== teamIndex) {
              setPlayers(newPlayers);
            }
          })
          .catch((err) => console.error("Error fetching players:", err));
        
        // Wait a bit for server to create activity, then fetch just the latest one
        // This prevents duplicate activities from Pusher event
        setTimeout(() => {
          fetch(`/api/rooms/${roomId}/activities?limit=1`)
            .then((res) => {
              if (!res.ok) {
                throw new Error(`Failed to fetch activities: ${res.status}`);
              }
              return res.json();
            })
            .then((newActivities) => {
              if (newActivities.length > 0) {
                const newActivity = newActivities[0];
                // Only add if it's a team-changed activity for current user and doesn't exist
                if (newActivity.action === "team-changed" && 
                    newActivity.userId === session.data?.user?.id) {
                  setActivities((prev) => {
                    // Check if activity already exists
                    if (prev.some(a => a.id === newActivity.id)) {
                      return prev;
                    }
                    return [...prev, newActivity].sort((a, b) => 
                      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                    );
                  });
                }
              }
            })
            .catch((err) => console.error("Error fetching latest activity:", err));
        }, 200);
      } else {
        // Revert optimistic update on error
        setSelectedTeam(previousTeam);
        setPlayers((prevPlayers) =>
          prevPlayers.map((player) =>
            player.userId === session.data?.user?.id
              ? { ...player, teamIndex: previousTeam }
              : player
          )
        );
      }
    } catch (error) {
      console.error("Error updating team:", error);
      // Revert optimistic update on error
      setSelectedTeam(previousTeam);
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) =>
          player.userId === session.data?.user?.id
            ? { ...player, teamIndex: previousTeam }
            : player
        )
      );
    }
  };

  // Handle leave room
  const handleLeave = async () => {
    try {
      await fetch(`/api/rooms/${roomId}/leave`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  // Handle kick player
  const handleKickPlayer = async (userId: string) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/kick`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Refresh players list
        fetch(`/api/rooms/${roomId}/players`)
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Failed to fetch players: ${res.status}`);
            }
            return res.json();
          })
          .then((newPlayers) => setPlayers(newPlayers))
          .catch((err) => console.error("Error fetching players:", err));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to kick player");
      }
    } catch (error) {
      console.error("Error kicking player:", error);
      alert("Failed to kick player. Please try again.");
    }
  };

  // Handle vote for restart
  const handleVote = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/vote-restart`, {
        method: "POST",
      });
      if (response.ok) {
        setHasVoted(true);
      }
    } catch (error) {
      console.error("Error voting for restart:", error);
    }
  };

  // Handle instant restart (host only)
  const handleInstantRestart = async () => {
    try {
      await fetch(`/api/rooms/${roomId}/restart-game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instant: true, countdown: 5 }),
      });
    } catch (error) {
      console.error("Error restarting game:", error);
    }
  };

  // Handle change game mode (host only)
  const handleChangeGameMode = () => {
    // TODO: Implement game mode change dialog
    console.log("Change game mode - TODO");
  };

  // Get mode name from game mode
  const getModeName = () => {
    if (initialRoom.gameMode.includes("battleship")) return "Battleship Bingo";
    if (initialRoom.gameMode.includes("classic")) return "Classic Bingo";
    return "Bingo";
  };

  const isOwner = session.data?.user?.id === initialRoom.ownerId;

  // Constrain sidebar height to match bingo card
  useLayoutEffect(() => {
    const syncHeights = () => {
      const bingoCardContainer = document.getElementById('bingo-card-container');
      const sidebarContainer = document.getElementById('sidebar-container');
      
      if (bingoCardContainer && sidebarContainer) {
        const bingoCardHeight = bingoCardContainer.offsetHeight;
        sidebarContainer.style.maxHeight = `${bingoCardHeight}px`;
        sidebarContainer.style.height = `${bingoCardHeight}px`;
      }
    };

    syncHeights();
    globalThis.addEventListener('resize', syncHeights);
    
    // Also sync after a short delay to account for initial render
    const timeout = setTimeout(syncHeights, 100);
    
    return () => {
      globalThis.removeEventListener('resize', syncHeights);
      clearTimeout(timeout);
    };
  }, [gridSize, initialRoom.roomName, initialRoom.gameMode]);

  const winningTeamData = winningTeam !== undefined ? teams[winningTeam] : undefined;

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-6 relative">
      <Confetti show={showConfetti} teamColor={winningTeamData?.color} />
      
      {/* Backdrop blur when win modal is open */}
      {showWinModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" />
      )}

      {/* Win Modal */}
      {gameFinished && winningTeam !== undefined && winningTeamData && (
        <WinModal
          open={showWinModal}
          onClose={() => setShowWinModal(false)}
          winningTeam={{
            index: winningTeam,
            name: winningTeamData.name,
            color: winningTeamData.color,
          }}
          isOwner={isOwner}
          currentUserId={session.data?.user?.id}
          playerCount={players.length}
          votes={restartVotes}
          countdown={restartCountdown}
          scheduledAt={restartScheduledAt}
          onVote={handleVote}
          onInstantRestart={handleInstantRestart}
          onChangeGameMode={handleChangeGameMode}
          hasVoted={hasVoted}
        />
      )}

      {/* Grouped Bingo Card and Sidebar */}
      <div className="flex gap-6 items-start max-w-7xl w-full">
        {/* Main Bingo Card - 3/5 width */}
        <div className="flex-[3] flex justify-center items-start" id="bingo-card-container">
          <BingoCard
            modeName={getModeName()}
            lobbyName={initialRoom.roomName}
            mode={initialRoom.gameMode.includes("battleship") ? "battleship" : "default"}
            size={gridSize}
            bingoData={updatedBingoData}
          />
        </div>

        {/* Sidebar - 2/5 width, constrained to bingo card height */}
        <div className="flex-[2] flex flex-col gap-4 max-w-md" id="sidebar-container">
        {/* First Row: Player List only */}
        <div className="bg-card border border-border rounded-lg p-4 shrink-0">
          <PlayerList
            players={players}
            ownerId={initialRoom.ownerId}
            teams={teams}
            currentUserId={session.data?.user?.id}
            selectedTeam={selectedTeam}
            onTeamSelect={handleTeamSelect}
            onKickPlayer={isOwner ? handleKickPlayer : undefined}
          />
        </div>
        
        {/* Second Row: Activity Feed (takes remaining height, scrolls if needed) */}
        <div className="flex-1 min-h-0 bg-card border border-border rounded-lg p-4 overflow-hidden flex flex-col">
          <ActivityFeed
            activities={activities}
            teams={teams}
            players={players}
            fullPlayers={players}
            claimedItems={claimedItems}
            currentUserId={session.data?.user?.id}
          />
        </div>
        
        {/* Third Row: Room Link (with toggle) - no header */}
        <div className="bg-card border border-border rounded-lg p-4">
          <RoomLink roomId={roomId} />
        </div>
        
        {/* Fourth Row: Action Buttons - no header */}
        <div className="bg-card border border-border rounded-lg p-4">
        <ActionButtons
          roomId={roomId}
          isOwner={isOwner}
          onLeave={handleLeave}
          onDeleteRoom={() => {
            // Redirect to bingo page after room deletion
            globalThis.location.href = "/bingo";
          }}
          onReset={() => {
            // Reset will be handled by the board-reset Pusher event
          }}
          initialBingoItems={bingoItems}
          onBingoItemsUpdate={(items: string[]) => {
            // Update bingo items state
            setBingoItems(items);
          }}
        />
        </div>
      </div>
      </div>
    </div>
  );
}

