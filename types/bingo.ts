// type def for a bingo room
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified?: string;
  image: string;
  created?: string;
}

export interface BingoRoom {
  id: string;
  roomName: string;
  roomPassword?: string;
  bingoSeed: string;
  gameMode: string;
  boardSize: number;
  teams: {name: string, color: string}[];
  ownerId: string;
  owner: User;
  lastUpdated?: string;
}