import { Server } from "socket.io";
import http from "http";

const server = http.createServer();
const io = new Server(server, {
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

  // Relay WebRTC offer
  socket.on("secureDrop:offer", ({ fromUserId, toUserId, sdp }) => {
    console.log(`UserA: ${fromUserId} Initiated a Secure Drop with UserB: ${toUserId}`);
    const target = userToSocket.get(toUserId);
    if (target) io.to(target).emit("secureDrop:offer", { fromUserId, sdp });
  });

  // Relay WebRTC answer
  socket.on("secureDrop:answer", ({ fromUserId, toUserId, sdp }) => {
    const target = userToSocket.get(toUserId);
    if (target) io.to(target).emit("secureDrop:answer", { fromUserId, sdp });
  });

  // Relay ICE candidates
  socket.on("secureDrop:candidate", ({ fromUserId, toUserId, candidate }) => {
    const target = userToSocket.get(toUserId);
    if (target) io.to(target).emit("secureDrop:candidate", { fromUserId, candidate });
  });

  // End session
  socket.on("secureDrop:end", ({ fromUserId, toUserId }) => {
    const target = userToSocket.get(toUserId);
    if (target) io.to(target).emit("secureDrop:end", { fromUserId });
  });

  //Decline Session
  socket.on("secureDrop:decline", ({ fromUserId, toUserId }) => {
    const target = userToSocket.get(toUserId);
    if (target) io.to(target).emit("secureDrop:decline", { fromUserId });
  });
});


server.listen(4000, () => {
  console.log("Socket server running on :4000");
});
