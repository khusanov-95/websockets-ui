import { WebSocketServer } from "ws";

import { messageType } from "../constants";
import { generateId } from "../helpers";

interface Player {
  name: string,
  index: number,
  id?: number, // remove ?
  password?: number // remove ?
}

interface Room {
  roomId: number,
  roomUsers: Player[];
  isAvailable: boolean;
}

const players:Player[] = [];
const rooms:Room[] = [];
const tableOfWinners = [] // update/fix


export const webSocketServer = () => {
    const webSocketServer = new WebSocketServer({port: 3000}) // replace port ?


    webSocketServer.on('connection', function connection(ws) {
        ws.on('message', function message(message: string) {
          console.log('received: %s', message);

          const {type, data, id} = JSON.parse(message);
      
 

          if(type === messageType.reg) {
            const {name, password} = JSON.parse(data);

            const playerIndex = +players[players.length] || 0;
            // console.log(players, players.length)
            const player = {
              id: generateId(),
              name,
              index: playerIndex,
              password
            }
            players.push(player);


            ws.send(JSON.stringify({
              type,
              data: JSON.stringify({name, index: playerIndex, error: false, errText: 'some error'}),//fix error text
              id
            }));

            const availableRooms = rooms.find(room => room.isAvailable) || [];

            console.log(availableRooms)

            ws.send(JSON.stringify({
              type: messageType.updateRoom,
              data: JSON.stringify(availableRooms),
              id: 0
            }));

            ws.send(JSON.stringify({
              type: messageType.updateWinners,
              data: JSON.stringify([]), // fix
              id: 0
            }));

          }

          if(type === messageType.createRoom) {
            // console.log(rooms, rooms.length)
            const currentPlayer = players[players.length - 1];

            rooms.push({
              roomId: generateId(),
              roomUsers: [currentPlayer],
              isAvailable: true
            });

            const availableRooms = rooms.find(room => room.isAvailable);
  
            ws.send(JSON.stringify({
              type: messageType.updateRoom,
              data: JSON.stringify(availableRooms),
              id: 0
            }));
            
          }

          if(type === messageType.addUserToRoom) {
            const availableRoom = rooms.find(room => room.isAvailable);
            // console.log(availableRoom)
            const currentPlayer = players[players.length - 1];
            
            // rooms[0].push('user-two');
            // ws.send(JSON.stringify({
            //   type,
            //   data: JSON.stringify( {
            //     idGame: 1,  
            //     idPlayer: 1, // id for player in the game session, who have sent add_user_to_room request, not enemy
            // },),//fix 
            //   id
            // }));
          }
   

          

        });
      
      
      });
}

