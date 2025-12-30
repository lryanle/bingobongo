import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { checkTeamBingoWin, getGridSize } from "@/lib/bingo-utils";
import { ObjectId } from "mongodb";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    const body = await request.json();
    const { cellIndex, itemTitle } = body;

    if (cellIndex === undefined) {
      return NextResponse.json({ error: "Cell index is required" }, { status: 400 });
    }

    // Check if player exists and get room
    const player = await db.player.findByRoomAndUserId(roomId, session.user.id);
    const room = await db.room.findById(roomId);
    
    if (!player) {
      return NextResponse.json({ error: "Player not in room" }, { status: 403 });
    }

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.gameFinished) {
      return NextResponse.json({ error: "Game is finished" }, { status: 400 });
    }

    if (player.team_index === undefined) {
      return NextResponse.json({ error: "Player must be on a team" }, { status: 400 });
    }

    // For basic bingo (non-lockout), use team-based claiming
    const isLockout = room.gameMode.includes("lockout");
    
    if (!isLockout) {
      // Team-based claiming system
      const claimResult = await db.room.claimItem(
        roomId,
        cellIndex,
        player.team_index,
        session.user.id
      );

      const user = await db.user.findById(session.user.id);
      // Use session data as fallback if user not found in database
      const userName = user?.name || session.user.name || "Unknown";
      
      await db.activity.create({
        room_id: roomId,
        user_id: session.user.id,
        user_name: userName,
        action: claimResult.claimed ? "claimed" : "unclaimed",
        item_title: itemTitle,
        cell_index: cellIndex,
        team_index: player.team_index,
      });

      // Broadcast item claimed/unclaimed
      await pusherServer.trigger(`room-${roomId}`, "item-claimed", {
        userId: session.user.id,
        userName: userName,
        cellIndex,
        itemTitle,
        teamIndex: player.team_index,
        claimed: claimResult.claimed,
        previousTeam: claimResult.previousTeam,
      });

      // Get updated room to check for wins
      const updatedRoom = await db.room.findById(roomId);
      if (!updatedRoom) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }

      // Check for win if item was claimed (not unclaimed) and game isn't finished
      let winDetected = false;
      let winningTeam: number | undefined;
      let winningLines: Array<{ type: 'row' | 'col' | 'diag'; index: number; cells: number[] }> | undefined;

      if (claimResult.claimed && !updatedRoom.gameFinished && room.gameMode.includes("classic")) {
        const gridSize = getGridSize(room.boardSize);
        // Extract required bingos from gameMode (e.g., "classic-3" means 3 bingos required)
        const modeMatch = room.gameMode.match(/classic-(\d+)/);
        const requiredBingos = modeMatch ? parseInt(modeMatch[1], 10) : 1;

        // Check if the claiming team has won
        const winCheck = checkTeamBingoWin(
          updatedRoom.claimedItems || [],
          player.team_index,
          gridSize,
          requiredBingos
        );

        if (winCheck.hasWon) {
          winDetected = true;
          winningTeam = player.team_index;
          winningLines = winCheck.winningLines;

          // Update room with win status
          await db.room.update(roomId, {
            gameFinished: true,
            winningTeam: player.team_index,
          });

          // Create win activity
          await db.activity.create({
            room_id: roomId,
            user_id: session.user.id,
            user_name: user?.name || "Unknown",
            action: "win",
            team_index: player.team_index,
          });

          // Broadcast win event
          await pusherServer.trigger(`room-${roomId}`, "team-won", {
            teamIndex: player.team_index,
            teamName: room.teams[player.team_index]?.name || `Team ${player.team_index + 1}`,
            winningLines,
          });
        }
      }

      // Serialize claimedItems for client (convert ObjectIds to strings and Dates to ISO strings)
      const serializedClaimedItems = (updatedRoom.claimedItems || []).map((item) => {
        let claimedAt: string;
        if (item.claimedAt instanceof Date) {
          claimedAt = item.claimedAt.toISOString();
        } else if (typeof item.claimedAt === 'string') {
          claimedAt = item.claimedAt;
        } else {
          claimedAt = new Date(item.claimedAt).toISOString();
        }

        let claimedBy: string;
        if (item.claimedBy instanceof ObjectId) {
          claimedBy = item.claimedBy.toString();
        } else if (typeof item.claimedBy === 'string') {
          claimedBy = item.claimedBy;
        } else {
          claimedBy = String(item.claimedBy);
        }

        return {
          cellIndex: item.cellIndex,
          teamIndex: item.teamIndex,
          claimedAt,
          claimedBy,
        };
      });

      return NextResponse.json({ 
        success: true, 
        claimed: claimResult.claimed,
        claimedItems: serializedClaimedItems,
        winDetected,
        winningTeam,
        winningLines,
      });
    } else {
      // Lockout mode - use old system (per-player marking)
      const { player: updatedPlayer, wasAdded } = await db.player.toggleMarkedItem(
        roomId,
        session.user.id,
        cellIndex
      );

      const user = await db.user.findById(session.user.id);
      await db.activity.create({
        room_id: roomId,
        user_id: session.user.id,
        user_name: user?.name || "Unknown",
        action: wasAdded ? "marked" : "unmarked",
        item_title: itemTitle,
        cell_index: cellIndex,
        team_index: updatedPlayer.team_index,
      });

      await pusherServer.trigger(`room-${roomId}`, "item-marked", {
        userId: session.user.id,
        userName: user?.name || "Unknown",
        cellIndex,
        itemTitle,
        marked: wasAdded,
      });

      return NextResponse.json({ success: true, markedItems: updatedPlayer.marked_items });
    }
  } catch (error) {
    console.error("Error marking item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

