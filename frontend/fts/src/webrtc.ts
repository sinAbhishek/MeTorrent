import io from "socket.io-client";
import socket from "./socket";
//incomplete
const peerConnections: Record<string, RTCPeerConnection> = {};
const dataChannels: Record<string, RTCDataChannel> = {};
const receivedChunks: Record<number, Blob> = {};
const chunkSize = 64 * 1024; // 64 KB

export const createPeerConnection = (peerId: string): RTCPeerConnection => {
  const peerConnection = new RTCPeerConnection();

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", { peerId, candidate: event.candidate });
    }
  };

  socket.on("ice-candidate", ({ candidate }: { candidate: RTCIceCandidateInit }) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  });

  return peerConnection;
};

export const requestChunk = async (peerId: string, chunkIndex: number): Promise<Blob> => {
  return new Promise((resolve) => {
    const peerConnection = createPeerConnection(peerId);

    peerConnection.ondatachannel = (event) => {
      const receiveChannel = event.channel;
      receiveChannel.onmessage = (e) => {
        resolve(e.data as Blob);
      };
    };

    const dataChannel = peerConnection.createDataChannel("chunk-request");
    dataChannel.send(JSON.stringify({ chunkIndex }));
  });
};
