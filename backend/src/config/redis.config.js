import Redis from "ioredis";

/**
 * Redis is optional for single-instance local development, but required for
 * consistent Socket.IO broadcasts/presence when the backend is scaled out.
 *
 * The key design rule here is: a configured-but-down Redis must not turn a
 * healthy single backend into a retry storm. We probe before attaching the
 * Socket.IO adapter and use a short circuit breaker for the general data
 * client. During that backoff, presence.store.js transparently uses memory.
 */
let pubClient = null;
let subClient = null;
let dataClient = null;
let dataRedisBackoffUntil = 0;
let lastDataRedisWarningAt = 0;

const DATA_RETRY_AFTER_MS = 10_000;

export const isRedisEnabled = () => Boolean(process.env.REDIS_URL);

const logDataRedisWarning = (error) => {
  const now = Date.now();
  if (now - lastDataRedisWarningAt < DATA_RETRY_AFTER_MS) return;
  lastDataRedisWarningAt = now;
  console.warn(
    "Redis (data) unavailable; presence will use memory temporarily:",
    error?.message || error,
  );
};

/** Probe Redis without creating the long-lived adapter connections. */
export const probeRedis = async (timeoutMs = 1_500) => {
  if (!isRedisEnabled()) return false;

  const probe = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    connectTimeout: Math.min(timeoutMs, 1_500),
    maxRetriesPerRequest: 0,
    enableOfflineQueue: false,
    retryStrategy: () => null,
  });
  // The awaited connect/ping below owns the failure path; suppress the
  // EventEmitter's otherwise-unhandled error event.
  probe.on("error", () => {});

  let timer;
  try {
    await Promise.race([
      (async () => {
        await probe.connect();
        await probe.ping();
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Redis health check timed out")),
          timeoutMs,
        );
        timer.unref?.();
      }),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
    probe.disconnect(false);
  }
};

/** Long-lived pub/sub pair used only after a successful startup probe. */
export const getRedisClients = () => {
  if (!isRedisEnabled()) return null;
  if (!pubClient) {
    const retryStrategy = (times) => Math.min(times * 250, 5_000);
    pubClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy,
    });
    subClient = pubClient.duplicate();
    pubClient.on("error", (error) =>
      console.warn("Redis (pub) connection issue:", error.message),
    );
    subClient.on("error", (error) =>
      console.warn("Redis (sub) connection issue:", error.message),
    );
  }
  return { pubClient, subClient };
};

/**
 * General key/value client for presence/moderation. A failed command opens a
 * short circuit and disconnects this client. Calls during the circuit return
 * null, so stores can use their in-memory fallback without waiting on Redis.
 * After the backoff a fresh client is created automatically.
 */
export const getRedisDataClient = () => {
  if (!isRedisEnabled() || Date.now() < dataRedisBackoffUntil) return null;
  if (dataClient) return dataClient;

  const client = new Redis(process.env.REDIS_URL, {
    connectTimeout: 1_500,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy: (times) => (times <= 2 ? Math.min(times * 200, 500) : null),
  });

  const tripCircuit = (error) => {
    logDataRedisWarning(error);
    dataRedisBackoffUntil = Date.now() + DATA_RETRY_AFTER_MS;
    if (dataClient === client) dataClient = null;
    client.disconnect(false);
  };

  client.on("error", tripCircuit);
  dataClient = client;
  return dataClient;
};

export const closeRedisClients = async () => {
  const clients = [dataClient, pubClient, subClient].filter(Boolean);
  dataClient = null;
  pubClient = null;
  subClient = null;
  dataRedisBackoffUntil = 0;

  await Promise.allSettled(
    clients.map(async (client) => {
      try {
        await client.quit();
      } catch {
        client.disconnect(false);
      }
    }),
  );
};

export default getRedisClients;
