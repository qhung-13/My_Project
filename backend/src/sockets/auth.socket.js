import jwt from "jsonwebtoken";
import cookie from "cookie";
import User from "../models/User.model.js";

const socketAuth = async (socket, next) => {
  socket.data.userId = null;
  socket.data.username = null;
  socket.data.avatar = null;
  socket.data.isAuthenticated = false;

  try {
    const rawCookie = socket.handshake.headers.cookie;
    const token = rawCookie ? cookie.parse(rawCookie).jwt : null;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select(
      "username displayName avatar isActive",
    );
    if (user?.isActive) {
      socket.data.userId = user._id.toString();
      socket.data.username = user.displayName || user.username;
      socket.data.avatar = user.avatar || null;
      socket.data.isAuthenticated = true;
    }
    next();
  } catch {
    // Invalid/expired cookies are treated as anonymous; watching remains public.
    next();
  }
};

export default socketAuth;
