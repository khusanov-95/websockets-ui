import { WebSocketServer } from "ws";

import { WebSocket } from "ws";

import { messageType } from "../constants";
import { generateId } from "../helpers";
import {
  registerPlayer,
  updateRoom,
  updateWinners,
  createGame,
  startGame,
} from "./services";

export interface Player {
  name: string;
  index: number;
  ships: any[];
  password?: number; // remove ?
}

export interface Room {
  roomId: string;
  roomUsers: Player[];
  // isAvailable: boolean;
}

export interface Game {
  gameId: string;
}

const players: Player[] = [];
const rooms: Room[] = [];
const tableOfWinners = []; // update/fix
const games: Game[] = [];

const wsPort = 3000;

export const webSocketServer = new WebSocketServer({
  port: wsPort,
});

webSocketServer.on("connection", function connection(ws: WebSocket) {
  ws.on("message", function message(message: string) {
    console.log("received: %s", message);

    const { type, data, id } = JSON.parse(message);

    if (type === messageType.reg) {
      const { name, password } = JSON.parse(data);

      const player = {
        // id: 1 + generateId(),
        name,
        index: +generateId(),
        password,
        ships: [],
      };
      players.push(player);
      console.log(players);
      registerPlayer(ws, player);
      updateRoom(ws, rooms);
      updateWinners(ws, tableOfWinners);
    }

    if (type === messageType.createRoom) {
      const currentPlayer = players[players.length - 1]; // not correct ?

      rooms.push({
        roomId: generateId(),
        roomUsers: [currentPlayer],
        // isAvailable: true,
      });
      // console.log(rooms);
      updateRoom(ws, rooms);
    }

    if (type === messageType.addUserToRoom) {
      // const availableRoom = rooms.find((room) => room.isAvailable);
      // console.log(availableRoom)
      const { indexRoom } = JSON.parse(data);
      const currentPlayer = players[players.length - 1]; // wrong ?
      const room = rooms.find((room) => room.roomId === indexRoom);
      const newGame = { gameId: generateId() };

      room?.roomUsers.push(currentPlayer);
      games.push(newGame);

      createGame(webSocketServer, newGame?.gameId, room);
      updateRoom(ws, rooms);
    }

    if (type === messageType.addShips) {
      const { gameId, ships, indexPlayer } = JSON.parse(data);
      const currentRoom = rooms.find((room) =>
        room.roomUsers.find((user) => user.index === indexPlayer)
      );
      const currentPlayer = currentRoom.roomUsers.find(
        (player) => player.index === indexPlayer
      );

      currentPlayer.ships.push([...ships]);

      // console.log(
      //   currentRoom.roomUsers[0].ships.length,
      //   currentRoom.roomUsers[1].ships.length,
      //   123
      // );

      if (
        currentRoom.roomUsers[0].ships.length &&
        currentRoom.roomUsers[1].ships.length
      ) {
        const currentUserShips = currentPlayer.ships;
        startGame(webSocketServer, currentUserShips, indexPlayer);
      }
    }
  });
});
