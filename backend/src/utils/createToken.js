import jwt from "jsonwebtoken";

const parseBooleanEnv = (value) => {
  if (value === undefined) return null;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return null;
};

export const getAuthCookieOptions = () => {
  const configuredSecure = parseBooleanEnv(process.env.COOKIE_SECURE);
  // Secure-by-default on HTTPS/production. Local Docker explicitly sets
  // COOKIE_SECURE=false because it is normally accessed over plain HTTP.
  const publicBackendIsHttps = /^https:\/\//i.test(
    process.env.BACKEND_PUBLIC_URL || "",
  );
  const secure =
    configuredSecure ??
    (process.env.NODE_ENV === "production" || publicBackendIsHttps);

  return {
    httpOnly: true,
    secure,
    // Cross-site production deployments (e.g. Vercel frontend + Render API)
    // need SameSite=None, which browsers only accept together with Secure.
    // Local HTTP development/Docker uses Lax instead.
    sameSite: secure ? "none" : "lax",
    path: "/",
  };
};

export const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });

const createToken = (res, userId) => {
  const token = generateToken(userId);
  res.cookie("jwt", token, {
    ...getAuthCookieOptions(),
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return token;
};

export default createToken;
