import { WebSocketServer } from "ws";

const wsPort = 3000;

export const webSocketServer = new WebSocketServer({
  port: wsPort,
});
