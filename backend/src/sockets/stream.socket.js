import {
  addViewer,
  removeViewer,
  getViewersForStream,
} from "./presence.store.js";

const broadcastPresence = (io, streamId) => {
  const viewerCount =
    io.sockets.adapter.rooms.get(`stream:${streamId}`)?.size || 0;
  io.to(`stream:${streamId}`).emit("viewer-count", viewerCount);
  io.to(`stream:${streamId}`).emit(
    "viewer-list",
    getViewersForStream(streamId),
  );
};

/**
 * Registers "join-stream" / "leave-stream" / "disconnect" presence handlers
 * for a single connected socket.
 */
const registerStreamPresenceHandlers = (io, socket) => {
  socket.on("join-stream", (streamId, userData) => {
    socket.join(`stream:${streamId}`);

    // Trust the server-verified identity from the auth middleware when
    // available; fall back to the client-provided display info only for
    // anonymous viewers.
    addViewer(socket.id, {
      ...userData,
      userId: socket.data.userId || userData?.userId || "anonymous",
      streamId,
    });

    broadcastPresence(io, streamId);
  });

  socket.on("leave-stream", (streamId) => {
    socket.leave(`stream:${streamId}`);
    removeViewer(socket.id);
    broadcastPresence(io, streamId);
  });

  socket.on("disconnect", () => {
    const data = removeViewer(socket.id);
    if (data?.streamId) {
      broadcastPresence(io, data.streamId);
    }
  });
};

export default registerStreamPresenceHandlers;
