/**
 * In-memory presence store: socketId -> { userId, username, avatar, streamId }
 *
 * NOTE (scaling): this Map only lives inside a single Node process. As soon
 * as the backend is scaled horizontally (2+ instances behind a load
 * balancer, which is the normal way to scale a Node app), each instance
 * will have a different, incomplete view of who is watching what, and
 * "viewer-count"/"viewer-list" events will be wrong depending on which
 * instance a given socket lands on.
 *
 * To scale this safely:
 *  1. Use the official Redis adapter for Socket.IO (`@socket.io/redis-adapter`)
 *     so broadcasts (`io.to(room).emit`) reach sockets connected to *other*
 *     instances too.
 *  2. Move this presence map into Redis (e.g. a Redis Hash/Set per stream,
 *     `SADD stream:<id>:viewers <userId>`) so viewer counts are correct
 *     across all instances, and survive an instance restart.
 *
 * This module isolates the current implementation so swapping it for a
 * Redis-backed version later only touches this one file.
 */
const socketUsers = new Map();

export const addViewer = (socketId, data) => {
  socketUsers.set(socketId, data);
};

export const removeViewer = (socketId) => {
  const data = socketUsers.get(socketId);
  socketUsers.delete(socketId);
  return data ?? null;
};

export const getViewersForStream = (streamId) =>
  Array.from(socketUsers.values()).filter((u) => u.streamId === streamId);

export default socketUsers;
