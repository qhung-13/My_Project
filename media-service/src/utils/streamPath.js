const STREAM_KEY_PATTERN = /^[a-zA-Z0-9-]{16,128}$/;

export const extractStreamKey = (streamPath) => {
  if (typeof streamPath !== "string") return null;
  const normalizedPath = streamPath.trim();
  if (!normalizedPath.startsWith("/live/") || normalizedPath.includes("?")) return null;

  const segments = normalizedPath.split("/").filter(Boolean);
  if (segments.length !== 2 || segments[0] !== "live") return null;

  return STREAM_KEY_PATTERN.test(segments[1]) ? segments[1] : null;
};

export const isValidStreamPath = (streamPath) => extractStreamKey(streamPath) !== null;
