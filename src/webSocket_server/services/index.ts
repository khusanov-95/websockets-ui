import { messageType } from "../../constants";
import { generateId } from "../../helpers";

import { Room, Player } from "..";
import { WebSocket, WebSocketServer } from "ws";

const getAvailableRoom = (rooms: Room[]) => {
  return rooms.filter((room) => room.roomUsers.length < 2) || [];
};

// export const addToRoom = (ws: WebSocket, rooms: Room[]) => {
//   const availableRooms = getAvailableRoom(rooms);
// };

export const createGame = (wss: WebSocketServer, idGame, room: Room) => {
  let counter = 0;
  wss.clients.forEach((client) => {
    const player: Player = room.roomUsers[counter];
    counter++;
    console.log(player, 8);
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
  // console.log(123);
  // const availableRooms = rooms.find((room) => room.isAvailable) || [];
  const availableRooms = getAvailableRoom(rooms);

  ws.send(
    JSON.stringify({
      type: messageType.updateRoom,
      data: JSON.stringify(availableRooms),
      id: 0,
    })
  );
  // console.log(availableRooms, 1);
  // wss.clients.forEach((client) => {
  //   client.send(
  //     JSON.stringify({
  //       type: messageType.updateRoom,
  //       data: JSON.stringify(availableRooms),
  //       id: 0,
  //     })
  //   );
  // });
};

export const updateWinners = (ws: WebSocket, tableOfWinners: any) => {
  ws.send(
    JSON.stringify({
      type: messageType.updateWinners,
      data: JSON.stringify(tableOfWinners), // fix
      id: 0,
    })
  );

  // wss.clients.forEach((client) => {
  //   client.send(
  //     JSON.stringify({
  //       type: messageType.updateWinners,
  //       data: JSON.stringify(tableOfWinners), // fix
  //       id: 0,
  //     })
  //   );
  // });
};

export const registerPlayer = (ws: WebSocket, player) => {
  // const { type, data, id } = JSON.parse(message);
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
  console.log(222);
  wss.clients.forEach((client) => {
    client.send(
      JSON.stringify({
        type: messageType.startGame,
        data: JSON.stringify({
          ships /* player's ships, not enemy's */,
          // [
          //     {
          //         position: {
          //             x: <number>,
          //             y: <number>,
          //         },
          //         direction: <boolean>,
          //         length: <number>,
          //         type: "small"|"medium"|"large"|"huge",
          //     }
          // ],
          currentPlayerIndex /* id of the player in the current game session, who have sent his ships */,
        }),
        id: 0,
      })
    );
  });
  // ws.send(
  //   JSON.stringify({
  //     type: messageType.createGame,
  //     data: JSON.stringify({
  //       ships /* player's ships, not enemy's */,
  //       // [
  //       //     {
  //       //         position: {
  //       //             x: <number>,
  //       //             y: <number>,
  //       //         },
  //       //         direction: <boolean>,
  //       //         length: <number>,
  //       //         type: "small"|"medium"|"large"|"huge",
  //       //     }
  //       // ],
  //       currentPlayerIndex /* id of the player in the current game session, who have sent his ships */,
  //     }),
  //     id: 0,
  //   })
  // );
};
