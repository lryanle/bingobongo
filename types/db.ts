// Database types for MongoDB collections
import { ObjectId } from "mongodb";

// Base types
export type DBObjectId = string | ObjectId;

// Account model
export interface Account {
  _id: DBObjectId;
  user_id: DBObjectId;
  type: string;
  provider: string;
  provider_account_id: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

// Session model
export interface Session {
  _id: DBObjectId;
  session_token: string;
  user_id: DBObjectId;
  expires: Date;
}

// User model
export interface User {
  _id: DBObjectId;
  name?: string;
  email?: string;
  email_verified?: Date;
  image?: string;
  created: Date;
}

// VerificationToken model
export interface VerificationToken {
  _id: string;
  token: string;
  expires: Date;
}

// Room model
export interface Room {
  _id: DBObjectId;
  roomName: string;
  roomPassword?: string;
  bingoSeed: string;
  gameMode: string;
  boardSize: number;
  teams: Array<{ name: string; color: string }>;
  owner_id: DBObjectId;
  last_updated: Date;
  bingoItems?: string[]; // List of bingo item titles
  claimedItems?: Array<{ // Track which team claimed each cell and when
    cellIndex: number;
    teamIndex: number;
    claimedAt: Date;
    claimedBy: DBObjectId; // User who claimed it
  }>;
  winningTeam?: number; // Team that won (if game is finished)
  gameFinished?: boolean;
  restartVotes?: Array<DBObjectId>; // Users who voted to restart
  restartCountdown?: number; // Countdown in seconds until restart
  restartScheduled?: Date; // When restart is scheduled
}

// ChatRoom model
export interface ChatRoom {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Message model
export interface Message {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  text: string;
  chatRoomId: string;
}

// Input types for creating/updating
export interface CreateAccountInput {
  user_id: DBObjectId;
  type: string;
  provider: string;
  provider_account_id: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

export interface CreateSessionInput {
  session_token: string;
  user_id: DBObjectId;
  expires: Date;
}

export interface CreateUserInput {
  name?: string;
  email?: string;
  email_verified?: Date;
  image?: string;
  created?: Date;
}

export interface CreateVerificationTokenInput {
  _id: string;
  token: string;
  expires: Date;
}

export interface CreateRoomInput {
  roomName: string;
  roomPassword?: string;
  bingoSeed: string;
  gameMode: string;
  boardSize: number;
  teams: Array<{ name: string; color: string }>;
  owner_id: DBObjectId;
  last_updated?: Date;
  bingoItems?: string[];
  claimedItems?: Array<{
    cellIndex: number;
    teamIndex: number;
    claimedAt: Date;
    claimedBy: DBObjectId;
  }>;
  winningTeam?: number;
  gameFinished?: boolean;
}

export interface UpdateRoomInput {
  roomName?: string;
  roomPassword?: string;
  bingoSeed?: string;
  gameMode?: string;
  boardSize?: number;
  teams?: Array<{ name: string; color: string }>;
  last_updated?: Date;
  bingoItems?: string[];
  claimedItems?: Array<{
    cellIndex: number;
    teamIndex: number;
    claimedAt: Date;
    claimedBy: DBObjectId;
  }>;
  winningTeam?: number;
  gameFinished?: boolean;
  resetBoard?: boolean; // Flag to reset the board
}

export interface CreateChatRoomInput {
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateMessageInput {
  text: string;
  chatRoomId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Player {
  _id: DBObjectId;
  room_id: DBObjectId;
  user_id: DBObjectId;
  team_index?: number;
  marked_items: number[];
  joined_at: Date;
  last_active: Date;
}

export interface Activity {
  _id: DBObjectId;
  room_id: DBObjectId;
  user_id: DBObjectId;
  user_name: string;
  action: string;
  item_title?: string;
  cell_index?: number;
  team_index?: number;
  created_at: Date;
}

export interface CreatePlayerInput {
  room_id: DBObjectId;
  user_id: DBObjectId;
  team_index?: number;
  marked_items?: number[];
  joined_at?: Date;
  last_active?: Date;
}

export interface UpdatePlayerInput {
  team_index?: number;
  marked_items?: number[];
  last_active?: Date;
}

export interface CreateActivityInput {
  room_id: DBObjectId;
  user_id: DBObjectId;
  user_name: string;
  action: string;
  item_title?: string;
  cell_index?: number;
  team_index?: number;
  created_at?: Date;
}

