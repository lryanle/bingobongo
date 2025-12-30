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
  Player,
  Activity,
  CreateAccountInput,
  CreateSessionInput,
  CreateUserInput,
  CreateVerificationTokenInput,
  CreateRoomInput,
  UpdateRoomInput,
  CreateChatRoomInput,
  CreateMessageInput,
  CreatePlayerInput,
  UpdatePlayerInput,
  CreateActivityInput,
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
    const collection = await getCollection<Account>("Accounts");
    return collection.findOne({ _id: toObjectId(id) });
  },

  async findByProvider(provider: string, providerAccountId: string): Promise<Account | null> {
    const collection = await getCollection<Account>("Accounts");
    return collection.findOne({
      provider,
      provider_account_id: providerAccountId,
    });
  },

  async create(data: CreateAccountInput): Promise<Account> {
    const collection = await getCollection<Account>("Accounts");
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
    const collection = await getCollection<Account>("Accounts");
    await collection.deleteOne({ _id: toObjectId(id) });
  },
};

// Session operations
export const sessions = {
  async findByToken(sessionToken: string): Promise<Session | null> {
    const collection = await getCollection<Session>("Sessions");
    return collection.findOne({ session_token: sessionToken });
  },

  async create(data: CreateSessionInput): Promise<Session> {
    const collection = await getCollection<Session>("Sessions");
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
    const collection = await getCollection<Session>("Sessions");
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
    const collection = await getCollection<Session>("Sessions");
    await collection.deleteOne({ session_token: sessionToken });
  },
};

// User operations
export const users = {
  async findById(id: string | ObjectId): Promise<User | null> {
    const collection = await getCollection<User>("Users");
    return collection.findOne({ _id: toObjectId(id) });
  },

  async findByEmail(email: string): Promise<User | null> {
    const collection = await getCollection<User>("Users");
    return collection.findOne({ email });
  },

  async create(data: CreateUserInput): Promise<User> {
    const collection = await getCollection<User>("Users");
    // If _id is provided, use it; otherwise generate a new ObjectId
    const userId = (data as any)._id ? toObjectId((data as any)._id) : new ObjectId();
    
    // Remove _id from data if it exists to avoid conflicts
    const { _id: _, ...dataWithoutId } = data as any;
    
    const userData = {
      _id: userId,
      created: data.created || new Date(),
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        totalItemsMarked: 0,
        totalBingos: 0,
        currentWinStreak: 0,
        longestWinStreak: 0,
      },
      ...dataWithoutId,
    } as User;
    
    // Use upsert to avoid duplicates if user already exists
    await collection.updateOne(
      { _id: userId },
      { $setOnInsert: userData },
      { upsert: true }
    );
    
    const user = await collection.findOne({ _id: userId });
    if (!user) throw new Error("Failed to create user");
    return user;
  },

  async update(id: string | ObjectId, data: Partial<CreateUserInput>): Promise<User> {
    const collection = await getCollection<User>("Users");
    await collection.updateOne(
      { _id: toObjectId(id) },
      { $set: data }
    );
    const user = await collection.findOne({ _id: toObjectId(id) });
    if (!user) throw new Error("Failed to update user");
    return user;
  },

  async delete(id: string | ObjectId): Promise<void> {
    const collection = await getCollection<User>("Users");
    await collection.deleteOne({ _id: toObjectId(id) });
  },

  async incrementStats(
    id: string | ObjectId,
    updates: {
      gamesPlayed?: number;
      gamesWon?: number;
      totalItemsMarked?: number;
      totalBingos?: number;
      gameMode?: string;
    }
  ): Promise<User> {
    const collection = await getCollection<User>("Users");
    const userId = toObjectId(id);
    
    // Get current user to check win streak
    const user = await collection.findOne({ _id: userId });
    if (!user) throw new Error("User not found");
    
    const currentStats = user.stats || {
      gamesPlayed: 0,
      gamesWon: 0,
      totalItemsMarked: 0,
      totalBingos: 0,
      currentWinStreak: 0,
      longestWinStreak: 0,
    };
    
    // Calculate new win streak
    let newWinStreak = currentStats.currentWinStreak || 0;
    let newLongestWinStreak = currentStats.longestWinStreak || 0;
    
    if (updates.gamesWon && updates.gamesWon > 0) {
      // User won a game
      newWinStreak = (currentStats.currentWinStreak || 0) + 1;
      newLongestWinStreak = Math.max(newLongestWinStreak, newWinStreak);
    } else if (updates.gamesPlayed && updates.gamesPlayed > 0 && !updates.gamesWon) {
      // User played but didn't win (lost)
      newWinStreak = 0;
    }
    
    // Build update operations - separate $inc and $set to avoid conflicts
    const incOperations: Record<string, number> = {};
    const setOperations: Record<string, unknown> = {};
    
    // Only include $inc operations for fields that need incrementing
    if (updates.gamesPlayed) incOperations["stats.gamesPlayed"] = updates.gamesPlayed;
    if (updates.gamesWon) incOperations["stats.gamesWon"] = updates.gamesWon;
    if (updates.totalItemsMarked) incOperations["stats.totalItemsMarked"] = updates.totalItemsMarked;
    if (updates.totalBingos) incOperations["stats.totalBingos"] = updates.totalBingos;
    
    // Set operations for calculated/derived fields
    setOperations["stats.currentWinStreak"] = newWinStreak;
    setOperations["stats.longestWinStreak"] = newLongestWinStreak;
    setOperations["stats.lastPlayed"] = new Date();
    if (updates.gameMode) {
      setOperations["stats.favoriteGameMode"] = updates.gameMode;
    }
    
    // Ensure stats object exists if it doesn't
    if (!user.stats) {
      setOperations["stats.gamesPlayed"] = currentStats.gamesPlayed;
      setOperations["stats.gamesWon"] = currentStats.gamesWon;
      setOperations["stats.totalItemsMarked"] = currentStats.totalItemsMarked;
      setOperations["stats.totalBingos"] = currentStats.totalBingos;
    }
    
    // Build the update document
    const updateDoc: Record<string, unknown> = {};
    if (Object.keys(incOperations).length > 0) {
      updateDoc.$inc = incOperations;
    }
    if (Object.keys(setOperations).length > 0) {
      updateDoc.$set = setOperations;
    }
    
    await collection.updateOne({ _id: userId }, updateDoc);
    
    const updatedUser = await collection.findOne({ _id: userId });
    if (!updatedUser) throw new Error("Failed to update user stats");
    return updatedUser;
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

  async findAll(limit: number = 50, sortBy: "last_updated" | "created" = "last_updated"): Promise<Room[]> {
    const collection = await getCollection<Room>("rooms");
    const sortField = sortBy === "created" ? "_id" : "last_updated";
    return collection
      .find({})
      .sort({ [sortField]: -1 })
      .limit(limit)
      .toArray();
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

  async claimItem(
    roomId: string | ObjectId,
    cellIndex: number,
    teamIndex: number,
    userId: string | ObjectId
  ): Promise<{ claimed: boolean; previousTeam?: number; updatedRoom: Room }> {
    const collection = await getCollection<Room>("rooms");
    const room = await collection.findOne({ _id: toObjectId(roomId) });
    
    if (!room) {
      throw new Error("Room not found");
    }

    const claimedItems = room.claimedItems || [];
    // Find all claims for this cell by this team
    const existingTeamClaims = claimedItems.filter(
      (item) => item.cellIndex === cellIndex && item.teamIndex === teamIndex
    );
    
    let updatedItems: typeof claimedItems;
    let claimed: boolean;
    
    // If same team already claimed, unclaim it (toggle)
    if (existingTeamClaims.length > 0) {
      updatedItems = claimedItems.filter(
        (item) => !(item.cellIndex === cellIndex && item.teamIndex === teamIndex)
      );
      claimed = false;
    } else {
      // Add claim for this team (multiple teams can claim the same cell)
      updatedItems = [
        ...claimedItems,
        {
          cellIndex,
          teamIndex,
          claimedAt: new Date(),
          claimedBy: toObjectId(userId),
        },
      ];
      claimed = true;
    }
    
    // Use findOneAndUpdate to get the updated document in one operation
    const result = await collection.findOneAndUpdate(
      { _id: toObjectId(roomId) },
      { $set: { claimedItems: updatedItems, last_updated: new Date() } },
      { returnDocument: "after" }
    );
    
    if (!result?.value) {
      throw new Error("Failed to update room");
    }
    
    return { 
      claimed, 
      previousTeam: claimed ? undefined : teamIndex,
      updatedRoom: result.value,
    };
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

// Player operations
export const players = {
  async findByRoomId(roomId: string | ObjectId): Promise<Player[]> {
    const collection = await getCollection<Player>("players");
    return collection.find({ room_id: toObjectId(roomId) }).toArray();
  },

  async findByRoomAndUserId(roomId: string | ObjectId, userId: string | ObjectId): Promise<Player | null> {
    const collection = await getCollection<Player>("players");
    return collection.findOne({
      room_id: toObjectId(roomId),
      user_id: toObjectId(userId),
    });
  },

  async create(data: CreatePlayerInput): Promise<Player> {
    const collection = await getCollection<Player>("players");
    const now = new Date();
    const result = await collection.insertOne({
      _id: new ObjectId(),
      ...data,
      room_id: toObjectId(data.room_id),
      user_id: toObjectId(data.user_id),
      marked_items: data.marked_items || [],
      joined_at: data.joined_at || now,
      last_active: data.last_active || now,
    } as Player);
    const player = await collection.findOne({ _id: result.insertedId });
    if (!player) throw new Error("Failed to create player");
    return player;
  },

  async update(roomId: string | ObjectId, userId: string | ObjectId, data: UpdatePlayerInput): Promise<Player> {
    const collection = await getCollection<Player>("players");
    const updateData: any = {
      ...data,
      last_active: data.last_active || new Date(),
    };
    await collection.updateOne(
      {
        room_id: toObjectId(roomId),
        user_id: toObjectId(userId),
      },
      { $set: updateData }
    );
    const player = await collection.findOne({
      room_id: toObjectId(roomId),
      user_id: toObjectId(userId),
    });
    if (!player) throw new Error("Failed to update player");
    return player;
  },

  async delete(roomId: string | ObjectId, userId: string | ObjectId): Promise<void> {
    const collection = await getCollection<Player>("players");
    await collection.deleteOne({
      room_id: toObjectId(roomId),
      user_id: toObjectId(userId),
    });
  },

  /**
   * Atomically toggle a marked item in the player's marked_items array.
   * This prevents race conditions when multiple requests try to mark/unmark items simultaneously.
   * Returns the updated player and whether the item was added (true) or removed (false).
   */
  async toggleMarkedItem(
    roomId: string | ObjectId,
    userId: string | ObjectId,
    cellIndex: number
  ): Promise<{ player: Player; wasAdded: boolean }> {
    const collection = await getCollection<Player>("players");
    
    // Get current state to determine operation
    const currentPlayer = await collection.findOne({
      room_id: toObjectId(roomId),
      user_id: toObjectId(userId),
    });

    if (!currentPlayer) {
      throw new Error("Player not found");
    }

    const wasMarked = currentPlayer.marked_items.includes(cellIndex);
    const previousLength = currentPlayer.marked_items.length;
    
    // Use atomic operation to toggle the item
    const updateOperation = wasMarked
      ? { $pull: { marked_items: cellIndex } } // Remove if exists
      : { $addToSet: { marked_items: cellIndex } }; // Add if not exists

    // Atomically update and return the updated document
    const result = await collection.findOneAndUpdate(
      {
        room_id: toObjectId(roomId),
        user_id: toObjectId(userId),
      },
      {
        ...updateOperation,
        $set: { last_active: new Date() },
      },
      { returnDocument: "after" }
    );

    if (!result?.value) {
      throw new Error("Failed to toggle marked item");
    }

    // Determine wasAdded by checking if the array length actually increased
    // This correctly handles concurrent requests: if another request already added
    // the item, our $addToSet will be a no-op and the length won't increase
    const newLength = result.value.marked_items.length;
    // wasAdded is true only if we tried to add (!wasMarked) AND the length increased
    // (indicating our operation actually added the item, not a concurrent request)
    const wasAdded = !wasMarked && newLength > previousLength;

    return {
      player: result.value,
      wasAdded,
    };
  },
};

// Activity operations
export const activities = {
  async findByRoomId(roomId: string | ObjectId, limit: number = 50): Promise<Activity[]> {
    const collection = await getCollection<Activity>("activities");
    return collection
      .find({ room_id: toObjectId(roomId) })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
  },

  async countByRoomId(roomId: string | ObjectId): Promise<number> {
    const collection = await getCollection<Activity>("activities");
    return collection.countDocuments({ room_id: toObjectId(roomId) });
  },

  async create(data: CreateActivityInput): Promise<Activity> {
    const collection = await getCollection<Activity>("activities");
    const now = new Date();
    const result = await collection.insertOne({
      _id: new ObjectId(),
      ...data,
      room_id: toObjectId(data.room_id),
      user_id: toObjectId(data.user_id),
      team_index: data.team_index,
      created_at: data.created_at || now,
    } as Activity);
    const activity = await collection.findOne({ _id: result.insertedId });
    if (!activity) throw new Error("Failed to create activity");
    return activity;
  },

  async delete(id: string | ObjectId): Promise<void> {
    const collection = await getCollection<Activity>("activities");
    await collection.deleteOne({ _id: toObjectId(id) });
  },

  async deleteByRoomId(roomId: string | ObjectId): Promise<void> {
    const collection = await getCollection<Activity>("activities");
    await collection.deleteMany({ room_id: toObjectId(roomId) });
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
  player: players,
  activity: activities,
};
