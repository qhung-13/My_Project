import {
  addViewer,
  removeViewer,
  getViewersForStream,
} from "./presence.store.js";

const normalizeStreamId = (value) =>
  String(value || "")
    .trim()
    .slice(0, 100);

const broadcastPresence = async (io, streamId) => {
  const viewers = await getViewersForStream(streamId);
  io.to(`stream:${streamId}`).emit("viewer-count", viewers.length);
  io.to(`stream:${streamId}`).emit("viewer-list", viewers);
};

const registerStreamPresenceHandlers = (io, socket) => {
  socket.on("join-stream", async (rawStreamId) => {
    try {
      const streamId = normalizeStreamId(rawStreamId);
      if (!streamId) return;

      // A socket can only represent one active stream presence at a time.
      const previous = await removeViewer(socket.id);
      if (previous?.streamId && previous.streamId !== streamId) {
        socket.leave(`stream:${previous.streamId}`);
        await broadcastPresence(io, previous.streamId);
      }

      socket.join(`stream:${streamId}`);
      await addViewer(socket.id, {
        userId: socket.data.userId || `anonymous:${socket.id}`,
        username: socket.data.username || `Guest-${socket.id.slice(0, 4)}`,
        avatar: socket.data.userId ? socket.data.avatar || null : null,
        streamId,
      });
      await broadcastPresence(io, streamId);
    } catch (error) {
      console.error("join-stream failed:", error);
      socket.emit("presence-error", {
        message: "Unable to join stream presence",
      });
    }
  });

  socket.on("leave-stream", async (rawStreamId) => {
    try {
      const removed = await removeViewer(socket.id);
      const streamId = removed?.streamId || normalizeStreamId(rawStreamId);
      if (!streamId) return;
      socket.leave(`stream:${streamId}`);
      await broadcastPresence(io, streamId);
    } catch (error) {
      console.error("leave-stream failed:", error);
    }
  });

  socket.on("disconnect", async () => {
    try {
      const removed = await removeViewer(socket.id);
      if (removed?.streamId) await broadcastPresence(io, removed.streamId);
    } catch (error) {
      console.error("disconnect presence cleanup failed:", error);
    }
  });
};

export default registerStreamPresenceHandlers;
