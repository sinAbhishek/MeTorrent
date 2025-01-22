import React, { useState } from "react";
import { createPeerConnection, sendChunk } from "./webrtc";

const App = () => {
  const [file, setFile] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [fileId] = useState(() => Date.now().toString()); // Unique file ID

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

  const handleDownload = (peerId) => {
    chunks.forEach((chunk, index) => sendChunk(peerId, index, chunk));
  };

  return (
    <div>
      <h1>Decentralized File Sharing</h1>
      <input type="file" onChange={handleFileUpload} />
      <button onClick={() => handleDownload("peer-id-here")}>Download</button>
    </div>
  );
};

export default App;
