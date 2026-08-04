import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import socketAuth from "./auth.socket.js";
import registerStreamPresenceHandlers from "./stream.socket.js";
import registerChatHandlers from "./chat.socket.js";
import { getRedisClients, isRedisEnabled } from "../config/redis.config.js";

/**
 * Creates and wires up the Socket.IO server.
 *
 * All realtime logic (presence, chat, reactions) lives in this folder
 * instead of index.js so that:
 *  - index.js stays a thin composition root
 *  - each concern (auth / presence / chat) can be tested and evolved
 *    independently
 *
 * SCALING: when REDIS_URL is set, we attach the official Redis adapter.
 * Without it, `io.to(room).emit(...)` only reaches sockets connected to
 * *this* process — fine for a single instance, but broken the moment you
 * run 2+ backend instances behind a load balancer (a chat message sent by
 * a viewer on instance A would never reach a viewer connected to instance
 * B). The adapter makes broadcasts fan out across all instances via
 * Redis pub/sub.
 */
const createSocketServer = (httpServer, corsOrigins) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });

  if (isRedisEnabled()) {
    const { pubClient, subClient } = getRedisClients();
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Socket.IO: Redis adapter enabled (horizontal scaling ready)");
  } else {
    console.warn(
      "Socket.IO: REDIS_URL not set — running with in-memory adapter. " +
        "OK for a single instance, but broadcasts/presence will NOT be " +
        "consistent across multiple backend instances. Set REDIS_URL before " +
        "scaling horizontally.",
    );
  }

  io.use(socketAuth);

  io.on("connection", (socket) => {
    registerStreamPresenceHandlers(io, socket);
    registerChatHandlers(io, socket);
  });

  return io;
};

export default createSocketServer;
