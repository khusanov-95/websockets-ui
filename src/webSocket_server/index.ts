import { WebSocket } from "ws";

import { attackStatus, messageType, shipType } from "../constants";
import { webSocketServer } from "./webSocketServer";
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
import { Player, Room, Game, Ship } from "../interfaces";
import { contractShipsExactPositions } from "./utils";

const players: Player[] = [];
const rooms: Room[] = [];
const tableOfWinners = []; // update/fix
const games: Game[] = [];

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
        turn(webSocketServer, currentPlayer.index);
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
        console.log(positions);
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
                    !shipsExactPosition.small.ships.length &&
                    !shipsExactPosition.medium.ships.length &&
                    !shipsExactPosition.large.ships.length &&
                    !shipsExactPosition.huge.ships.length
                  ) {
                    finishGame(webSocketServer, currentPlayer.index);
                  }

                  turn(webSocketServer, currentPlayer.index);
                  return;
                }
                // send status
                status = attackStatus.shot;
                attack(ws, position, currentPlayer.index, status);
                turn(webSocketServer, currentPlayer.index);
              } else {
                attack(
                  ws,
                  { x: attackX, y: attackY },
                  currentPlayer.index,
                  status
                );
                turn(webSocketServer, enemyPlayer.index);
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
                  !shipsExactPosition.small.ships.length &&
                  !shipsExactPosition.medium.ships.length &&
                  !shipsExactPosition.large.ships.length &&
                  !shipsExactPosition.huge.ships.length
                ) {
                  finishGame(webSocketServer, currentPlayer.index);
                }

                // aroundShipPositions[i].forEach((positionAround) => {
                //   status = attackStatus.miss;
                // attack(ws, positionAround, currentPlayer.index, status);
                // });
                turn(webSocketServer, currentPlayer.index);
                return;
              }
              // send status
              status = attackStatus.shot;
              attack(ws, position, currentPlayer.index, status);
              turn(webSocketServer, currentPlayer.index);
            } else {
              attack(
                ws,
                { x: attackX, y: attackY },
                currentPlayer.index,
                status
              );
              turn(webSocketServer, enemyPlayer.index);
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
                    !shipsExactPosition.small.ships.length &&
                    !shipsExactPosition.medium.ships.length &&
                    !shipsExactPosition.large.ships.length &&
                    !shipsExactPosition.huge.ships.length
                  ) {
                    finishGame(webSocketServer, currentPlayer.index);
                  }

                  turn(webSocketServer, currentPlayer.index);
                  return;
                }
                // send status
                status = attackStatus.shot;
                attack(ws, position, currentPlayer.index, status);
                turn(webSocketServer, currentPlayer.index);
              } else {
                attack(
                  ws,
                  { x: attackX, y: attackY },
                  currentPlayer.index,
                  status
                );
                turn(webSocketServer, enemyPlayer.index);
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
                turn(webSocketServer, currentPlayer.index);
                return;
              }
              // send status
              status = attackStatus.shot;
              attack(ws, position, currentPlayer.index, status);
              turn(webSocketServer, currentPlayer.index);
            } else {
              attack(
                ws,
                { x: attackX, y: attackY },
                currentPlayer.index,
                status
              );
              turn(webSocketServer, enemyPlayer.index);
            }
          }
        });
      }
    }
  });
});
