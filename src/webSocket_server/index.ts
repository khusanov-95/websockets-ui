import { WebSocketServer } from "ws";

import { WebSocket } from "ws";

import { messageType } from "../constants";
import { generateId } from "../helpers";
import {
  registerPlayer,
  updateRoom,
  updateWinners,
  createGame,
} from "./services";

export interface Player {
  name: string;
  index: number;
  password?: number; // remove ?
}

export interface Room {
  roomId: string;
  roomUsers: Player[];
  // isAvailable: boolean;
}

const players: Player[] = [];
const rooms: Room[] = [];
const tableOfWinners = []; // update/fix

const wsPort = 3000;

export const webSocketServer = new WebSocketServer({
  port: wsPort,
});

webSocketServer.on("connection", function connection(ws: WebSocket) {
  ws.on("message", function message(message: string) {
    console.log("received: %s", message);

    const { type, data, id } = JSON.parse(message);

    if (type === messageType.reg) {
      const playerIndex = generateId();
      const { name, password } = JSON.parse(data);

      const player = {
        id: generateId(),
        name,
        index: +playerIndex,
        password,
      };
      players.push(player);

      registerPlayer(ws, message, players);
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
      console.log(rooms);
      updateRoom(ws, rooms);
    }

    if (type === messageType.addUserToRoom) {
      // const availableRoom = rooms.find((room) => room.isAvailable);
      // console.log(availableRoom)
      const { indexRoom } = JSON.parse(data);
      const currentPlayer = players[players.length - 1]; // wrong ?
      const room = rooms.find((room) => room.roomId === indexRoom);
      room?.roomUsers.push(currentPlayer);

      console.log(room, currentPlayer, room);

      updateRoom(ws, rooms);
      createGame(webSocketServer, currentPlayer.index, room?.roomId);
    }
  });
});
