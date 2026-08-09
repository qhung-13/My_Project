const getMediaControlBaseUrl = () => {
  if (process.env.MEDIA_CONTROL_URL) {
    return process.env.MEDIA_CONTROL_URL.replace(/\/+$/, "");
  }

  const publicHlsBase = process.env.MEDIA_SERVICE_URL || "http://localhost:8080/live";
  return publicHlsBase.replace(/\/live\/?$/, "").replace(/\/+$/, "");
};

export const terminateMediaStream = async (streamKey) => {
  if (!streamKey) return { terminated: false, reason: "missing-stream-key" };

  const secret = process.env.MEDIA_SERVICE_SECRET;
  if (!secret) {
    const error = new Error("Media service secret is not configured");
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(`${getMediaControlBaseUrl()}/internal/streams/terminate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-media-service-secret": secret,
    },
    body: JSON.stringify({ streamKey }),
    signal: AbortSignal.timeout(5_000),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      payload.message || `Media service returned HTTP ${response.status}`,
    );
    error.statusCode = 502;
    throw error;
  }

  return payload;
};

export default terminateMediaStream;
