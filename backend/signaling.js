const { peers } = require("./db");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`Peer connected: ${socket.id}`);

    // Peer joins with an ID
    socket.on("register-peer", ({ peerId, metadata }) => {
      peers[peerId] = { socketId: socket.id, metadata };
      console.log(`Peer registered: ${peerId}`);
    });

    // Handle signaling data (SDP or ICE candidates)
    socket.on("signal", ({ targetPeerId, signalData }) => {
      const targetPeer = peers[targetPeerId];
      if (targetPeer) {
        io.to(targetPeer.socketId).emit("signal", {
          senderPeerId: socket.id,
          signalData,
        });
      }
    });

    // Remove peer on disconnect
    socket.on("disconnect", () => {
      const peerId = Object.keys(peers).find(
        (id) => peers[id].socketId === socket.id
      );
      if (peerId) {
        delete peers[peerId];
        console.log(`Peer disconnected: ${peerId}`);
      }
    });
  });
};
