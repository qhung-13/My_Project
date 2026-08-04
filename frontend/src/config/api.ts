/**
 * Single source of truth for the API base URL.
 *
 * Previously `import.meta.env.VITE_API_URL || "http://localhost:5000/api"`
 * was copy-pasted into every RTK Query api slice (userApi, videoApi,
 * streamApi, ...) plus axios.ts — 8 copies of the same fallback string.
 * Bumping the API version (see backend's /api/v1 change) meant editing all
 * 8. Now there's one constant to update.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
