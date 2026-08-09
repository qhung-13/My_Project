/**
 * Reserve one RTMP publish path for exactly one NodeMediaServer session.
 *
 * The explicit session identity check matters because NMS emits postPublish
 * before its own duplicate-publisher assignment check. A duplicate session
 * must never be able to reuse or release the first publisher's reservation.
 */
export const tryReservePublisher = (reservations, streamPath, session) => {
  if (!streamPath || !session || reservations.has(streamPath)) return false;
  reservations.set(streamPath, session);
  return true;
};

export const releasePublisherReservation = (
  reservations,
  streamPath,
  session,
) => {
  if (reservations.get(streamPath) !== session) return false;
  reservations.delete(streamPath);
  return true;
};
