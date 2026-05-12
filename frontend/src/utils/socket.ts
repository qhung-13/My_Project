import { io } from "socket.io-client";

const socket = io(
  import.meta.env.VITE_API_URL?.replace("/api/", "") || "http://localhost:5000",
  {
    withCredentials: true,
    autoConnect: false, // Don't auto connect - just connect when need
  },
);

export default socket;
