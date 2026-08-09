import Stream from "../models/Stream.model.js";
import User from "../models/User.model.js";

import { clearViewersForStream } from "../sockets/presence.store.js";

import {
  getFreshLiveQuery,
  getLiveHeartbeatCutoff,
  LIVE_STALE_SWEEP_INTERVAL_MS,
} from "../utils/streamLiveness.js";

const startStreamLivenessMonitor = (io) => {
  let sweepRunning = false;

  const sweep = async () => {
    if (sweepRunning) return;

    sweepRunning = true;

    try {
      const cutoff = getLiveHeartbeatCutoff();

      const staleCondition = {
        isLive: true,

        $or: [
          {
            lastMediaHeartbeatAt: null,
          },
          {
            lastMediaHeartbeatAt: {
              $lt: cutoff,
            },
          },
        ],
      };

      const staleStreams =
        await Stream.find(staleCondition).select("_id userId");

      for (const stream of staleStreams) {
        const result = await Stream.updateOne(
          {
            _id: stream._id,
            ...staleCondition,
          },
          {
            $set: {
              isLive: false,
              viewers: 0,
              endedAt: new Date(),
              lastMediaHeartbeatAt: null,
            },
          },
        );

        if (result.modifiedCount === 0) {
          continue;
        }

        await clearViewersForStream(stream._id.toString());

        const hasAnotherLiveStream = await Stream.exists({
          userId: stream.userId,
          ...getFreshLiveQuery(),
        });

        if (!hasAnotherLiveStream) {
          await User.findByIdAndUpdate(stream.userId, {
            isLive: false,
          });
        }

        io?.to(`stream:${stream._id}`).emit("viewer-count", 0);

        io?.to(`stream:${stream._id}`).emit("viewer-list", []);

        io?.to(`stream:${stream._id}`).emit("stream-ended", {
          streamId: stream._id,
          reason: "media-heartbeat-timeout",
        });

        io?.emit("stream-stopped", {
          streamId: stream._id,
          userId: stream.userId,
        });

        console.warn(`[stream-liveness] Expired stale stream ${stream._id}`);
      }
    } catch (error) {
      console.error("[stream-liveness] Sweep failed:", error);
    } finally {
      sweepRunning = false;
    }
  };

  const timer = setInterval(() => {
    void sweep();
  }, LIVE_STALE_SWEEP_INTERVAL_MS);

  timer.unref?.();

  return () => {
    clearInterval(timer);
  };
};

export { startStreamLivenessMonitor };

export default startStreamLivenessMonitor;
