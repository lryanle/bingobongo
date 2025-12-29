import BingoRoom from '@/components/bingo-room/bingo-room'
import { db } from '@/lib/db'
import { ObjectId } from 'mongodb'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { getAuth } from '@/lib/auth'
import { headers } from 'next/headers'

interface PageProps {
  params: Promise<{
    roomId: string
  }>
}

const page = async ({ params }: PageProps) => {
  const { roomId } = await params

  // Validate roomId format (MongoDB ObjectId)
  const isValidObjectId = ObjectId.isValid(roomId)
  
  if (!isValidObjectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-destructive/50 rounded-lg shadow-lg p-8 text-center space-y-4">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Invalid Room ID</h1>
            <p className="text-muted-foreground">
              The room ID <code className="px-2 py-1 bg-muted rounded text-sm font-mono">{roomId}</code> is not valid.
            </p>
            <p className="text-sm text-muted-foreground">
              Please check the URL and try again.
            </p>
          </div>
          <Link 
            href="/bingo" 
            className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Return to Bingo
          </Link>
        </div>
      </div>
    )
  }

  // Check if room exists
  const room = await db.room.findById(roomId)
  
  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-destructive/50 rounded-lg shadow-lg p-8 text-center space-y-4">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Room Not Found</h1>
            <p className="text-muted-foreground">
              The room you're looking for doesn't exist or may have been deleted.
            </p>
            <p className="text-sm text-muted-foreground">
              Room ID: <code className="px-2 py-1 bg-muted rounded text-xs font-mono">{roomId}</code>
            </p>
          </div>
          <Link 
            href="/bingo" 
            className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Return to Bingo
          </Link>
        </div>
      </div>
    )
  }

  // Get current user's session first to use for player name lookup
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const currentUserId = session?.user?.id;

  // Room exists, fetch all necessary data for BingoRoom
  const [players, activities] = await Promise.all([
    // Fetch players
    (async () => {
      const players = await db.player.findByRoomId(roomId);
      const playersWithDetails = await Promise.all(
        players.map(async (player) => {
          // Try to get user from database first
          let userName = "Unknown";
          let userImage = "";
          
          // If this is the current user, use session data (more reliable)
          if (player.user_id.toString() === currentUserId && session?.user) {
            userName = session.user.name || "Unknown";
            userImage = session.user.image || "";
          } else {
            // For other users, try database
            try {
              const user = await db.user.findById(player.user_id);
              if (user) {
                userName = user.name || "Unknown";
                userImage = user.image || "";
              }
            } catch (error) {
              // User might not exist in database, keep "Unknown"
              console.log(`User ${player.user_id} not found in database`, error instanceof Error ? error.message : String(error));
            }
          }
          
          return {
            id: player._id.toString(),
            userId: player.user_id.toString(),
            userName,
            userImage,
            teamIndex: player.team_index,
            markedItems: player.marked_items,
            joinedAt: player.joined_at.toISOString(),
            lastActive: player.last_active.toISOString(),
          };
        })
      );
      return playersWithDetails;
    })(),
    // Fetch activities
    (async () => {
      const activities = await db.activity.findByRoomId(roomId, 50);
      return activities.map((activity) => ({
        id: activity._id.toString(),
        userId: activity.user_id.toString(),
        userName: activity.user_name,
        action: activity.action,
        itemTitle: activity.item_title,
        cellIndex: activity.cell_index,
        teamIndex: activity.team_index,
        createdAt: activity.created_at.toISOString(),
      }));
    })(),
  ]);

  // Find current user's player data to get their marked items
  const currentPlayer = players.find((p) => p.userId === currentUserId);
  const initialMarkedItems = currentPlayer?.markedItems || [];

  // Prepare room data for BingoRoom component
  const initialRoom = {
    id: room._id.toString(),
    roomName: room.roomName,
    bingoSeed: room.bingoSeed,
    gameMode: room.gameMode,
    boardSize: room.boardSize,
    teams: room.teams,
    ownerId: room.owner_id.toString(),
  };

  return (
    <BingoRoom
      roomId={roomId}
      initialRoom={initialRoom}
      initialPlayers={players}
      initialActivities={activities}
      initialMarkedItems={initialMarkedItems}
    />
  )
}

export default page
