import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

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

    // Check if player exists
    const player = await db.player.findByRoomAndUserId(roomId, session.user.id);
    
    if (!player) {
      return NextResponse.json({ error: "Player not in room" }, { status: 403 });
    }

    // Update marked items
    const markedItems = player.marked_items.includes(cellIndex)
      ? player.marked_items.filter((idx) => idx !== cellIndex)
      : [...player.marked_items, cellIndex];

    await db.player.update(roomId, session.user.id, {
      marked_items: markedItems,
    });

    // Create activity with team_index
    const user = await db.user.findById(session.user.id);
    await db.activity.create({
      room_id: roomId,
      user_id: session.user.id,
      user_name: user?.name || "Unknown",
      action: "marked",
      item_title: itemTitle,
      cell_index: cellIndex,
      team_index: player.team_index,
    });

    // Broadcast item marked
    await pusherServer.trigger(`room-${roomId}`, "item-marked", {
      userId: session.user.id,
      userName: user?.name || "Unknown",
      cellIndex,
      itemTitle,
      marked: !player.marked_items.includes(cellIndex),
    });

    return NextResponse.json({ success: true, markedItems });
  } catch (error) {
    console.error("Error marking item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

