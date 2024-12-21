const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { peers, files } = require("./db");
const signaling = require("./signaling");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(express.json());

// Register signaling routes
signaling(io);

// File API
app.post("/api/files/register", (req, res) => {
  const { fileHash, fileName, fileChunks, peerId } = req.body;

  if (!fileHash || !fileName || !fileChunks || !peerId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!files[fileHash]) {
    files[fileHash] = { fileName, fileChunks, peers: [] };
  }
  if (!files[fileHash].peers.includes(peerId)) {
    files[fileHash].peers.push(peerId);
  }

  res.status(200).json({ message: "File registered successfully" });
});
app.get("/api/files/:fileHash/peers", (req, res) => {
  const { fileHash } = req.params;

  if (!files[fileHash]) {
    return res.status(404).json({ error: "File not found" });
  }

  res.status(200).json({ peers: files[fileHash].peers });
});

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
