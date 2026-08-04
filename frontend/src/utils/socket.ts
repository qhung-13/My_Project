import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/api";

const socketBaseUrl = new URL(API_BASE_URL).origin;

const socket = io(socketBaseUrl, {
  withCredentials: true,
  autoConnect: false, // Don't auto connect - just connect when need
});

export default socket;
