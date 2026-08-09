import buildHlsUrl from "./hlsUrl.js";

import { isStreamHeartbeatFresh } from "./streamLiveness.js";

/**
 * Chuyển Stream document thành dữ liệu an toàn
 * để trả cho frontend/browser.
 *
 * Không bao giờ expose:
 * - streamKey
 * - playbackId
 * - lastMediaHeartbeatAt
 */
export const serializePublicStream = (stream) => {
  if (!stream) {
    return null;
  }

  const object = stream.toObject ? stream.toObject() : { ...stream };

  const publicStream = {
    ...object,
  };

  const playbackId = publicStream.playbackId;

  const effectiveIsLive =
    Boolean(publicStream.isLive) &&
    isStreamHeartbeatFresh(publicStream.lastMediaHeartbeatAt);
  delete publicStream.streamKey;
  delete publicStream.playbackId;
  delete publicStream.lastMediaHeartbeatAt;

  return {
    ...publicStream,
    hlsUrl: effectiveIsLive && playbackId ? buildHlsUrl(playbackId) : null,
  };
};

export default serializePublicStream;
