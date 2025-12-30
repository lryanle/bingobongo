"use client";

import { useEffect, useState, useLayoutEffect, useRef } from "react";
import BingoCard, { BingoCardProps } from "@/components/bingo-card/bingocard";
import PlayerList from "./player-list";
import ActivityFeed from "./activity-feed";
import RoomLink from "./room-link";
import ActionButtons from "./action-buttons";
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

  // Generate bingo data
  const gridSize = getGridSize(initialRoom.boardSize);
  const bingoData = generateBingoData(
    initialRoom.bingoSeed,
    gridSize,
    teams
  );

  // Update marked items in bingo data and add onClick handlers
  const updatedBingoData: BingoCardProps["bingoData"] = bingoData.map(
    (cell, index) => ({
      ...cell,
      disabled: markedItems.includes(index),
      onClick: () => handleCellClick(index),
    })
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
            // Only add if not already present (prevents duplicates from optimistic updates)
            return prev.includes(data.cellIndex) ? prev : [...prev, data.cellIndex];
          } else {
            // Remove if present
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

    channel.bind("room-deleted", (data: { roomId: string }) => {
      // Redirect all users to bingo page when room is deleted
      globalThis.location.href = "/bingo";
    });

    return () => {
      pusherClient.unsubscribe(`room-${roomId}`);
    };
  }, [roomId, session.data?.user?.id]);

  // Handle cell click with optimistic update
  // Track pending requests per cell to prevent concurrent requests
  const pendingCellRequests = useRef<Set<number>>(new Set());
  
  const handleCellClick = async (index: number) => {
    // Prevent concurrent requests for the same cell
    if (pendingCellRequests.current.has(index)) {
      return;
    }

    const cell = bingoData[index];
    
    // Use functional update to get the latest state
    setMarkedItems((prevMarkedItems) => {
      const isMarked = prevMarkedItems.includes(index);
      
      // Optimistically update UI immediately
      const optimisticMarkedItems = isMarked
        ? prevMarkedItems.filter((idx) => idx !== index)
        : [...prevMarkedItems, index];
      
      // Track this request
      pendingCellRequests.current.add(index);
      
      // Make API call with the optimistic state
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
            // Update with server response (server has the source of truth)
            setMarkedItems(data.markedItems);
          } else {
            // Revert optimistic update on error
            setMarkedItems(prevMarkedItems);
          }
        })
        .catch((error) => {
          console.error("Error marking item:", error);
          // Revert optimistic update on error
          setMarkedItems(prevMarkedItems);
        })
        .finally(() => {
          // Remove from pending requests
          pendingCellRequests.current.delete(index);
        });
      
      return optimisticMarkedItems;
    });
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

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-6">
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
          />
        </div>
        
        {/* Second Row: Activity Feed (takes remaining height, scrolls if needed) */}
        <div className="flex-1 min-h-0 bg-card border border-border rounded-lg p-4 overflow-hidden flex flex-col">
          <ActivityFeed
            activities={activities}
            teams={teams}
            players={players}
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
        />
        </div>
      </div>
      </div>
    </div>
  );
}

