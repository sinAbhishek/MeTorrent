const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { setupSignaling } = require("./signaling");

const PORT = 4000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

// Setup signaling logic
setupSignaling(io);

server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
