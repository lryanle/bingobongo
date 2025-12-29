import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") || "50");
    
    const activities = await db.activity.findByRoomId(roomId, limit);
    
    const activitiesWithDetails = activities.map((activity) => ({
      id: activity._id.toString(),
      userId: activity.user_id.toString(),
      userName: activity.user_name,
      action: activity.action,
      itemTitle: activity.item_title,
      cellIndex: activity.cell_index,
      teamIndex: activity.team_index,
      createdAt: activity.created_at.toISOString(),
    }));

    return NextResponse.json(activitiesWithDetails);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

