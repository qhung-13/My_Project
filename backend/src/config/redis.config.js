import Redis from "ioredis";

/**
 * Redis is optional for local development (a single backend instance works
 * fine with the in-memory fallback in presence.store.js), but REQUIRED as
 * soon as you run more than one backend instance behind a load balancer —
 * otherwise Socket.IO broadcasts and viewer counts only reach/see clients
 * connected to the same instance.
 *
 * Set REDIS_URL (e.g. redis://localhost:6379) to enable it.
 */
let pubClient = null;
let subClient = null;

export const isRedisEnabled = () => Boolean(process.env.REDIS_URL);

/**
 * Returns a singleton pair of Redis connections suitable for the
 * Socket.IO Redis adapter (it requires two separate connections: one for
 * publishing, one dedicated to subscribing).
 * Returns `null` if REDIS_URL isn't configured.
 */
const retryStrategy = (times) => Math.min(times * 200, 5000);

export const getRedisClients = () => {
  if (!isRedisEnabled()) return null;
  if (!pubClient) {
    pubClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null, 
      retryStrategy,
    });
    subClient = pubClient.duplicate();
    pubClient.on("error", (err) =>
      console.error("Redis (pub) error:", err.message),
    );
    subClient.on("error", (err) =>
      console.error("Redis (sub) error:", err.message),
    );
  }
  return { pubClient, subClient };
};

/**
 * A plain Redis client for general key/value use (presence store, etc.).
 * Separate from the pub/sub pair above since those are dedicated to the
 * Socket.IO adapter and shouldn't run arbitrary commands.
 */
let dataClient = null;
export const getRedisDataClient = () => {
  if (!isRedisEnabled()) return null;
  if (!dataClient) {
    dataClient = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 3 });
    dataClient.on("error", (err) => console.error("Redis (data) error:", err));
  }
  return dataClient;
};

export default getRedisClients;
