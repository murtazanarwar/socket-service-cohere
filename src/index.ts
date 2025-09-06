import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();

// Health check route
app.get("/", (_, res) => {
  res.send("Cohere Socket server is running ✅");
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

const userToSocket = new Map<string, string>();
const socketToUser = new Map<string, string>();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (userId: string) => {
    userToSocket.set(userId, socket.id);
    socketToUser.set(socket.id, userId);
    console.log(`User registered: ${userId}`);
  });

  socket.on("disconnect", () => {
    const userId = socketToUser.get(socket.id);
    if (userId) {
      userToSocket.delete(userId);
      socketToUser.delete(socket.id);
      console.log(`User disconnected: ${userId}`);
    }
  });

  // --- Secure Drop Events ---
  socket.on("secureDrop:offer", ({ fromUserId, toUserId, sdp }) => {
    const target = userToSocket.get(toUserId);
    if (target) io.to(target).emit("secureDrop:offer", { fromUserId, sdp });
  });

  socket.on("secureDrop:answer", ({ fromUserId, toUserId, sdp }) => {
    const target = userToSocket.get(toUserId);
    if (target) io.to(target).emit("secureDrop:answer", { fromUserId, sdp });
  });

  socket.on("secureDrop:candidate", ({ fromUserId, toUserId, candidate }) => {
    const target = userToSocket.get(toUserId);
    if (target) io.to(target).emit("secureDrop:candidate", { fromUserId, candidate });
  });

  socket.on("secureDrop:end", ({ fromUserId, toUserId }) => {
    const target = userToSocket.get(toUserId);
    if (target) io.to(target).emit("secureDrop:end", { fromUserId });
  });

  socket.on("secureDrop:decline", ({ fromUserId, toUserId }) => {
    const target = userToSocket.get(toUserId);
    if (target) io.to(target).emit("secureDrop:decline", { fromUserId });
  });
});

// ⚡ Works both locally and on Render
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Socket server running on :${PORT}`);
});
