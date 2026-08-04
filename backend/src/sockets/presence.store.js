import { getRedisDataClient } from "../config/redis.config.js";

/**
 * Presence store: which users are currently watching which stream.
 *
 * - With REDIS_URL set: backed by a Redis Hash per stream
 *   (`stream:<id>:viewers`, field = socketId, value = JSON viewer data).
 *   This is what makes viewer-count/viewer-list correct once the backend
 *   is scaled to multiple instances, since every instance reads/writes the
 *   same Redis store instead of its own local Map.
 * - Without REDIS_URL (local/single-instance dev): falls back to an
 *   in-memory Map so `npm run dev` keeps working with zero extra setup.
 *
 * Callers always use the async API below, so swapping the backing store
 * never requires changes outside this file.
 */
const memoryStore = new Map(); // socketId -> viewer data

const redisKeyForStream = (streamId) => `stream:${streamId}:viewers`;
// Reverse lookup so removeViewer(socketId) doesn't need the streamId.
const redisKeyForSocket = (socketId) => `socket:${socketId}:stream`;

export const addViewer = async (socketId, data) => {
  const redis = getRedisDataClient();
  if (!redis) {
    memoryStore.set(socketId, data);
    return;
  }

  const { streamId } = data;
  await redis
    .multi()
    .hset(redisKeyForStream(streamId), socketId, JSON.stringify(data))
    .set(redisKeyForSocket(socketId), streamId)
    .exec();
};

export const removeViewer = async (socketId) => {
  const redis = getRedisDataClient();
  if (!redis) {
    const data = memoryStore.get(socketId) ?? null;
    memoryStore.delete(socketId);
    return data;
  }

  const streamId = await redis.get(redisKeyForSocket(socketId));
  if (!streamId) return null;

  const raw = await redis.hget(redisKeyForStream(streamId), socketId);
  await redis
    .multi()
    .hdel(redisKeyForStream(streamId), socketId)
    .del(redisKeyForSocket(socketId))
    .exec();

  return raw ? JSON.parse(raw) : null;
};

export const getViewersForStream = async (streamId) => {
  const redis = getRedisDataClient();
  if (!redis) {
    return Array.from(memoryStore.values()).filter(
      (u) => u.streamId === streamId,
    );
  }

  const raw = await redis.hvals(redisKeyForStream(streamId));
  return raw.map((v) => JSON.parse(v));
};

export default { addViewer, removeViewer, getViewersForStream };
