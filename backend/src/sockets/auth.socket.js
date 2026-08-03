import jwt from "jsonwebtoken";
import cookie from "cookie";

/**
 * Socket.IO middleware that tries to resolve the authenticated user from the
 * same httpOnly "jwt" cookie used by the REST API.
 *
 * Previously the client was free to send *any* `userId` in the
 * "chat-message" payload, which meant a banned/timed-out user could just
 * pick a different id and bypass moderation entirely. Here we attach the
 * verified id (if any) to `socket.data.userId` so handlers can trust it
 * instead of the client-supplied value.
 *
 * Anonymous viewers are still allowed to connect (read-only / anonymous
 * chat), we just don't let them impersonate someone else.
 */
const socketAuth = (socket, next) => {
  try {
    const rawCookie = socket.handshake.headers.cookie;
    const token = rawCookie ? cookie.parse(rawCookie).jwt : null;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = decoded.userId;
      socket.data.isAuthenticated = true;
    } else {
      socket.data.userId = null;
      socket.data.isAuthenticated = false;
    }

    next();
  } catch (error) {
    // Invalid/expired token -> treat as anonymous instead of hard-failing
    // the connection, so viewers can still watch without being logged in.
    socket.data.userId = null;
    socket.data.isAuthenticated = false;
    next();
  }
};

export default socketAuth;
