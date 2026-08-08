const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

/** Centralized, normalized base URL for every REST client. */
export const API_BASE_URL = (
  configuredApiUrl || "http://localhost:5000/api/v1"
).replace(/\/$/, "");

/** Public backend origin, used for browser redirects such as OAuth. */
export const API_ORIGIN = API_BASE_URL.replace(/\/api(?:\/v\d+)?$/, "");

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
