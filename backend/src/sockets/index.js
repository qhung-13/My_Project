import { Server } from "socket.io";
import socketAuth from "./auth.socket.js";
import registerStreamPresenceHandlers from "./stream.socket.js";
import registerChatHandlers from "./chat.socket.js";

/**
 * Creates and wires up the Socket.IO server.
 *
 * All realtime logic (presence, chat, reactions) lives in this folder
 * instead of index.js so that:
 *  - index.js stays a thin composition root
 *  - each concern (auth / presence / chat) can be tested and evolved
 *    independently
 *  - swapping in a Redis adapter for horizontal scaling is a one-line
 *    change here instead of a refactor of the whole entrypoint
 */
const createSocketServer = (httpServer, corsOrigins) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    registerStreamPresenceHandlers(io, socket);
    registerChatHandlers(io, socket);
  });

  return io;
};

export default createSocketServer;
