import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const room = await db.room.findById(roomId);
    
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: room._id.toString(),
      roomName: room.roomName,
      bingoSeed: room.bingoSeed,
      gameMode: room.gameMode,
      boardSize: room.boardSize,
      teams: room.teams,
      ownerId: room.owner_id.toString(),
    });
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    const room = await db.room.findById(roomId);
    
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if user is the owner
    if (room.owner_id.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete all players in the room
    const players = await db.player.findByRoomId(roomId);
    for (const player of players) {
      await db.player.delete(roomId, player.user_id);
    }

    // Delete all activities in the room
    await db.activity.deleteByRoomId(roomId);

    // Delete the room
    await db.room.delete(roomId);

    // Broadcast room deleted
    await pusherServer.trigger(`room-${roomId}`, "room-deleted", {
      roomId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
