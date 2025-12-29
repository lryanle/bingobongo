import { db } from '@/lib/db'

export async function GET() {
  const createdRoom = await db.chatRoom.create({})

  return new Response(createdRoom._id)
}
