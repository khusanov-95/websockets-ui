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
  turn,
  finishGame,
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

const getAllAroundShipPosition = (length: number) => {};

function getNeighboringCoordinates(x, y) {
  const neighbors = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const newX = x + dx;
      const newY = y + dy;
      if (newX >= 0 && newX < 9 && newY >= 0 && newY < 9) {
        neighbors.push({ x: newX, Y: newY });
      }
    }
  }

  return neighbors;
}

const getAroundShipPosition = (shipPosition) =>
  getNeighboringCoordinates(shipPosition.x, shipPosition.y);

const contractShipsExactPositions = (ships: Ship[]) => {
  const shipsExactPositions = {
    small: { ships: [], aroundShip: [] },
    medium: { ships: [], aroundShip: [] },
    large: { ships: [], aroundShip: [] },
    huge: { ships: [], aroundShip: [] },
  };

  ships.forEach((ship) => {
    const { position, type, direction, length } = ship;
    // console.log(position);
    if (type === shipType.small) {
      shipsExactPositions.small.ships.push({ ...position });
      const aroundShipPositions = getAroundShipPosition(position);
      // console.log(aroundShipPositions, 96);
      shipsExactPositions.small.aroundShip.push([...aroundShipPositions]);
    }
    if (type === shipType.medium) {
      shipsExactPositions.medium.ships.push(
        getAllShipPositions(length, position, direction)
      );
    }
    if (type === shipType.large) {
      shipsExactPositions.large.ships.push(
        getAllShipPositions(length, position, direction)
      );
    }
    if (type === shipType.huge) {
      shipsExactPositions.huge.ships.push(
        getAllShipPositions(length, position, direction)
      );
    }
  });
  console.log(shipsExactPositions, 5);
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
        const positions = shipsExactPosition[shipType].ships;
        // const aroundShipPositions = shipsExactPosition["small"].aroundShip;

        positions.forEach((position, i) => {
          if (Array.isArray(position)) {
            position.forEach((positionItem, j) => {
              const { x: shipX, y: shipY } = positionItem;

              if (shipX === attackX && shipY === attackY) {
                // remove ship
                position.splice(j, 1);
                // if no ships left
                if (!positionItem.length) {
                  status = attackStatus.killed;
                  attack(ws, position, currentPlayer.index, status);

                  if (
                    !shipsExactPosition.small.ship.length &&
                    !shipsExactPosition.medium.ship.length &&
                    !shipsExactPosition.large.ship.length &&
                    !shipsExactPosition.huge.ship.length
                  ) {
                    finishGame(webSocketServer, currentPlayer.index);
                  }

                  turn(ws, currentPlayer.index);
                  return;
                }
                // send status
                status = attackStatus.shot;
                attack(ws, position, currentPlayer.index, status);
                turn(ws, currentPlayer.index);
              } else {
                attack(
                  ws,
                  { x: attackX, y: attackY },
                  currentPlayer.index,
                  status
                );
                turn(ws, enemyPlayer.index);
              }
            });
          } else {
            const { x: shipX, y: shipY } = position;
            if (shipX === attackX && shipY === attackY) {
              // remove ship
              positions.splice(i, 1);
              // if no ships left
              if (!position.length) {
                status = attackStatus.killed;
                attack(ws, position, currentPlayer.index, status);

                if (
                  !shipsExactPosition.small.ship.length &&
                  !shipsExactPosition.medium.ship.length &&
                  !shipsExactPosition.large.ship.length &&
                  !shipsExactPosition.huge.ship.length
                ) {
                  finishGame(webSocketServer, currentPlayer.index);
                }

                // aroundShipPositions[i].forEach((positionAround) => {
                //   status = attackStatus.miss;
                // attack(ws, positionAround, currentPlayer.index, status);
                // });
                turn(ws, currentPlayer.index);
                return;
              }
              // send status
              status = attackStatus.shot;
              attack(ws, position, currentPlayer.index, status);
              turn(ws, currentPlayer.index);
            } else {
              attack(
                ws,
                { x: attackX, y: attackY },
                currentPlayer.index,
                status
              );
              turn(ws, enemyPlayer.index);
            }
          }
        });
      }
    }

    if (type === messageType.randomAttack) {
      const { gameId, indexPlayer } = JSON.parse(data);
      const currentRoom = rooms.find((room) => room.roomId === gameId);

      const attackX = Math.floor(Math.random() * 9) + 1;
      const attackY = Math.floor(Math.random() * 9) + 1;

      const currentPlayer = currentRoom.roomUsers.find(
        (player) => player.index === indexPlayer
      );
      const enemyPlayer = currentRoom.roomUsers.find(
        (player) => player.index !== indexPlayer
      );

      const { shipsExactPosition } = enemyPlayer;

      let status = attackStatus.miss;

      for (let shipType in shipsExactPosition) {
        const positions = shipsExactPosition[shipType].ships;
        // const aroundShipPositions = shipsExactPosition["small"].aroundShip;

        positions.forEach((position, i) => {
          if (Array.isArray(position)) {
            position.forEach((positionItem, j) => {
              const { x: shipX, y: shipY } = positionItem;

              if (shipX === attackX && shipY === attackY) {
                // remove ship
                position.splice(j, 1);
                // if no ships left
                if (!positionItem.length) {
                  status = attackStatus.killed;
                  attack(ws, position, currentPlayer.index, status);

                  if (
                    !shipsExactPosition.small.ship.length &&
                    !shipsExactPosition.medium.ship.length &&
                    !shipsExactPosition.large.ship.length &&
                    !shipsExactPosition.huge.ship.length
                  ) {
                    finishGame(webSocketServer, currentPlayer.index);
                  }

                  turn(ws, currentPlayer.index);
                  return;
                }
                // send status
                status = attackStatus.shot;
                attack(ws, position, currentPlayer.index, status);
                turn(ws, currentPlayer.index);
              } else {
                attack(
                  ws,
                  { x: attackX, y: attackY },
                  currentPlayer.index,
                  status
                );
                turn(ws, enemyPlayer.index);
              }
            });
          } else {
            const { x: shipX, y: shipY } = position;
            if (shipX === attackX && shipY === attackY) {
              // remove ship
              positions.splice(i, 1);
              // if no ships left
              if (!position.length) {
                status = attackStatus.killed;
                attack(ws, position, currentPlayer.index, status);

                if (
                  !shipsExactPosition.small.ship.length &&
                  !shipsExactPosition.medium.ship.length &&
                  !shipsExactPosition.large.ship.length &&
                  !shipsExactPosition.huge.ship.length
                ) {
                  finishGame(webSocketServer, currentPlayer.index);
                }

                // aroundShipPositions[i].forEach((positionAround) => {
                //   status = attackStatus.miss;
                // attack(ws, positionAround, currentPlayer.index, status);
                // });
                turn(ws, currentPlayer.index);
                return;
              }
              // send status
              status = attackStatus.shot;
              attack(ws, position, currentPlayer.index, status);
              turn(ws, currentPlayer.index);
            } else {
              attack(
                ws,
                { x: attackX, y: attackY },
                currentPlayer.index,
                status
              );
              turn(ws, enemyPlayer.index);
            }
          }
        });
      }
    }
  });
});
