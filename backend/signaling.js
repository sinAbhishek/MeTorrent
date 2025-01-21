const {
  addChunks,
  getPeersForChunk,
  removePeerChunks,
} = require("./chunkRegistry");

function setupSignaling(io) {
  const peers = {}; // { peerId: socket }

  io.on("connection", (socket) => {
    const peerId = socket.id;
    console.log(`Peer connected: ${peerId}`);
    peers[peerId] = socket;

    // Register chunks for a file
    socket.on("register-chunks", ({ fileId, chunks }) => {
      addChunks(peerId, fileId, chunks);
      console.log(`Chunks registered by ${peerId}:`, { fileId, chunks });
    });

    // Request peers for a chunk
    socket.on("request-chunk", ({ fileId, chunkIndex }, callback) => {
      const peersWithChunk = getPeersForChunk(fileId, chunkIndex);
      callback(peersWithChunk);
    });

    // Handle peer disconnection
    socket.on("disconnect", () => {
      console.log(`Peer disconnected: ${peerId}`);
      removePeerChunks(peerId);
      delete peers[peerId];
    });
  });
}

module.exports = { setupSignaling };
