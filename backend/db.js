const peers = {}; // { peerId: { socketId, metadata } }
const files = {}; // { fileHash: { fileName, fileChunks, peers: [peerId, ...] } }

module.exports = { peers, files };
