app.post("/api/files/chunks/register", (req, res) => {
  const { fileHash, chunkIndex, peerId } = req.body;

  if (!files[fileHash]) {
    files[fileHash] = { chunks: {} };
  }

  if (!files[fileHash].chunks[chunkIndex]) {
    files[fileHash].chunks[chunkIndex] = [];
  }

  if (!files[fileHash].chunks[chunkIndex].includes(peerId)) {
    files[fileHash].chunks[chunkIndex].push(peerId);
  }

  res.status(200).json({ message: "Chunk registered successfully" });
});
