import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createHash } from "node:crypto";
import { buildObsStreamKey } from "../ingestCredential.js";

const ORIGINAL_SECRET = process.env.MEDIA_PUBLISH_AUTH_SECRET;
const ORIGINAL_TTL = process.env.INGEST_SIGNATURE_TTL_SECONDS;

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.MEDIA_PUBLISH_AUTH_SECRET;
  else process.env.MEDIA_PUBLISH_AUTH_SECRET = ORIGINAL_SECRET;
  if (ORIGINAL_TTL === undefined) delete process.env.INGEST_SIGNATURE_TTL_SECONDS;
  else process.env.INGEST_SIGNATURE_TTL_SECONDS = ORIGINAL_TTL;
});

describe("buildObsStreamKey", () => {
  it("builds the signature format expected by NodeMediaServer v4 publish auth", () => {
    process.env.MEDIA_PUBLISH_AUTH_SECRET = "a".repeat(32);
    process.env.INGEST_SIGNATURE_TTL_SECONDS = "60";
    const rawKey = "91c12427-f2ec-4ee4-bd20-d4c5398f427a";
    const result = buildObsStreamKey(rawKey, 1_700_000_000);
    const expiresAt = 1_700_000_060;
    const expected = createHash("md5")
      .update(`/live/${rawKey}-${expiresAt}-${"a".repeat(32)}`)
      .digest("hex");

    assert.deepEqual(result, {
      streamKey: `${rawKey}?sign=${expiresAt}-${expected}`,
      expiresAt,
    });
  });

  it("never returns a credential when the raw key is missing", () => {
    process.env.MEDIA_PUBLISH_AUTH_SECRET = "a".repeat(32);
    assert.equal(buildObsStreamKey(null), null);
  });
});
