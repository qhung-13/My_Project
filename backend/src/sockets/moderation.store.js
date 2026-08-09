import { getRedisDataClient } from "../config/redis.config.js";

const memoryBans = new Map(); // streamId -> Set<userId>
const memoryTimeouts = new Map(); // "userId:streamId" -> expiry timestamp

const banKey = (streamId) => `moderation:${streamId}:bans`;
const timeoutKey = (userId, streamId) =>
  `moderation:${streamId}:timeout:${userId}`;

let lastRedisWarningAt = 0;
const warnRedisFallback = (error) => {
  const now = Date.now();
  if (now - lastRedisWarningAt < 10_000) return;
  lastRedisWarningAt = now;
  console.warn(
    "Moderation store: Redis unavailable, using local fallback:",
    error?.message || error,
  );
};

const rememberBan = (userId, streamId) => {
  if (!memoryBans.has(streamId)) memoryBans.set(streamId, new Set());
  memoryBans.get(streamId).add(userId);
};

export const banUserInStore = async (userId, streamId) => {
  rememberBan(userId, streamId);
  const redis = getRedisDataClient();
  if (!redis) return;
  try {
    await redis.sadd(banKey(streamId), userId);
  } catch (error) {
    warnRedisFallback(error);
  }
};

export const unbanUserInStore = async (userId, streamId) => {
  memoryBans.get(streamId)?.delete(userId);
  const redis = getRedisDataClient();
  if (!redis) return;
  try {
    await redis.srem(banKey(streamId), userId);
  } catch (error) {
    warnRedisFallback(error);
  }
};

export const isUserBanned = async (userId, streamId) => {
  if (memoryBans.get(streamId)?.has(userId)) return true;
  const redis = getRedisDataClient();
  if (!redis) return false;
  try {
    return Boolean(await redis.sismember(banKey(streamId), userId));
  } catch (error) {
    warnRedisFallback(error);
    return false;
  }
};

export const timeoutUserInStore = async (userId, streamId, durationSeconds) => {
  const key = `${userId}:${streamId}`;
  memoryTimeouts.set(key, Date.now() + durationSeconds * 1000);
  const timer = setTimeout(
    () => memoryTimeouts.delete(key),
    durationSeconds * 1000,
  );
  timer.unref?.();

  const redis = getRedisDataClient();
  if (!redis) return;
  try {
    await redis.set(timeoutKey(userId, streamId), "1", "EX", durationSeconds);
  } catch (error) {
    warnRedisFallback(error);
  }
};

const getMemoryTimeoutRemaining = (userId, streamId) => {
  const key = `${userId}:${streamId}`;
  const expiry = memoryTimeouts.get(key);
  if (!expiry) return 0;
  const remaining = Math.ceil((expiry - Date.now()) / 1000);
  if (remaining <= 0) {
    memoryTimeouts.delete(key);
    return 0;
  }
  return remaining;
};

export const getTimeoutRemainingSeconds = async (userId, streamId) => {
  const localRemaining = getMemoryTimeoutRemaining(userId, streamId);
  if (localRemaining > 0) return localRemaining;

  const redis = getRedisDataClient();
  if (!redis) return 0;
  try {
    const ttl = await redis.ttl(timeoutKey(userId, streamId));
    return ttl > 0 ? ttl : 0;
  } catch (error) {
    warnRedisFallback(error);
    return 0;
  }
};

export const isUserTimedOut = async (userId, streamId) =>
  (await getTimeoutRemainingSeconds(userId, streamId)) > 0;
