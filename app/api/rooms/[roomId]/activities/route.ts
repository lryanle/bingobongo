import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    
    // Validate limit parameter - must be a positive integer
    let limit = 50; // default
    if (limitParam) {
      const parsed = Number.parseInt(limitParam, 10);
      // Check if parsing was successful and result is a positive integer
      if (!Number.isNaN(parsed) && parsed > 0 && Number.isFinite(parsed)) {
        // Set a reasonable maximum to prevent abuse (e.g., 1000)
        limit = Math.min(parsed, 1000);
      } else {
        // Invalid limit parameter - return 400 error
        return NextResponse.json(
          { error: "Invalid limit parameter. Must be a positive integer." },
          { status: 400 }
        );
      }
    }
    
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

