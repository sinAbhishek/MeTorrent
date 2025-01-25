const {
  addChunks,
  getPeersForChunk,
  removePeerChunks,
  sendindices,
  chunkRegistry,
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
    socket.on("get-peers-for-chunks", (fileId, chunkIndices) => {
      console.log(fileId, chunkIndices);
      console.log("chunkreg", chunkRegistry);
      const peerList = chunkIndices.map((chunkIndex) => {
        return (
          (chunkRegistry[fileId] && chunkRegistry[fileId][chunkIndex]) || []
        );
      });
      console.log(peerList);
      socket.emit("peer-list-for-chunks", peerList);
    });
    socket.on("send indices", (id) => {
      const indices = sendindices(id);
      socket.emit("getting indices", indices);
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
