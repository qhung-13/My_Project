const parsePositiveNumber = (value, fallback) => {
  const number = Number(value);

  return Number.isFinite(number) && number > 0 ? number : fallback;
};

export const LIVE_HEARTBEAT_TIMEOUT_MS = parsePositiveNumber(
  process.env.LIVE_HEARTBEAT_TIMEOUT_MS,
  20_000,
);

export const LIVE_STALE_SWEEP_INTERVAL_MS = parsePositiveNumber(
  process.env.LIVE_STALE_SWEEP_INTERVAL_MS,
  10_000,
);

export const getLiveHeartbeatCutoff = () =>
  new Date(Date.now() - LIVE_HEARTBEAT_TIMEOUT_MS);

export const getFreshLiveQuery = () => ({
  isLive: true,
  lastMediaHeartbeatAt: {
    $gte: getLiveHeartbeatCutoff(),
  },
});

export const getStaleLiveQuery = (cutoff = getLiveHeartbeatCutoff()) => ({
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
});

export const isStreamHeartbeatFresh = (value) => {
  if (!value) return false;

  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return false;
  }

  return Date.now() - timestamp <= LIVE_HEARTBEAT_TIMEOUT_MS;
};
