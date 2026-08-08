/**
 * Builds the public playback URL (HLS master manifest) for a given stream
 * key.
 *
 * Previously the frontend hardcoded `http://localhost:5000/live/...` itself
 * (see VideoPlayer.tsx before this change), which only worked for local dev
 * and baked the backend host into the client bundle.
 *
 * Now the backend computes and returns the URL, so it becomes a config
 * concern instead of a code concern:
 *  - CDN_BASE_URL set  -> stream is being pushed to object storage/CDN by
 *    the media-service (see media-service/src/services/hlsUploader.service.js)
 *    and served from there.
 *  - CDN_BASE_URL unset -> fall back to MEDIA_SERVICE_URL, the media
 *    service's own HTTP server (useful for local dev / self-hosted setups
 *    without a CDN).
 */
export const buildHlsUrl = (streamKey) => {
  if (!streamKey) return null;

  const base = (
    process.env.CDN_BASE_URL ||
    process.env.MEDIA_SERVICE_URL ||
    "http://localhost:8080/live"
  ).replace(/\/+$/, "");

  return `${base}/${streamKey}/index.m3u8`;
};

export default buildHlsUrl;
