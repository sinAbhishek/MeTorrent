import React, { useState } from "react";
import { createPeerConnection, requestChunk } from "./webrtc";
import socket from "./socket"; // Assuming socket is initialized

const chunkSize = 64 * 1024; // 64KB per chunk (example)

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [chunks, setChunks] = useState<Blob[]>([]);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [downloadedChunks, setDownloadedChunks] = useState<
    (Blob | undefined)[]
  >([]);
  const [fileId] = useState<string>(() => Date.now().toString()); // Unique file ID

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const fileChunks: Blob[] = [];
    const chunkCount = Math.ceil(selectedFile.size / chunkSize);
    for (let i = 0; i < chunkCount; i++) {
      const chunk = selectedFile.slice(i * chunkSize, (i + 1) * chunkSize);
      fileChunks.push(chunk);
    }
    setChunks(fileChunks);

    socket.emit("register-chunks", {
      fileId,
      chunks: fileChunks.map((_, i) => i),
    });
  };

  const handleDownload = () => {
    if (!downloadId) {
      alert("Please enter a valid file ID");
      return;
    }

    socket.emit("send indices", downloadId);
    socket.on("getting indices", (chunkIndices: number[]) => {
      socket.emit("get-peers-for-chunks", downloadId, chunkIndices);
    });

    socket.on("peer-list-for-chunks", (peersForChunks: string[][]) => {
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
    if (!file) {
      alert("No file uploaded.");
      return;
    }

    // Ensure all chunks are downloaded
    if (
      downloadedChunks.length !== chunks.length ||
      downloadedChunks.includes(undefined)
    ) {
      alert("Download incomplete!");
      return;
    }

    const fileBlob = new Blob(downloadedChunks as Blob[], { type: file.type });
    const url = URL.createObjectURL(fileBlob);

    // Create a download link
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();

    // Revoke the URL to release memory
    URL.revokeObjectURL(url);
  };

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
