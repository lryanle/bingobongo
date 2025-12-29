import { db } from '@/lib/db'
import { pusherServer } from '@/lib/pusher'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { text, roomId } = await req.json()

  await pusherServer.trigger(roomId, 'incoming-message', text)

  await db.message.create({
    text,
    chatRoomId: roomId,
  })

  return new Response(JSON.stringify({ success: true }))
}
