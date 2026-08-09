import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import serializePublicStream from "../streamPayload.js";

const originalMediaUrl = process.env.MEDIA_SERVICE_URL;

afterEach(() => {
  if (originalMediaUrl === undefined) delete process.env.MEDIA_SERVICE_URL;
  else process.env.MEDIA_SERVICE_URL = originalMediaUrl;
});

describe("serializePublicStream", () => {
  test("never exposes ingest credentials or raw playback ids", () => {
    process.env.MEDIA_SERVICE_URL = "http://localhost:8080/live";
    const payload = serializePublicStream({
      _id: "s1",
      title: "Live",
      isLive: true,
      streamKey: "secret-ingest-key",
      playbackId: "public-session-id-1234",
    });

    assert.equal("streamKey" in payload, false);
    assert.equal("playbackId" in payload, false);
    assert.equal(
      payload.hlsUrl,
      "http://localhost:8080/live/public-session-id-1234/index.m3u8",
    );
  });

  test("does not expose an HLS URL for an offline stream", () => {
    process.env.MEDIA_SERVICE_URL = "http://localhost:8080/live";
    const payload = serializePublicStream({
      _id: "s1",
      isLive: false,
      playbackId: "public-session-id-1234",
      streamKey: "secret-ingest-key",
    });

    assert.equal(payload.hlsUrl, null);
    assert.equal("streamKey" in payload, false);
    assert.equal("playbackId" in payload, false);
  });
});
