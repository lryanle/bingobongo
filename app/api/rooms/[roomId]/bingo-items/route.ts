import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function PUT(
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
    const { bingoItems } = body;

    if (!Array.isArray(bingoItems)) {
      return NextResponse.json({ error: "bingoItems must be an array" }, { status: 400 });
    }

    // Check if room exists and user is owner
    const room = await db.room.findById(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (room.owner_id.toString() !== session.user.id) {
      return NextResponse.json({ error: "Only the room owner can update bingo items" }, { status: 403 });
    }

    // Calculate required items based on board size
    const { getGridSize } = await import("@/lib/bingo-utils");
    const gridSize = getGridSize(room.boardSize);
    const requiredItems = gridSize * gridSize;
    
    // Filter out empty strings for validation
    const validItems = bingoItems.filter((item: string) => item && item.trim() !== "");
    if (validItems.length < requiredItems) {
      return NextResponse.json(
        { error: `Not enough bingo items provided. Need at least ${requiredItems} items for a ${gridSize}x${gridSize} board, but only ${validItems.length} valid items were provided.` },
        { status: 400 }
      );
    }

    // If more items than needed, randomly select using seed
    let finalItems: string[] = bingoItems;
    if (bingoItems.length > requiredItems) {
      const seed = room.bingoSeed;
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        const char = seed.codePointAt(i) || 0;
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      let state = Math.abs(hash);
      const random = () => {
        state = (state * 9301 + 49297) % 233280;
        return state / 233280;
      };
      
      // Shuffle and select exactly requiredItems
      const shuffled = [...bingoItems].sort(() => random() - 0.5);
      finalItems = shuffled.slice(0, requiredItems);
    } else if (bingoItems.length === requiredItems) {
      // Exact amount - use all items
      finalItems = [...bingoItems];
    }
    // If fewer items, validation above will have caught it

    // Update room with new bingo items (use finalItems which matches board size exactly)
    await db.room.update(roomId, {
      bingoItems: finalItems,
      last_updated: new Date(),
    });

    // Broadcast bingo items updated
    await pusherServer.trigger(`room-${roomId}`, "bingo-items-updated", {
      bingoItems: finalItems,
    });

    return NextResponse.json({ success: true, bingoItems: finalItems });
  } catch (error) {
    console.error("Error updating bingo items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

