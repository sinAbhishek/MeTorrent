import socket from "./socket";

const peerConnections: Record<string, RTCPeerConnection> = {};
const dataChannels: Record<string, RTCDataChannel> = {};

// Create a peer connection and set up event handlers
export const createPeerConnection = (peerId: string): RTCPeerConnection => {
  if (peerConnections[peerId]) {
    console.log("Reusing existing peer connection for peer:", peerId);
    return peerConnections[peerId];
  }

  console.log("Creating new peer connection for peer:", peerId);
  const peerConnection = new RTCPeerConnection();
  peerConnections[peerId] = peerConnection;

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("New ICE candidate for peer:", peerId, event.candidate);
      socket.emit("ice-candidate", { peerId, candidate: event.candidate });
    } else {
      console.log("All ICE candidates gathered for peer:", peerId);
    }
  };

  // Handle ICE connection state changes
  peerConnection.oniceconnectionstatechange = () => {
    console.log(
      "ICE connection state changed for peer:",
      peerId,
      peerConnection.iceConnectionState
    );
    if (peerConnection.iceConnectionState === "failed") {
      console.error("ICE connection failed for peer:", peerId);
      cleanupPeerConnection(peerId);
    }
  };

  // Handle incoming ICE candidates from the remote peer
  socket.on("ice-candidate", ({ peerId, candidate }: { peerId: string; candidate: RTCIceCandidateInit }) => {
    console.log("Received ICE candidate for peer:", peerId, candidate);
    if (peerConnections[peerId]) {
      peerConnections[peerId]
        .addIceCandidate(new RTCIceCandidate(candidate))
        .catch((error) => {
          console.error("Error adding ICE candidate for peer:", peerId, error);
        });
    }
  });

  return peerConnection;
};

// Clean up a peer connection
export const cleanupPeerConnection = (peerId: string) => {
  console.log("Cleaning up peer connection for peer:", peerId);
  if (peerConnections[peerId]) {
    peerConnections[peerId].close();
    delete peerConnections[peerId];
  }
  if (dataChannels[peerId]) {
    delete dataChannels[peerId];
  }
};

// Request a chunk from a peer
export const requestChunk = async (peerId: string, chunkIndex: number): Promise<Blob> => {
  console.log("Requesting chunk:", chunkIndex, "from peer:", peerId);
  return new Promise((resolve, reject) => {
    const peerConnection = createPeerConnection(peerId);
    console.log("Peer connection created for peer:", peerId, peerConnection);

    // Create the data channel
    const dataChannel = peerConnection.createDataChannel("chunk-request");
    console.log("Data channel created for peer:", peerId, dataChannel);
    dataChannels[peerId] = dataChannel;

    // Set up data channel event handlers
    dataChannel.onopen = () => {
      console.log("Data channel opened for peer:", peerId, "readyState:", dataChannel.readyState);
      // Send the chunk request to the remote peer
      dataChannel.send(JSON.stringify({ chunkIndex }));
    };

    dataChannel.onmessage = (e) => {
      console.log("Data channel message received from peer:", peerId, e.data);
      if (e.data instanceof Blob) {
        resolve(e.data); // Resolve the promise with the received chunk
      } else {
        reject(new Error("Received data is not a Blob"));
      }
    };

    dataChannel.onerror = (error) => {
      console.error("Data channel error for peer:", peerId, error);
      reject(error);
    };

    dataChannel.onclose = () => {
      console.log("Data channel closed for peer:", peerId);
    };

    // Create an offer and send it to the remote peer
    peerConnection.createOffer().then((offer) => {
      console.log("Created offer for peer:", peerId, offer);
      return peerConnection.setLocalDescription(offer);
    }).then(() => {
      console.log("Local description set for peer:", peerId);
      socket.emit("send-offer", { peerId, offer: peerConnection.localDescription });
    }).catch((error) => {
      console.error("Error creating offer for peer:", peerId, error);
      reject(error);
    });

    // Handle incoming answers from the remote peer
    socket.on("receive-answer", ({ peerId: remotePeerId, answer }) => {
      if (remotePeerId === peerId) {
        console.log("Received answer for peer:", peerId, answer);
        peerConnection.setRemoteDescription(answer).catch((error) => {
          console.error("Error setting remote description for peer:", peerId, error);
        });
      }
    });
  });
};

// Handle incoming data channels (for the uploader)
export const setupDataChannelHandler = (peerId: string, chunks: Blob[]) => {
  console.log("Setting up data channel handler for peer:", peerId);
  const peerConnection = createPeerConnection(peerId);

  // Handle incoming offers from the remote peer
  socket.on("receive-offer", async ({ peerId: remotePeerId, offer }) => {
    if (remotePeerId === peerId) {
      console.log("Received offer for peer:", peerId, offer);
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      console.log("Created answer for peer:", peerId, answer);
      await peerConnection.setLocalDescription(answer);
      socket.emit("send-answer", { peerId, answer });
    }
  });

  peerConnection.ondatachannel = (event) => {
    console.log("Incoming data channel for peer:", peerId, event.channel);
    const receiveChannel = event.channel;

    receiveChannel.onmessage = async (e) => {
      try {
        console.log("Received message on data channel from peer:", peerId, e.data);
        // Parse the chunk request
        const { chunkIndex } = JSON.parse(e.data);
        console.log("Requested chunk index:", chunkIndex);

        // Fetch the requested chunk
        const chunk = chunks[chunkIndex];
        console.log("Sending chunk:", chunkIndex, "to peer:", peerId);

        // Send the chunk back to the requester
        receiveChannel.send(chunk);
      } catch (error) {
        console.error("Error handling chunk request for peer:", peerId, error);
      }
    };

    receiveChannel.onerror = (error) => {
      console.error("Data channel error for peer:", peerId, error);
    };
  };
};




// import io from "socket.io-client";
// import socket from "./socket";
// const peerConnections: Record<string, RTCPeerConnection> = {};
// const dataChannels: Record<string, RTCDataChannel> = {};
// const receivedChunks: Record<number, Blob> = {};
// const chunkSize = 64 * 1024; // 64 KB

// interface IceCandidateEvent {
//   candidate: RTCIceCandidateInit;
// }

// export const createPeerConnection = (peerId: string): RTCPeerConnection => {
//   if (peerConnections[peerId]) {
//     return peerConnections[peerId];
//   }

//   const peerConnection = new RTCPeerConnection();
//   peerConnections[peerId] = peerConnection;

//   peerConnection.onicecandidate = (event) => {
//     if (event.candidate) {
//       socket.emit("ice-candidate", { peerId, candidate: event.candidate });
//     }
//   };

//   peerConnection.oniceconnectionstatechange = () => {
//     if (peerConnection.iceConnectionState === "failed") {
//       console.error("ICE connection failed");
//       // Handle the failure, e.g., by retrying or notifying the user
//     }
//   };

//   socket.on("ice-candidate", ({ candidate }: { candidate: RTCIceCandidateInit }) => {
//     peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch((error) => {
//       console.error("Error adding ICE candidate:", error);
//     });
//   });

//   return peerConnection;
// };

// export const requestChunk = async (peerId: string, chunkIndex: number): Promise<Blob> => {
//   console.log("requestchunk2", chunkIndex,peerId);
//   console.log(dataChannels)
//   console.log(peerConnections)
//   return new Promise((resolve, reject) => {
//     const peerConnection = createPeerConnection(peerId);
//     console.log(peerConnections)
//     console.log("promisetrigger");
//     if (dataChannels[peerId]) {
//       console.log("iftriiger");
//       const dataChannel = dataChannels[peerId];
//       try {
//         dataChannel.send(JSON.stringify({ chunkIndex }));
//       } catch (error) {
//         reject(error);
//       }
//       return;
//     }

//     peerConnection.ondatachannel = (event) => {
//       console.log("else");
//       const receiveChannel = event.channel;
//       receiveChannel.onmessage = (e) => {
//         resolve(e.data as Blob);
//       };

//       receiveChannel.onerror = (error) => {
//         reject(error);
//       };

//       const dataChannel = peerConnection.createDataChannel("chunk-request");
//       dataChannels[peerId] = dataChannel;
//       try {
//         dataChannel.send(JSON.stringify({ chunkIndex }));
//       } catch (error) {
//         reject(error);
//       }
//     };
//   });
// };



































// // import io from "socket.io-client";
// // import socket from "./socket";
// // //incomplete
// // const peerConnections: Record<string, RTCPeerConnection> = {};
// // const dataChannels: Record<string, RTCDataChannel> = {};
// // const receivedChunks: Record<number, Blob> = {};
// // const chunkSize = 64 * 1024; // 64 KB

// // export const createPeerConnection = (peerId: string): RTCPeerConnection => {
// //   const peerConnection = new RTCPeerConnection();

// //   peerConnection.onicecandidate = (event) => {
// //     if (event.candidate) {
// //       socket.emit("ice-candidate", { peerId, candidate: event.candidate });
// //     }
// //   };

// //   socket.on("ice-candidate", ({ candidate }: { candidate: RTCIceCandidateInit }) => {
// //     peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
// //   });

// //   return peerConnection;
// // };

// // export const requestChunk = async (peerId: string, chunkIndex: number): Promise<Blob> => {
// //   return new Promise((resolve) => {
// //     const peerConnection = createPeerConnection(peerId);

// //     peerConnection.ondatachannel = (event) => {
// //       const receiveChannel = event.channel;
// //       receiveChannel.onmessage = (e) => {
// //         resolve(e.data as Blob);
// //       };
// //     };

// //     const dataChannel = peerConnection.createDataChannel("chunk-request");
// //     dataChannel.send(JSON.stringify({ chunkIndex }));
// //   });
// // };
