const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { setupSignaling } = require("./signaling");
const { PORT } = require("./config");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Setup signaling logic
setupSignaling(io);

server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
