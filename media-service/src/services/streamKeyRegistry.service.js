import User from "../model/User.model.js";

const validKeys = new Map();
const REFRESH_INTERVAL_MS = Number(
  process.env.STREAM_KEY_REFRESH_INTERVAL_MS || 5_000,
);

let refreshTimer = null;
let changeStream = null;
let refreshInFlight = null;

export const refreshStreamKeyRegistry = async () => {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const users = await User.find({
      isActive: true,
      streamKey: { $type: "string", $ne: "" },
    })
      .select("streamKey username")
      .lean();

    validKeys.clear();
    for (const user of users) {
      if (!user.streamKey) continue;
      validKeys.set(user.streamKey, {
        userId: user._id.toString(),
        username: user.username || user._id.toString(),
      });
    }
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
};

export const getStreamKeyOwner = (streamKey) => validKeys.get(streamKey) || null;

export const startStreamKeyRegistry = async () => {
  await refreshStreamKeyRegistry();

  refreshTimer = setInterval(() => {
    void refreshStreamKeyRegistry().catch((error) => {
      console.error(
        "[media-service] Failed to refresh stream-key registry:",
        error.message,
      );
    });
  }, REFRESH_INTERVAL_MS);
  refreshTimer.unref?.();

  // Change streams make key rotation/ban propagation nearly immediate when
  // MongoDB is a replica set (Atlas / the provided docker-compose setup).
  // Polling above remains the fallback for standalone MongoDB deployments.
  try {
    changeStream = User.watch([], { fullDocument: "updateLookup" });
    changeStream.on("change", () => {
      void refreshStreamKeyRegistry().catch((error) =>
        console.error(
          "[media-service] Failed to refresh stream keys after DB change:",
          error.message,
        ),
      );
    });
    changeStream.on("error", (error) => {
      console.warn(
        "[media-service] Mongo change stream unavailable; polling stream keys instead:",
        error.message,
      );
      void changeStream?.close?.().catch(() => {});
      changeStream = null;
    });
  } catch (error) {
    console.warn(
      "[media-service] Could not start Mongo change stream; polling stream keys instead:",
      error.message,
    );
  }
};

export const stopStreamKeyRegistry = async () => {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = null;
  if (changeStream) await changeStream.close().catch(() => {});
  changeStream = null;
  validKeys.clear();
};

export default {
  getStreamKeyOwner,
  refreshStreamKeyRegistry,
  startStreamKeyRegistry,
  stopStreamKeyRegistry,
};
