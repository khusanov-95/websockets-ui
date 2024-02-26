import { messageType } from "../../constants";

import { Room, Player } from "..";
import { WebSocket, WebSocketServer } from "ws";

const getAvailableRoom = (rooms: Room[]) => {
  return rooms.filter((room) => room.roomUsers.length < 2) || [];
};

export const attack = (ws: WebSocket, position, currentPlayer, status) => {
  ws.send(
    JSON.stringify({
      type: messageType.attack,
      data: JSON.stringify({
        position,
        currentPlayer,
        status,
      }),
      id: 0,
    })
  );
};

export const randomAttack = (ws: WebSocket, gameId, indexPlayer) => {
  ws.send(
    JSON.stringify({
      type: messageType.randomAttack,
      data: JSON.stringify({
        gameId,
        indexPlayer,
      }),
      id: 0,
    })
  );
};

export const turn = (ws: WebSocket, currentPlayer) => {
  ws.send(
    JSON.stringify({
      type: messageType.turn,
      data: JSON.stringify({
        currentPlayer,
      }),
      id: 0,
    })
  );
};

export const createGame = (wss: WebSocketServer, idGame, room: Room) => {
  let counter = 0;
  wss.clients.forEach((client) => {
    const player: Player = room.roomUsers[counter];
    counter++;

    client.send(
      JSON.stringify({
        type: messageType.createGame,
        data: JSON.stringify({ idGame, idPlayer: player.index }),
        id: 0,
      })
    );
  });
};

export const updateRoom = (ws: WebSocket, rooms: Room[]) => {
  const availableRooms = getAvailableRoom(rooms);

  ws.send(
    JSON.stringify({
      type: messageType.updateRoom,
      data: JSON.stringify(availableRooms),
      id: 0,
    })
  );
};

export const updateWinners = (ws: WebSocket, tableOfWinners: any) => {
  ws.send(
    JSON.stringify({
      type: messageType.updateWinners,
      data: JSON.stringify(tableOfWinners), // fix
      id: 0,
    })
  );
};

export const registerPlayer = (ws: WebSocket, player) => {
  const { name, id } = player;

  ws.send(
    JSON.stringify({
      type: messageType.reg,
      data: JSON.stringify({
        name,
        index: id,
        error: false,
        errText: "some error",
      }), //fix error text
      id: 0,
    })
  );
};

export const startGame = (wss: WebSocketServer, ships, currentPlayerIndex) => {
  wss.clients.forEach((client) => {
    client.send(
      JSON.stringify({
        type: messageType.startGame,
        data: JSON.stringify({
          ships,
          currentPlayerIndex,
        }),
        id: 0,
      })
    );
  });
};

export const finishGame = (wss: WebSocketServer, winPlayer) => {
  wss.clients.forEach((client) => {
    client.send(
      JSON.stringify({
        type: messageType.startGame,
        data: JSON.stringify({
          winPlayer,
        }),
        id: 0,
      })
    );
  });
};
