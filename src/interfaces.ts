export interface Ship {
  position: { x: number; y: number };
  direction: boolean;
  type: string;
  length: number;
}

export interface Player {
  name: string;
  index: number;
  ships: Ship[];
  shipsExactPosition?: any;
  password?: number;
}

export interface Room {
  roomId: string;
  roomUsers: Player[];
}

export interface Game {
  gameId: string;
}
