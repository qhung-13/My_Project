import mongoose from "mongoose";
import Stream from "../models/Stream.model.js";
import {
  addViewer,
  refreshViewer,
  removeViewer,
  getViewersForStream,
} from "./presence.store.js";

const normalizeStreamId = (value) => {
  const streamId = String(value || "").trim();
  return mongoose.isValidObjectId(streamId) ? streamId : "";
};

const syncViewerCount = async (streamId, count) => {
  try {
    await Stream.updateOne(
      { _id: streamId, isLive: true },
      {
        $set: { viewers: count },
        $max: { peakViewers: count },
      },
    );
  } catch (error) {
    console.warn("Unable to persist viewer count:", error.message);
  }
};

const broadcastPresence = async (io, streamId) => {
  const viewers = await getViewersForStream(streamId);
  const count = viewers.length;
  io.to(`stream:${streamId}`).emit("viewer-count", count);
  io.to(`stream:${streamId}`).emit("viewer-list", viewers);
  await syncViewerCount(streamId, count);
};

const registerStreamPresenceHandlers = (io, socket) => {
  socket.on("join-stream", async (rawStreamId) => {
    try {
      const streamId = normalizeStreamId(rawStreamId);
      if (!streamId) {
        socket.emit("presence-error", { message: "Invalid stream id" });
        return;
      }

      const streamExists = await Stream.exists({ _id: streamId, isLive: true });
      if (!streamExists) {
        socket.emit("presence-error", { message: "Stream is not live" });
        return;
      }

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
      console.error("join-stream failed:", error.message || error);
      socket.emit("presence-error", {
        message: "Unable to join stream presence",
      });
    }
  });

  socket.on("viewer-heartbeat", async () => {
    try {
      await refreshViewer(socket.id);
    } catch (error) {
      console.warn("viewer heartbeat failed:", error.message || error);
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
      console.error("leave-stream failed:", error.message || error);
    }
  });

  socket.on("disconnect", async () => {
    try {
      const removed = await removeViewer(socket.id);
      if (removed?.streamId) await broadcastPresence(io, removed.streamId);
    } catch (error) {
      console.error(
        "disconnect presence cleanup failed:",
        error.message || error,
      );
    }
  });
};

export default registerStreamPresenceHandlers;
