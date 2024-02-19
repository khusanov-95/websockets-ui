import { WebSocketServer } from "ws";


export const webSocketServer = () => {
    const webSocketServer = new WebSocketServer({port: 3000}) // replace port ?

    webSocketServer.on('connection', function connection(ws) {
        ws.on('message', function message(message: string) {
          console.log('received: %s', message);

          const {type, data, id} = JSON.parse(message);
          
            ws.send(JSON.stringify({
              type,
              data: JSON.stringify({name: data.name, index: 1, error: false, errText: 'some error'}),//fix error text
              id
            }));
        });


      
      
      });
}

