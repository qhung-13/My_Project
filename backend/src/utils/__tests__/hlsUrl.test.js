import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import buildHlsUrl from "../hlsUrl.js";

describe("buildHlsUrl", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.CDN_BASE_URL;
    delete process.env.MEDIA_SERVICE_URL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("returns null when playbackId is missing", () => {
    assert.equal(buildHlsUrl(""), null);
    assert.equal(buildHlsUrl(undefined), null);
  });

  test("prefers CDN_BASE_URL when set", () => {
    process.env.CDN_BASE_URL = "https://cdn.example.com/hls";
    process.env.MEDIA_SERVICE_URL = "http://media-service:8000/live";
    assert.equal(
      buildHlsUrl("abc123"),
      "https://cdn.example.com/hls/abc123/index.m3u8",
    );
  });

  test("falls back to MEDIA_SERVICE_URL when no CDN configured", () => {
    process.env.MEDIA_SERVICE_URL = "http://media-service:8000/live";
    assert.equal(
      buildHlsUrl("abc123"),
      "http://media-service:8000/live/abc123/index.m3u8",
    );
  });

  test("falls back to localhost default when nothing configured", () => {
    assert.equal(
      buildHlsUrl("abc123"),
      "http://localhost:8080/live/abc123/index.m3u8",
    );
  });

  test("strips trailing slashes from the base URL", () => {
    process.env.CDN_BASE_URL = "https://cdn.example.com/hls///";
    assert.equal(
      buildHlsUrl("abc123"),
      "https://cdn.example.com/hls/abc123/index.m3u8",
    );
  });
});
