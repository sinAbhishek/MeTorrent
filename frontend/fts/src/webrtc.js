import io from "socket.io-client";
import socket from "./socket";
const socket = io("http://localhost:4000");
const peerConnections = {};
const dataChannels = {};
const receivedChunks = {};
const chunkSize = 64 * 1024; // 64 KB

export const createPeerConnection = (peerId) => {
  const peerConnection = new RTCPeerConnection();

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", { peerId, candidate: event.candidate });
    }
  };

  socket.on("ice-candidate", ({ candidate }) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  });

  return peerConnection;
};

export const requestChunk = async (peerId, chunkIndex) => {
  return new Promise((resolve) => {
    const peerConnection = createPeerConnection(peerId);

    peerConnection.ondatachannel = (event) => {
      const receiveChannel = event.channel;
      receiveChannel.onmessage = (e) => {
        resolve(e.data); // Resolve with the received chunk
      };
    };

    const dataChannel = peerConnection.createDataChannel("chunk-request");
    dataChannel.send(JSON.stringify({ chunkIndex }));
  });
};
