import type { StreamUser } from "../types/index";

export const isStreamUser = (
  value: StreamUser | string | null | undefined,
): value is StreamUser => typeof value === "object" && value !== null;

export const getStreamUser = (
  value: StreamUser | string | null | undefined,
): StreamUser | null => (isStreamUser(value) ? value : null);

export const getStreamUserName = (
  value: StreamUser | string | null | undefined,
  fallback = "Streamer",
) => {
  const user = getStreamUser(value);
  return user?.displayName || user?.username || fallback;
};
