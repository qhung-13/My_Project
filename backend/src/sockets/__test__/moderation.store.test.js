import { test, describe } from "node:test";
import assert from "node:assert/strict";

// Import fresh with REDIS_URL guaranteed unset so this suite exercises the
// in-memory Map fallback path regardless of what other suites configure.
delete process.env.REDIS_URL;
const store = await import("../moderation.store.js");

describe("moderation.store (in-memory fallback, no REDIS_URL)", () => {
  test("a user is not banned by default", async () => {
    assert.equal(await store.isUserBanned("u1", "stream1"), false);
  });

  test("banUserInStore makes isUserBanned true for that stream only", async () => {
    await store.banUserInStore("u1", "stream1");
    assert.equal(await store.isUserBanned("u1", "stream1"), true);
    assert.equal(await store.isUserBanned("u1", "stream2"), false);
    assert.equal(await store.isUserBanned("u2", "stream1"), false);
  });

  test("unbanUserInStore reverses a ban", async () => {
    await store.banUserInStore("u3", "stream1");
    assert.equal(await store.isUserBanned("u3", "stream1"), true);
    await store.unbanUserInStore("u3", "stream1");
    assert.equal(await store.isUserBanned("u3", "stream1"), false);
  });

  test("a user is not timed out by default", async () => {
    assert.equal(await store.isUserTimedOut("u4", "stream1"), false);
  });

  test("timeoutUserInStore makes isUserTimedOut true until it expires", async () => {
    await store.timeoutUserInStore("u5", "stream1", 1); // 1 second
    assert.equal(await store.isUserTimedOut("u5", "stream1"), true);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    assert.equal(await store.isUserTimedOut("u5", "stream1"), false);
  });
});
