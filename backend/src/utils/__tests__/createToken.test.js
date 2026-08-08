import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const { default: createToken, generateToken } =
  await import("../createToken.js");

// Minimal fake Express response, just enough to observe res.cookie(...) calls
const createFakeRes = () => {
  const calls = [];
  return {
    cookie: (name, value, options) => calls.push({ name, value, options }),
    _calls: calls,
  };
};

describe("createToken", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });
  test("signs a JWT containing the userId", () => {
    const token = generateToken("user-123");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert.equal(decoded.userId, "user-123");
  });

  test("sets an httpOnly cookie named 'jwt'", () => {
    const res = createFakeRes();
    const token = createToken(res, "user-456");

    assert.equal(res._calls.length, 1);
    const cookieCall = res._calls[0];
    assert.equal(cookieCall.name, "jwt");
    assert.equal(cookieCall.value, token);
    assert.equal(cookieCall.options.httpOnly, true);
    // SECURITY: httpOnly means client-side JS (including an XSS payload)
    // can never read this cookie — this is what makes the cookie strategy
    // safer than the old localStorage-based OAuth token (see axios.ts).
  });

  test("uses cross-site secure cookie options in production", () => {
    process.env.NODE_ENV = "production";
    const res = createFakeRes();
    createToken(res, "user-789");
    assert.equal(res._calls[0].options.sameSite, "none");
    assert.equal(res._calls[0].options.secure, true);
  });

  test("uses localhost-friendly cookie options in development", () => {
    process.env.NODE_ENV = "development";
    const res = createFakeRes();
    createToken(res, "user-local");
    assert.equal(res._calls[0].options.sameSite, "lax");
    assert.equal(res._calls[0].options.secure, false);
  });
});
