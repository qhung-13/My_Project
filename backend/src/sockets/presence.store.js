import { getRedisDataClient } from "../config/redis.config.js";

/**
 * Presence store for live viewers.
 *
 * Memory is always updated so a single backend keeps working even if Redis is
 * temporarily unavailable. When Redis is healthy we also mirror presence there
 * so multiple backend instances share the same view of the room.
 */
const memoryStore = new Map(); // socketId -> viewer data
const VIEWER_STALE_AFTER_MS = 180_000;

const redisKeyForStream = (streamId) => `stream:${streamId}:viewers`;
const redisKeyForSocket = (socketId) => `socket:${socketId}:stream`;

let lastRedisWarningAt = 0;
const warnRedisFallback = (error) => {
  const now = Date.now();
  if (now - lastRedisWarningAt < 10_000) return;
  lastRedisWarningAt = now;
  console.warn(
    "Presence store: Redis unavailable, using in-memory fallback:",
    error?.message || error,
  );
};

export const addViewer = async (socketId, data) => {
  const viewer = { ...data, lastSeen: Date.now() };
  memoryStore.set(socketId, viewer);

  const redis = getRedisDataClient();
  if (!redis) return;

  try {
    await redis
      .multi()
      .hset(redisKeyForStream(data.streamId), socketId, JSON.stringify(viewer))
      .set(redisKeyForSocket(socketId), data.streamId)
      .exec();
  } catch (error) {
    warnRedisFallback(error);
  }
};

export const refreshViewer = async (socketId) => {
  const viewer = memoryStore.get(socketId);
  if (!viewer) return null;

  const refreshed = { ...viewer, lastSeen: Date.now() };
  memoryStore.set(socketId, refreshed);

  const redis = getRedisDataClient();
  if (!redis) return refreshed;

  try {
    await redis.hset(
      redisKeyForStream(refreshed.streamId),
      socketId,
      JSON.stringify(refreshed),
    );
  } catch (error) {
    warnRedisFallback(error);
  }

  return refreshed;
};

export const removeViewer = async (socketId) => {
  const memoryData = memoryStore.get(socketId) ?? null;
  memoryStore.delete(socketId);

  const redis = getRedisDataClient();
  if (!redis) return memoryData;

  try {
    const streamId = await redis.get(redisKeyForSocket(socketId));
    if (!streamId) return memoryData;

    const raw = await redis.hget(redisKeyForStream(streamId), socketId);
    await redis
      .multi()
      .hdel(redisKeyForStream(streamId), socketId)
      .del(redisKeyForSocket(socketId))
      .exec();

    return raw ? JSON.parse(raw) : memoryData;
  } catch (error) {
    warnRedisFallback(error);
    return memoryData;
  }
};

export const getViewersForStream = async (streamId) => {
  const merged = new Map();
  const staleBefore = Date.now() - VIEWER_STALE_AFTER_MS;

  for (const [socketId, viewer] of memoryStore.entries()) {
    if ((viewer.lastSeen || 0) < staleBefore) {
      memoryStore.delete(socketId);
      continue;
    }
    if (viewer.streamId === streamId) merged.set(socketId, viewer);
  }

  const redis = getRedisDataClient();
  if (redis) {
    try {
      const remote = await redis.hgetall(redisKeyForStream(streamId));
      const staleSocketIds = [];

      for (const [socketId, raw] of Object.entries(remote)) {
        try {
          const viewer = JSON.parse(raw);
          if ((viewer?.lastSeen || 0) < staleBefore) {
            staleSocketIds.push(socketId);
            continue;
          }
          if (viewer?.streamId === streamId) merged.set(socketId, viewer);
        } catch {
          staleSocketIds.push(socketId);
        }
      }

      if (staleSocketIds.length > 0) {
        const transaction = redis.multi();
        staleSocketIds.forEach((socketId) => {
          transaction.hdel(redisKeyForStream(streamId), socketId);
          transaction.del(redisKeyForSocket(socketId));
        });
        await transaction.exec();
      }
    } catch (error) {
      warnRedisFallback(error);
    }
  }

  // Count one authenticated account once even when the same account has
  // several tabs open. Anonymous viewers remain connection-based because they
  // do not have a stable account id.
  const unique = new Map();
  for (const [socketId, viewer] of merged.entries()) {
    const identity = String(viewer.userId || "").startsWith("anonymous:")
      ? `socket:${socketId}`
      : `user:${viewer.userId}`;
    if (!unique.has(identity)) unique.set(identity, viewer);
  }

  return [...unique.values()].map(({ lastSeen, ...viewer }) => viewer);
};

export const clearViewersForStream = async (streamId) => {
  for (const [socketId, viewer] of memoryStore.entries()) {
    if (viewer.streamId === streamId) memoryStore.delete(socketId);
  }

  const redis = getRedisDataClient();
  if (!redis) return;

  try {
    const remote = await redis.hgetall(redisKeyForStream(streamId));
    const transaction = redis.multi().del(redisKeyForStream(streamId));
    Object.keys(remote).forEach((socketId) => {
      transaction.del(redisKeyForSocket(socketId));
    });
    await transaction.exec();
  } catch (error) {
    warnRedisFallback(error);
  }
};

export default {
  addViewer,
  refreshViewer,
  removeViewer,
  getViewersForStream,
  clearViewersForStream,
};
