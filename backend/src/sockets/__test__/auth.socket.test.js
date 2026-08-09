import { test, describe } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import User from "../../models/User.model.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const { default: socketAuth } = await import("../auth.socket.js");

const makeSocket = (cookieHeader) => ({
  handshake: { headers: { cookie: cookieHeader } },
  data: {},
});

describe("socketAuth", () => {
  test("resolves an active user from a valid jwt cookie", (t, done) => {
    t.mock.method(User, "findById", () => ({
      select: async () => ({
        _id: { toString: () => "user-1" },
        username: "viewer",
        displayName: "Viewer",
        avatar: null,
        isActive: true,
      }),
    }));
    const token = jwt.sign({ userId: "user-1" }, process.env.JWT_SECRET);
    const socket = makeSocket(`jwt=${token}; other=1`);

    socketAuth(socket, () => {
      assert.equal(socket.data.userId, "user-1");
      assert.equal(socket.data.isAuthenticated, true);
      done();
    });
  });

  test("rejects a valid JWT for a globally disabled account", (t, done) => {
    t.mock.method(User, "findById", () => ({
      select: async () => ({
        _id: { toString: () => "user-1" },
        username: "banned-viewer",
        displayName: "Banned Viewer",
        avatar: null,
        isActive: false,
      }),
    }));
    const token = jwt.sign({ userId: "user-1" }, process.env.JWT_SECRET);
    const socket = makeSocket(`jwt=${token}`);

    socketAuth(socket, (error) => {
      assert.ok(error);
      assert.equal(error.message, "ACCOUNT_DISABLED");
      assert.equal(error.data?.code, "ACCOUNT_DISABLED");
      assert.equal(socket.data.isAuthenticated, false);
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
