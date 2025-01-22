import io from "socket.io-client";

const socket = io("http://localhost:4000");
const peerConnections = {};
const dataChannels = {};
const receivedChunks = {};
const chunkSize = 64 * 1024; // 64 KB

// Create a new WebRTC connection
export const createPeerConnection = (peerId, onChunkReceived) => {
  const peerConnection = new RTCPeerConnection();
  const dataChannel = peerConnection.createDataChannel("fileTransfer");

  // Handle incoming chunks
  dataChannel.onmessage = (event) => {
    const { chunkIndex, data } = JSON.parse(event.data);
    if (!receivedChunks[chunkIndex]) receivedChunks[chunkIndex] = [];
    receivedChunks[chunkIndex].push(data);
    onChunkReceived(chunkIndex, data);
  };

  peerConnections[peerId] = peerConnection;
  dataChannels[peerId] = dataChannel;

  return peerConnection;
};

// Send a chunk to a peer
export const sendChunk = (peerId, chunkIndex, chunkData) => {
  const dataChannel = dataChannels[peerId];
  dataChannel.send(JSON.stringify({ chunkIndex, data: chunkData }));
};

// Handle offer/answer exchange via signaling server
socket.on("signal", ({ peerId, signal }) => {
  const peerConnection = peerConnections[peerId];
  peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
  if (signal.type === "offer") {
    peerConnection
      .createAnswer()
      .then((answer) => peerConnection.setLocalDescription(answer))
      .then(() => {
        socket.emit("signal", {
          peerId,
          signal: peerConnection.localDescription,
        });
      });
  }
});
