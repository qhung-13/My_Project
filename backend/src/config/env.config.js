/**
 * Centralized environment configuration.
 *
 * Previously required vars (MONGO_URI, JWT_SECRET, Cloudinary keys, ...)
 * were only discovered to be missing when the relevant code path ran (e.g.
 * a 500 error the first time someone uploaded a video). Failing fast at
 * boot makes misconfiguration obvious in deployment logs instead of in
 * production traffic.
 */
const REQUIRED_ENV_VARS = [
  "MONGO_URI",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

export const assertRequiredEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
};

// CORS_ORIGINS="https://my-project-omega-roan.vercel.app,http://localhost:5173"
// Previously the allowed origins were hardcoded in index.js, which meant a
// new frontend domain (staging, a new deploy URL, a custom domain) required
// a code change + redeploy of the backend. Now it's an env var.
export const getAllowedOrigins = () => {
  const fromEnv = process.env.CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return (
    fromEnv ?? [
      "https://my-project-omega-roan.vercel.app",
      "http://localhost:5173",
      "http://localhost",
    ]
  );
};
