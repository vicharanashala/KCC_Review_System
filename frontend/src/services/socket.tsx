import { io } from "socket.io-client";

const backendUrl =import.meta.env.VITE_API_BASE_URL.replace("/api", "")||"http://localhost:8000"
  //import.meta.env.MODE === "production"
   // ? import.meta.env.VITE_API_BASE_URL.replace("/api", "") // remove `/api` if present
   // : "http://localhost:8000";

export const socket = io(backendUrl, {
  path: "/socket.io",
  transports: ["websocket"],
  withCredentials: true,
});

socket.on('connect', () => {
  console.log(' Connected to Socket.IO server', socket.id);

  // Register user in their private room
  const userId = localStorage.getItem('user_id');
  if (userId) {
    socket.emit('register', userId);
    console.log(' Register event sent with userId:', userId);
  }
});

socket.on('disconnect', () => {
  console.log(' Disconnected from Socket.IO server');
});