import chokidar from "chokidar";
import { readFile } from "fs/promises";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

/**
 * HLS → object storage/CDN sync.
 *
 * Why this exists: node-media-server + ffmpeg write `.m3u8` playlists and
 * `.ts` segments to local disk (`media/live/<streamKey>/...`). Serving
 * that directly from this process (as the original code did via
 * `express.static`) means:
 *   - every viewer's player has to hit this exact instance/host, so this
 *     service can't be scaled horizontally or put behind a normal CDN
 *   - no edge caching close to viewers, so playback latency/bandwidth cost
 *     scales linearly with viewer count on a single box
 *
 * This module watches the output directory and uploads each new/updated
 * file to an S3-compatible bucket (AWS S3, Cloudflare R2, Backblaze B2,
 * DigitalOcean Spaces, MinIO, ...). Put a CDN in front of that bucket and
 * set CDN_BASE_URL on the API service (see backend/src/utils/hlsUrl.js) to
 * point players at it.
 *
 * If S3_BUCKET isn't configured, this is a no-op and the service falls
 * back to serving the local `media/live` folder directly (see index.js) —
 * fine for local development or small single-instance deployments.
 */

let watcher = null;
let s3Client = null;

export const isCdnUploadEnabled = () => Boolean(process.env.S3_BUCKET);

const getClient = () => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
      credentials: process.env.S3_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          }
        : undefined,
    });
  }

  return s3Client;
};

const contentTypeFor = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".m3u8") {
    return "application/vnd.apple.mpegurl";
  }
  if (ext === ".ts") {
    return "video/MP2T";
  }
  return "application/octet-stream";
};

const uploadFile = async (localPath, mediaRoot) => {
  try {
    const body = await readFile(localPath);
    // Mirror the local path under mediaRoot as the S3 key, so
    // `<bucket>/<streamKey>/index.m3u8` matches what buildHlsUrl() expects.
    const key = path.relative(mediaRoot, localPath).split(path.sep).join("/");

    await getClient().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentTypeFor(localPath),
        // Playlist change constantly and must never be cached at the edge
        // segments are immutable once written (delete_segments in ffmpeg
        // just rotates the filename set, it doesn't overwrite in place)
        CacheControl:
          path.extname(localPath) === ".m3u8"
            ? "no-cache, no-store, must-revalidate"
            : "public, max-age=31536000, immutable",
      }),
    );
  } catch (error) {
    console.error(
      `[hlsUploader] Failed to upload ${localPath}:`,
      error.message,
    );
  }
};

const deleteFile = async (localPath, mediaRoot) => {
  try {
    const key = path.relative(mediaRoot, localPath).split(path.sep).join("/");
    await getClient().send(
      new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
    );
  } catch (error) {
    console.error(
      `[hlsUploader] Failed to delete ${localPath}:`,
      error.message,
    );
  }
};

/**
 * Starts watching `mediaRoot` (e.g. `./media/live`) and syncing changes to
 * S3. Safe to call even when uploads are disabled — it just does nothing.
 */
export const startHlsUploader = (mediaRoot) => {
  if (!isCdnUploadEnabled()) {
    console.log(
      "[hlsUploader] S3_BUCKET not set — CDN sync disabled, serving HLS locally only.",
    );
    return;
  }

  watcher = chokidar.watch(mediaRoot, {
    ignoreInitial: false,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 },
  });

  watcher
    .on("add", (filePath) => uploadFile(filePath, mediaRoot))
    .on("change", (filePath) => uploadFile(filePath, mediaRoot))
    .on("unlink", (filePath) => deleteFile(filePath, mediaRoot));

  console.log(
    `[hlsUploader] Watching ${mediaRoot} → syncing to s3://${process.env.S3_BUCKET}`,
  );
};

export const stopHlsUploader = async () => {
  if (watcher) await watcher.close();
};

