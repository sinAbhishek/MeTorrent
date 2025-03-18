import React, { useState, useEffect } from "react";
import {
  createPeerConnection,
  requestChunk,
  setupDataChannelHandler,
  cleanupPeerConnection,
} from "./webrtc";
import socket from "./socket";

const chunkSize = 64 * 1024; // 64 KB

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [downloadedChunks, setDownloadedChunks] = useState<
    (Blob | undefined)[]
  >([]);
  const [fileId] = useState<string>(() => Date.now().toString());

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    console.log("File selected:", selectedFile.name);
    setFile(selectedFile);

    // Split the file into chunks
    const fileChunks: Blob[] = [];
    const chunkCount = Math.ceil(selectedFile.size / chunkSize);
    for (let i = 0; i < chunkCount; i++) {
      const chunk = selectedFile.slice(i * chunkSize, (i + 1) * chunkSize);
      fileChunks.push(chunk);
    }
    setChunks(fileChunks);
    console.log("File split into chunks:", fileChunks.length);

    // Register chunks with the backend
    socket.emit("register-chunks", {
      fileId,
      chunks: fileChunks.map((_, i) => i),
    });
    console.log("Chunks registered with backend for file ID:", fileId);

    setupDataChannelHandler(fileId, fileChunks);
  };

  // Handle file download
  const handleDownload = () => {
    if (!downloadId) {
      alert("Please enter a valid file ID");
      return;
    }

    console.log("Download requested for file ID:", downloadId);

    // Request chunk indices from the backend
    socket.emit("send indices", downloadId);
    socket.on("getting indices", (chunkIndices: number[]) => {
      console.log("Received chunk indices:", chunkIndices);
      // Request peers for the chunks
      socket.emit("get-peers-for-chunks", downloadId, chunkIndices);
    });

    // Handle peer list for chunks
    socket.on("peer-list-for-chunks", (peersForChunks: string[][]) => {
      console.log("Received peer list for chunks:", peersForChunks);
      peersForChunks.forEach((peers, index) => {
        if (peers.length > 0) {
          const peerId = peers[0];
          console.log("Requesting chunk:", index, "from peer:", peerId);
          // Request the chunk from the peer
          requestChunk(peerId, index).then((chunk) => {
            console.log("Received chunk:", index, "from peer:", peerId, chunk);
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

  // Combine downloaded chunks into a file
  const combineChunks = () => {
    if (!file) {
      alert("No file uploaded.");
      return;
    }

    if (
      downloadedChunks.length !== chunks.length ||
      downloadedChunks.includes(undefined)
    ) {
      alert("Download incomplete!");
      return;
    }

    console.log("Combining downloaded chunks into file:", file.name);
    const fileBlob = new Blob(downloadedChunks as Blob[], { type: file.type });
    const url = URL.createObjectURL(fileBlob);

    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();

    URL.revokeObjectURL(url);
  };

  // Clean up peer connections on unmount
  useEffect(() => {
    return () => {
      console.log("Cleaning up peer connections for file ID:", fileId);
      cleanupPeerConnection(fileId);
    };
  }, [fileId]);

  return (
    <div>
      <h1>Decentralized File Sharing</h1>
      <input type="file" onChange={handleFileUpload} />
      <input
        type="text"
        onChange={(e) => setDownloadId(e.target.value)}
        placeholder="Enter file ID"
      />
      <button onClick={handleDownload}>Download</button>
      <button onClick={combineChunks}>Combine & Download</button>
    </div>
  );
};

export default App;
// import React, { useState } from "react";
// import { createPeerConnection, requestChunk } from "./webrtc";
// import socket from "./socket";

// const chunkSize = 64 * 1024;

// const App: React.FC = () => {
//   const [file, setFile] = useState<File | null>(null);
//   const [chunks, setChunks] = useState<Blob[]>([]);
//   const [downloadId, setDownloadId] = useState<string | null>(null);
//   const [downloadedChunks, setDownloadedChunks] = useState<
//     (Blob | undefined)[]
//   >([]);
//   const [fileId] = useState<string>(() => Date.now().toString());

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const selectedFile = e.target.files?.[0];
//     if (!selectedFile) return;

//     setFile(selectedFile);

//     const fileChunks: Blob[] = [];
//     const chunkCount = Math.ceil(selectedFile.size / chunkSize);
//     for (let i = 0; i < chunkCount; i++) {
//       const chunk = selectedFile.slice(i * chunkSize, (i + 1) * chunkSize);
//       fileChunks.push(chunk);
//     }
//     setChunks(fileChunks);

//     socket.emit("register-chunks", {
//       fileId,
//       chunks: fileChunks.map((_, i) => i),
//     });
//   };

//   const handleDownload = () => {
//     if (!downloadId) {
//       alert("Please enter a valid file ID");
//       return;
//     }

//     socket.emit("send indices", downloadId);
//     socket.on("getting indices", (chunkIndices: number[]) => {
//       socket.emit("get-peers-for-chunks", downloadId, chunkIndices);
//     });

//     socket.on("peer-list-for-chunks", (peersForChunks: string[][]) => {
//       console.log("peersChunks", peersForChunks);
//       peersForChunks.forEach((peers, index) => {
//         if (peers.length > 0) {
//           const peerId = peers[0];
//           requestChunk(peerId, index).then((chunk) => {
//             console.log("requestchunk", chunk);
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
//     if (!file) {
//       alert("No file uploaded.");
//       return;
//     }

//     if (
//       downloadedChunks.length !== chunks.length ||
//       downloadedChunks.includes(undefined)
//     ) {
//       alert("Download incomplete!");
//       return;
//     }

//     const fileBlob = new Blob(downloadedChunks as Blob[], { type: file.type });
//     const url = URL.createObjectURL(fileBlob);

//     const a = document.createElement("a");
//     a.href = url;
//     a.download = file.name;
//     a.click();

//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div>
//       <h1>Decentralized File Sharing</h1>
//       <input type="file" onChange={handleFileUpload} />
//       <input
//         type="text"
//         onChange={(e) => setDownloadId(e.target.value)}
//         placeholder="Enter file ID"
//       />
//       <button onClick={handleDownload}>Download</button>
//       <button onClick={combineChunks}>Combine & Download</button>
//     </div>
//   );
// };

// export default App;
