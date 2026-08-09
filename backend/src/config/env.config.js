const REQUIRED_ENV_VARS = [
  "MONGO_URI",
  "JWT_SECRET",
  "MEDIA_SERVICE_SECRET",
  "MEDIA_PUBLISH_AUTH_SECRET",
];

export const assertRequiredEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }
  if (process.env.MEDIA_SERVICE_SECRET?.length < 32) {
    throw new Error("MEDIA_SERVICE_SECRET must contain at least 32 characters");
  }
  if (process.env.MEDIA_PUBLISH_AUTH_SECRET?.length < 32) {
    throw new Error(
      "MEDIA_PUBLISH_AUTH_SECRET must contain at least 32 characters",
    );
  }
  if (
    process.env.AGENT_SERVICE_SECRET &&
    process.env.AGENT_SERVICE_SECRET.length < 32
  ) {
    throw new Error("AGENT_SERVICE_SECRET must contain at least 32 characters");
  }
};

export const getAllowedOrigins = () => {
  const configured = process.env.CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return configured?.length
    ? configured
    : ["http://localhost:5173", "http://localhost"];
};
