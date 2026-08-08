import { getRedisDataClient } from "../config/redis.config.js";

/**
 * Moderation state: who is banned/timed-out, per stream.
 *
 * SCALING BUG this fixes: this used to be two plain in-memory `Map`s in
 * ModerationController.controller.js. `POST /api/moderation/ban` (REST,
 * hits whichever backend instance the load balancer picks) and
 * `isUserBanned()` (called from chat.socket.js, on whichever instance the
 * viewer's socket happens to be connected to) would only agree with each
 * other if both requests happened to land on the *same* instance. On a
 * horizontally scaled deployment, a streamer could ban someone and that
 * person could keep chatting simply because their socket lives on a
 * different instance than the one that processed the ban.
 *
 * Same fallback strategy as presence.store.js: Redis when REDIS_URL is
 * set, in-memory Map otherwise (fine for local/single-instance dev).
 */
const memoryBans = new Map(); // streamId -> Set<userId>
const memoryTimeouts = new Map(); // "userId:streamId" -> expiry timestamp

const banKey = (streamId) => `moderation:${streamId}:bans`;
const timeoutKey = (userId, streamId) =>
  `moderation:${streamId}:timeout:${userId}`;

export const banUserInStore = async (userId, streamId) => {
  const redis = getRedisDataClient();
  if (!redis) {
    if (!memoryBans.has(streamId)) memoryBans.set(streamId, new Set());
    memoryBans.get(streamId).add(userId);
    return;
  }
  await redis.sadd(banKey(streamId), userId);
};

export const unbanUserInStore = async (userId, streamId) => {
  const redis = getRedisDataClient();
  if (!redis) {
    memoryBans.get(streamId)?.delete(userId);
    return;
  }
  await redis.srem(banKey(streamId), userId);
};

export const isUserBanned = async (userId, streamId) => {
  const redis = getRedisDataClient();
  if (!redis) {
    return memoryBans.get(streamId)?.has(userId) || false;
  }
  return Boolean(await redis.sismember(banKey(streamId), userId));
};

export const timeoutUserInStore = async (userId, streamId, durationSeconds) => {
  const redis = getRedisDataClient();
  if (!redis) {
    const key = `${userId}:${streamId}`;
    memoryTimeouts.set(key, Date.now() + durationSeconds * 1000);
    setTimeout(() => memoryTimeouts.delete(key), durationSeconds * 1000);
    return;
  }
  // TTL key: existence == still timed out. No manual cleanup needed.
  await redis.set(timeoutKey(userId, streamId), "1", "EX", durationSeconds);
};

export const getTimeoutRemainingSeconds = async (userId, streamId) => {
  const redis = getRedisDataClient();
  if (!redis) {
    const key = `${userId}:${streamId}`;
    const expiry = memoryTimeouts.get(key);
    if (!expiry) return 0;
    const remaining = Math.ceil((expiry - Date.now()) / 1000);
    if (remaining <= 0) {
      memoryTimeouts.delete(key);
      return 0;
    }
    return remaining;
  }
  const ttl = await redis.ttl(timeoutKey(userId, streamId));
  return ttl > 0 ? ttl : 0;
};

export const isUserTimedOut = async (userId, streamId) => {
  const redis = getRedisDataClient();
  if (!redis) {
    const key = `${userId}:${streamId}`;
    const expiry = memoryTimeouts.get(key);
    if (!expiry) return false;
    if (Date.now() > expiry) {
      memoryTimeouts.delete(key);
      return false;
    }
    return true;
  }
  return Boolean(await redis.exists(timeoutKey(userId, streamId)));
};
