import { WebSocketServer } from "ws";

import { WebSocket } from "ws";

import { attackStatus, messageType, shipType } from "../constants";
import { generateId } from "../helpers";
import {
  registerPlayer,
  updateRoom,
  updateWinners,
  createGame,
  startGame,
  attack,
} from "./services";

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

const players: Player[] = [];
const rooms: Room[] = [];
const tableOfWinners = []; // update/fix
const games: Game[] = [];

const wsPort = 3000;

export const webSocketServer = new WebSocketServer({
  port: wsPort,
});

// const shipsExactPositions = [
//   { small: [{}, {}, {}, {}] },
//   { medium: [{}, {}, {}] },
//   { large: [{}, {}] },
//   { huge: {} },
// ];

const getAllShipPositions = (
  length: number,
  initialPosition: any,
  direction: boolean
) => {
  const targetValue = direction ? "y" : "x";

  const secondaryValue = direction ? "x" : "y";

  const allPositions = [];

  for (let i = 0; i < length; i++) {
    allPositions.push({
      [targetValue]: initialPosition[targetValue] + i,
      [secondaryValue]: initialPosition[secondaryValue],
    });
  }
  return allPositions;
};

const contractShipsExactPositions = (ships: Ship[]) => {
  const shipsExactPositions = { small: [], medium: [], large: [], huge: [] };

  ships.forEach((ship) => {
    const { position, type, direction, length } = ship;

    if (type === shipType.small) {
      shipsExactPositions.small.push({ ...position });
    }
    if (type === shipType.medium) {
      shipsExactPositions.medium.push(
        getAllShipPositions(length, position, direction)
      );
    }
    if (type === shipType.large) {
      shipsExactPositions.large.push(
        getAllShipPositions(length, position, direction)
      );
    }
    if (type === shipType.huge) {
      shipsExactPositions.huge.push(
        getAllShipPositions(length, position, direction)
      );
    }
  });

  return shipsExactPositions;
};

webSocketServer.on("connection", function connection(ws: WebSocket) {
  ws.on("message", function message(message: string) {
    console.log("received: %s", message);

    const { type, data, id } = JSON.parse(message);

    if (type === messageType.reg) {
      const { name, password } = JSON.parse(data);

      const player = {
        name,
        index: +generateId(),
        password,
        ships: [],
      };
      players.push(player);

      registerPlayer(ws, player);
      updateRoom(ws, rooms);
      updateWinners(ws, tableOfWinners);
    }

    if (type === messageType.createRoom) {
      const currentPlayer = players[players.length - 1]; // not correct ?

      rooms.push({
        roomId: generateId(),
        roomUsers: [currentPlayer],
      });

      updateRoom(ws, rooms);
    }

    if (type === messageType.addUserToRoom) {
      const { indexRoom } = JSON.parse(data);
      const currentPlayer = players[players.length - 1]; // wrong ?
      const room = rooms.find((room) => room.roomId === indexRoom);
      const newGame = { gameId: room.roomId };

      room?.roomUsers.push(currentPlayer);
      games.push(newGame);

      createGame(webSocketServer, newGame?.gameId, room);
      updateRoom(ws, rooms);
    }

    if (type === messageType.addShips) {
      const { gameId, ships, indexPlayer } = JSON.parse(data);
      const currentRoom = rooms.find((room) => room.roomId === gameId);
      const currentPlayer = currentRoom.roomUsers.find(
        (player) => player.index === indexPlayer
      );

      if (currentPlayer) {
        //@ts-ignore
        currentPlayer.ships.push([...ships]);

        currentPlayer.shipsExactPosition = contractShipsExactPositions(ships);
      }

      if (
        currentRoom.roomUsers[0].ships.length &&
        currentRoom.roomUsers[1].ships.length
      ) {
        const currentUserShips = currentPlayer.ships;
        startGame(webSocketServer, currentUserShips, indexPlayer);
      }
    }

    if (type === messageType.attack) {
      const { gameId, x: attackX, y: attackY, indexPlayer } = JSON.parse(data);
      const currentRoom = rooms.find((room) => room.roomId === gameId);

      const currentPlayer = currentRoom.roomUsers.find(
        (player) => player.index === indexPlayer
      );
      const enemyPlayer = currentRoom.roomUsers.find(
        (player) => player.index !== indexPlayer
      );

      const { shipsExactPosition } = enemyPlayer;

      let status = attackStatus.miss;

      for (let shipType in shipsExactPosition) {
        const positions = shipsExactPosition[shipType];

        positions.forEach((position, i) => {
          if (Array.isArray(position)) {
            position.forEach((positionItem, j) => {
              const { x: shipX, y: shipY } = positionItem;

              if (shipX === attackX && shipY === attackY) {
                // remove ship
                position.splice(j, 1);
                console.log(position, j);
                // if no ships left
                if (!positionItem.length) {
                  status = attackStatus.killed;
                }
                // send status
                status = attackStatus.shot;
                attack(ws, position, currentPlayer.index, status);
              } else {
                attack(ws, position, currentPlayer.index, status);
              }
            });
          } else {
            const { x: shipX, y: shipY } = position;
            if (shipX === attackX && shipY === attackY) {
              // remove ship
              positions.splice(i, 1);
              console.log(position, i);
              // if no ships left
              if (!position.length) {
                status = attackStatus.killed;
              }
              // send status
              status = attackStatus.shot;
              attack(ws, position, currentPlayer.index, status);
            } else {
              attack(ws, position, currentPlayer.index, status);
            }
          }
        });
      }
    }

    if (type === messageType.randomAttack) {
    }
  });
});
