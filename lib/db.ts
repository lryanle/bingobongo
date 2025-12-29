import { ObjectId, Db, Collection, Document } from "mongodb";
import { randomUUID } from "crypto";
import clientPromise from "./mongodb";
import type {
  Account,
  Session,
  User,
  VerificationToken,
  Room,
  ChatRoom,
  Message,
  CreateAccountInput,
  CreateSessionInput,
  CreateUserInput,
  CreateVerificationTokenInput,
  CreateRoomInput,
  UpdateRoomInput,
  CreateChatRoomInput,
  CreateMessageInput,
} from "@/types/db";

// Helper to convert string to ObjectId
const toObjectId = (id: string | ObjectId): ObjectId => {
  return typeof id === "string" ? new ObjectId(id) : id;
};

// Helper to convert ObjectId to string
const toString = (id: string | ObjectId): string => {
  return typeof id === "string" ? id : id.toString();
};

// Get database instance
async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}

// Collections
async function getCollection<T extends Document>(name: string): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}

// Account operations
export const accounts = {
  async findById(id: string | ObjectId): Promise<Account | null> {
    const collection = await getCollection<Account>("accounts");
    return collection.findOne({ _id: toObjectId(id) });
  },

  async findByProvider(provider: string, providerAccountId: string): Promise<Account | null> {
    const collection = await getCollection<Account>("accounts");
    return collection.findOne({
      provider,
      provider_account_id: providerAccountId,
    });
  },

  async create(data: CreateAccountInput): Promise<Account> {
    const collection = await getCollection<Account>("accounts");
    const result = await collection.insertOne({
      _id: new ObjectId(),
      ...data,
      user_id: toObjectId(data.user_id),
    } as Account);
    const account = await collection.findOne({ _id: result.insertedId });
    if (!account) throw new Error("Failed to create account");
    return account;
  },

  async delete(id: string | ObjectId): Promise<void> {
    const collection = await getCollection<Account>("accounts");
    await collection.deleteOne({ _id: toObjectId(id) });
  },
};

// Session operations
export const sessions = {
  async findByToken(sessionToken: string): Promise<Session | null> {
    const collection = await getCollection<Session>("sessions");
    return collection.findOne({ session_token: sessionToken });
  },

  async create(data: CreateSessionInput): Promise<Session> {
    const collection = await getCollection<Session>("sessions");
    const result = await collection.insertOne({
      _id: new ObjectId(),
      ...data,
      user_id: toObjectId(data.user_id),
    } as Session);
    const session = await collection.findOne({ _id: result.insertedId });
    if (!session) throw new Error("Failed to create session");
    return session;
  },

  async update(sessionToken: string, data: Partial<CreateSessionInput>): Promise<Session> {
    const collection = await getCollection<Session>("sessions");
    const updateData: any = { ...data };
    if (data.user_id) {
      updateData.user_id = toObjectId(data.user_id);
    }
    await collection.updateOne(
      { session_token: sessionToken },
      { $set: updateData }
    );
    const session = await collection.findOne({ session_token: sessionToken });
    if (!session) throw new Error("Failed to update session");
    return session;
  },

  async delete(sessionToken: string): Promise<void> {
    const collection = await getCollection<Session>("sessions");
    await collection.deleteOne({ session_token: sessionToken });
  },
};

// User operations
export const users = {
  async findById(id: string | ObjectId): Promise<User | null> {
    const collection = await getCollection<User>("users");
    return collection.findOne({ _id: toObjectId(id) });
  },

  async findByEmail(email: string): Promise<User | null> {
    const collection = await getCollection<User>("users");
    return collection.findOne({ email });
  },

  async create(data: CreateUserInput): Promise<User> {
    const collection = await getCollection<User>("users");
    const result = await collection.insertOne({
      _id: new ObjectId(),
      created: new Date(),
      ...data,
    } as User);
    const user = await collection.findOne({ _id: result.insertedId });
    if (!user) throw new Error("Failed to create user");
    return user;
  },

  async update(id: string | ObjectId, data: Partial<CreateUserInput>): Promise<User> {
    const collection = await getCollection<User>("users");
    await collection.updateOne(
      { _id: toObjectId(id) },
      { $set: data }
    );
    const user = await collection.findOne({ _id: toObjectId(id) });
    if (!user) throw new Error("Failed to update user");
    return user;
  },

  async delete(id: string | ObjectId): Promise<void> {
    const collection = await getCollection<User>("users");
    await collection.deleteOne({ _id: toObjectId(id) });
  },
};

// VerificationToken operations
export const verificationTokens = {
  async findByIdentifierAndToken(
    identifier: string,
    token: string
  ): Promise<VerificationToken | null> {
    const collection = await getCollection<VerificationToken>("verificationtokens");
    return collection.findOne({ _id: identifier, token });
  },

  async create(data: CreateVerificationTokenInput): Promise<VerificationToken> {
    const collection = await getCollection<VerificationToken>("verificationtokens");
    await collection.insertOne(data as VerificationToken);
    const verificationToken = await collection.findOne({ _id: data._id });
    if (!verificationToken) throw new Error("Failed to create verification token");
    return verificationToken;
  },

  async delete(identifier: string): Promise<void> {
    const collection = await getCollection<VerificationToken>("verificationtokens");
    await collection.deleteOne({ _id: identifier });
  },
};

// Room operations
export const rooms = {
  async findById(id: string | ObjectId): Promise<Room | null> {
    const collection = await getCollection<Room>("rooms");
    return collection.findOne({ _id: toObjectId(id) });
  },

  async findByOwnerId(ownerId: string | ObjectId): Promise<Room | null> {
    const collection = await getCollection<Room>("rooms");
    return collection.findOne({ owner_id: toObjectId(ownerId) });
  },

  async create(data: CreateRoomInput): Promise<Room> {
    const collection = await getCollection<Room>("rooms");
    const result = await collection.insertOne({
      _id: new ObjectId(),
      last_updated: new Date(),
      ...data,
      owner_id: toObjectId(data.owner_id),
    } as Room);
    const room = await collection.findOne({ _id: result.insertedId });
    if (!room) throw new Error("Failed to create room");
    return room;
  },

  async update(id: string | ObjectId, data: UpdateRoomInput): Promise<Room> {
    const collection = await getCollection<Room>("rooms");
    const updateData: any = {
      ...data,
      last_updated: new Date(),
    };
    await collection.updateOne(
      { _id: toObjectId(id) },
      { $set: updateData }
    );
    const room = await collection.findOne({ _id: toObjectId(id) });
    if (!room) throw new Error("Failed to update room");
    return room;
  },

  async upsertByOwnerId(
    ownerId: string | ObjectId,
    createData: CreateRoomInput,
    updateData: UpdateRoomInput
  ): Promise<Room> {
    const collection = await getCollection<Room>("rooms");
    const ownerObjectId = toObjectId(ownerId);
    
    const existing = await collection.findOne({ owner_id: ownerObjectId });
    
    if (existing) {
      const updatePayload: any = {
        ...updateData,
        last_updated: new Date(),
      };
      await collection.updateOne(
        { owner_id: ownerObjectId },
        { $set: updatePayload }
      );
      const updated = await collection.findOne({ owner_id: ownerObjectId });
      if (!updated) throw new Error("Failed to update room");
      return updated;
    } else {
      const result = await collection.insertOne({
        _id: new ObjectId(),
        ...createData,
        owner_id: ownerObjectId,
        last_updated: new Date(),
      } as Room);
      const room = await collection.findOne({ _id: result.insertedId });
      if (!room) throw new Error("Failed to create room");
      return room;
    }
  },

  async delete(id: string | ObjectId): Promise<void> {
    const collection = await getCollection<Room>("rooms");
    await collection.deleteOne({ _id: toObjectId(id) });
  },
};

// ChatRoom operations
export const chatRooms = {
  async findById(id: string): Promise<ChatRoom | null> {
    const collection = await getCollection<ChatRoom>("chatrooms");
    return collection.findOne({ _id: id });
  },

  async create(data: CreateChatRoomInput = {}): Promise<ChatRoom> {
    const collection = await getCollection<ChatRoom>("chatrooms");
    const now = new Date();
    const chatRoom: ChatRoom = {
      _id: randomUUID(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    await collection.insertOne(chatRoom);
    return chatRoom;
  },

  async delete(id: string): Promise<void> {
    const collection = await getCollection<ChatRoom>("chatrooms");
    await collection.deleteOne({ _id: id });
  },
};

// Message operations
export const messages = {
  async findMany(where: { chatRoomId: string }): Promise<Message[]> {
    const collection = await getCollection<Message>("messages");
    return collection.find(where).toArray();
  },

  async create(data: CreateMessageInput): Promise<Message> {
    const collection = await getCollection<Message>("messages");
    const now = new Date();
    const message: Message = {
      _id: randomUUID(),
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
      text: data.text,
      chatRoomId: data.chatRoomId,
    };
    await collection.insertOne(message);
    return message;
  },

  async delete(id: string): Promise<void> {
    const collection = await getCollection<Message>("messages");
    await collection.deleteOne({ _id: id });
  },
};

// Export a db object for database operations
export const db = {
  account: accounts,
  session: sessions,
  user: users,
  verificationToken: verificationTokens,
  room: rooms,
  chatRoom: chatRooms,
  message: messages,
};
