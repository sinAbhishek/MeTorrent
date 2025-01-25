import React, { useState } from "react";
import { createPeerConnection, requestChunk } from "./webrtc";
import socket from "./socket"; // Assuming socket is initialized

const chunkSize = 64 * 1024; // 64KB per chunk (example)

const App = () => {
  const [file, setFile] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [downloadid, setdownloadId] = useState(null);
  const [downloadedChunks, setDownloadedChunks] = useState([]);
  const [fileId] = useState(() => Date.now().toString()); // Unique file ID
  const [peerList, setPeerList] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setFile(file);

    // Split file into chunks
    const fileChunks = [];
    const chunkCount = Math.ceil(file.size / chunkSize);
    for (let i = 0; i < chunkCount; i++) {
      const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
      fileChunks.push(chunk);
    }
    setChunks(fileChunks);

    // Register chunks with the backend
    socket.emit("register-chunks", {
      fileId,
      chunks: fileChunks.map((_, i) => i),
    });
  };

  const handleDownload = () => {
    // Request peers for each chunk
    socket.emit("send indices", downloadid);
    socket.on("getting indices", (chunkindices) => {
      console.log(chunkindices);
      const chunkIndices = chunkindices.map((_, i) => i);
      socket.emit("get-peers-for-chunks", downloadid, chunkIndices);
    });
    // const chunkIndices = chunks.map((_, i) => i);
    // socket.emit("get-peers-for-chunks", downloadid, chunkIndices);
    socket.on("peer-list-for-chunks", (peersForChunks) => {
      console.log(peersForChunks);
      peersForChunks.forEach((peers, index) => {
        if (peers.length > 0) {
          const peerId = peers[0]; // Select the first peer with the chunk
          requestChunk(peerId, index).then((chunk) => {
            setDownloadedChunks((prev) => {
              const updatedChunks = [...prev];
              updatedChunks[index] = chunk;
              return updatedChunks;
            });
          });
        }
      });
    });
  };

  const combineChunks = () => {
    // Ensure all chunks are downloaded
    if (
      downloadedChunks.length !== chunks.length ||
      downloadedChunks.includes(undefined)
    ) {
      alert("Download incomplete!");
      return;
    }

    // Combine chunks into a single Blob
    const fileBlob = new Blob(downloadedChunks, { type: file.type });
    const url = URL.createObjectURL(fileBlob);

    // Create a download link
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();

    // Revoke the URL to release memory
    URL.revokeObjectURL(url);
  };
  const providefileid = (e) => {
    setdownloadId(e.target.value);
    console.log(typeof e.target.value);
  };
  return (
    <div>
      <h1>Decentralized File Sharing</h1>
      <input type="file" onChange={handleFileUpload} />
      <input type="text" onChange={providefileid} />
      <button onClick={handleDownload}>Download</button>
      <button onClick={combineChunks}>Combine & Download</button>
    </div>
  );
};

export default App;

// // Frontend: App.js
// import React, { useState } from "react";
// import { createPeerConnection, requestChunk } from "./webrtc";
// import socket from "./socket"; // Assuming socket is initialized

// const chunkSize = 64 * 1024; // 64KB per chunk (example)

// const App = () => {
//   const [file, setFile] = useState(null);
//   const [chunks, setChunks] = useState([]);
//   const [downloadedChunks, setDownloadedChunks] = useState([]);
//   const [fileId] = useState(() => Date.now().toString()); // Unique file ID
//   const [peerList, setPeerList] = useState([]);

//   const handleFileUpload = (e) => {
//     const file = e.target.files[0];
//     setFile(file);

//     // Split file into chunks
//     const fileChunks = [];
//     const chunkCount = Math.ceil(file.size / chunkSize);
//     for (let i = 0; i < chunkCount; i++) {
//       const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
//       fileChunks.push(chunk);
//     }
//     setChunks(fileChunks);

//     // Register chunks with the backend
//     socket.emit("register-chunks", {
//       fileId,
//       chunks: fileChunks.map((_, i) => i),
//     });
//   };

//   const handleDownload = () => {
//     // Request peers for each chunk
//     const chunkIndices = chunks.map((_, i) => i);
//     socket.emit("get-peers-for-chunks", fileId, chunkIndices);
//     socket.on("peer-list-for-chunks", (peersForChunks) => {
//       peersForChunks.forEach((peers, index) => {
//         if (peers.length > 0) {
//           const peerId = peers[0]; // Select the first peer with the chunk
//           requestChunk(peerId, index).then((chunk) => {
//             setDownloadedChunks((prev) => {
//               const updatedChunks = [...prev];
//               updatedChunks[index] = chunk;
//               return updatedChunks;
//             });
//           });
//         }
//       });
//     });
//   };

//   const combineChunks = () => {
//     // Ensure all chunks are downloaded
//     if (downloadedChunks.length !== chunks.length || downloadedChunks.includes(undefined)) {
//       alert("Download incomplete!");
//       return;
//     }

//     // Combine chunks into a single Blob
//     const fileBlob = new Blob(downloadedChunks, { type: file.type });
//     const url = URL.createObjectURL(fileBlob);

//     // Create a download link
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = file.name;
//     a.click();

//     // Revoke the URL to release memory
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div>
//       <h1>Decentralized File Sharing</h1>
//       <input type="file" onChange={handleFileUpload} />
//       <button onClick={handleDownload}>Download</button>
//       <button onClick={combineChunks}>Combine & Download</button>
//     </div>
//   );
// };

// export default App;

// // Supporting socket.js
// import { io } from "socket.io-client";
// const socket = io("http://localhost:3000");
// export default socket;

// // Supporting webrtc.js
// export const createPeerConnection = (peerId) => {
//   const peerConnection = new RTCPeerConnection();

//   peerConnection.onicecandidate = (event) => {
//     if (event.candidate) {
//       socket.emit("ice-candidate", { peerId, candidate: event.candidate });
//     }
//   };

//   socket.on("ice-candidate", ({ candidate }) => {
//     peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
//   });

//   return peerConnection;
// };

// export const requestChunk = async (peerId, chunkIndex) => {
//   return new Promise((resolve) => {
//     const peerConnection = createPeerConnection(peerId);

//     peerConnection.ondatachannel = (event) => {
//       const receiveChannel = event.channel;
//       receiveChannel.onmessage = (e) => {
//         resolve(e.data); // Resolve with the received chunk
//       };
//     };

//     const dataChannel = peerConnection.createDataChannel("chunk-request");
//     dataChannel.send(JSON.stringify({ chunkIndex }));
//   });
// };
