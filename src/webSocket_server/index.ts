import { WebSocketServer } from "ws";

import { messageType } from "../constants";
import { generateId } from "../helpers";

interface Player {
  id: number,
  name: string,
  password: number
}

interface Room {
  id: number,
  players: Player[];
  isAvailable: boolean;
}




export const webSocketServer = () => {
    const webSocketServer = new WebSocketServer({port: 3000}) // replace port ?
    const players:Player[] = [];
    const rooms:Room[] = [];
    const tableOfWinners = [] // update/fix
    let userId = 1;

    webSocketServer.on('connection', function connection(ws) {
        ws.on('message', function message(message: string) {
          console.log('received: %s', message);

          const {type, data, id} = JSON.parse(message);

          if(type === messageType.reg) {

            const player = {
              id: generateId(),
              name: data.name,
              password: data.password
            }

            players.push(player);

            const playerIndex = players[players.length - 1]

            ws.send(JSON.stringify({
              type,
              data: JSON.stringify({name: data.name, index: playerIndex, error: false, errText: 'some error'}),//fix error text
              id
            }));

          }

          if(type === messageType.createRoom) {
            // rooms.push(['user-one']);

          } 

          if(type === messageType.addUserToRoom) {
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

