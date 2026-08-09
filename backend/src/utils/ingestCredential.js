import { createHash } from "node:crypto";

const DEFAULT_TTL_SECONDS = 10 * 365 * 24 * 60 * 60;

const getPublishAuthSecret = () => {
  const secret = process.env.MEDIA_PUBLISH_AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("MEDIA_PUBLISH_AUTH_SECRET is not configured");
  }
  return secret;
};

export const buildObsStreamKey = (streamKey, nowSeconds = Math.floor(Date.now() / 1000)) => {
  if (!streamKey) return null;

  const configuredTtl = Number(process.env.INGEST_SIGNATURE_TTL_SECONDS);
  const ttlSeconds = Number.isFinite(configuredTtl) && configuredTtl > 0
    ? Math.floor(configuredTtl)
    : DEFAULT_TTL_SECONDS;
  const expiresAt = nowSeconds + ttlSeconds;
  const streamPath = `/live/${streamKey}`;
  const signature = createHash("md5")
    .update(`${streamPath}-${expiresAt}-${getPublishAuthSecret()}`)
    .digest("hex");

  return {
    streamKey: `${streamKey}?sign=${expiresAt}-${signature}`,
    expiresAt,
  };
};
