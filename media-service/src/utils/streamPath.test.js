import test from "node:test";
import assert from "node:assert/strict";
import { extractStreamKey, isValidStreamPath } from "./streamPath.js";

const validKey = "abcDEF1234567890-key";

test("extractStreamKey accepts the expected RTMP publish path", () => {
  assert.equal(extractStreamKey(`/live/${validKey}`), validKey);
  assert.equal(isValidStreamPath(`/live/${validKey}`), true);
});

test("extractStreamKey rejects paths outside the live application", () => {
  assert.equal(extractStreamKey(`/private/${validKey}`), null);
  assert.equal(extractStreamKey(`/${validKey}`), null);
});

test("extractStreamKey rejects traversal, nested paths, and query strings", () => {
  assert.equal(extractStreamKey(`/live/../../${validKey}`), null);
  assert.equal(extractStreamKey(`/live/${validKey}/extra`), null);
  assert.equal(extractStreamKey(`/live/${validKey}?token=leak`), null);
});

test("extractStreamKey rejects malformed or missing values", () => {
  assert.equal(extractStreamKey("/live/short"), null);
  assert.equal(extractStreamKey("/live/key_with_underscore_123"), null);
  assert.equal(extractStreamKey(null), null);
});
