import { test, describe } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const { default: socketAuth } = await import("../auth.socket.js");

const makeSocket = (cookieHeader) => ({
  handshake: { headers: { cookie: cookieHeader } },
  data: {},
});

describe("socketAuth", () => {
  test("resolves userId from a valid jwt cookie", (t, done) => {
    const token = jwt.sign({ userId: "user-1" }, process.env.JWT_SECRET);
    const socket = makeSocket(`jwt=${token}; other=1`);

    socketAuth(socket, () => {
      assert.equal(socket.data.userId, "user-1");
      assert.equal(socket.data.isAuthenticated, true);
      done();
    });
  });

  test("treats missing cookie as anonymous, still calls next()", (t, done) => {
    const socket = makeSocket(undefined);

    socketAuth(socket, () => {
      assert.equal(socket.data.userId, null);
      assert.equal(socket.data.isAuthenticated, false);
      done();
    });
  });

  test("treats an invalid/tampered token as anonymous instead of rejecting the connection", (t, done) => {
    const socket = makeSocket("jwt=not-a-real-token");

    socketAuth(socket, () => {
      assert.equal(socket.data.userId, null);
      assert.equal(socket.data.isAuthenticated, false);
      done();
    });
  });

  test("SECURITY: a forged userId cannot be injected via a tampered cookie value", (t, done) => {
    // Sign with the WRONG secret, simulating an attacker who doesn't know
    // JWT_SECRET trying to claim to be a different user.
    const forged = jwt.sign({ userId: "victim-id" }, "wrong-secret");
    const socket = makeSocket(`jwt=${forged}`);

    socketAuth(socket, () => {
      // Must NOT resolve to "victim-id" — verification should fail and
      // fall back to anonymous.
      assert.notEqual(socket.data.userId, "victim-id");
      assert.equal(socket.data.isAuthenticated, false);
      done();
    });
  });
});
