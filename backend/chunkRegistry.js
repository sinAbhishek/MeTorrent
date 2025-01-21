const chunkRegistry = {}; // { fileId: { chunkIndex: [peerId, ...] } }

/**
 * Registers chunks for a specific peer and file.
 * @param {string} peerId - The ID of the peer.
 * @param {string} fileId - The ID of the file.
 * @param {number[]} chunks - The list of chunk indices.
 */
function addChunks(peerId, fileId, chunks) {
  if (!chunkRegistry[fileId]) chunkRegistry[fileId] = {};
  chunks.forEach((chunkIndex) => {
    if (!chunkRegistry[fileId][chunkIndex])
      chunkRegistry[fileId][chunkIndex] = [];
    if (!chunkRegistry[fileId][chunkIndex].includes(peerId)) {
      chunkRegistry[fileId][chunkIndex].push(peerId);
    }
  });
}

/**
 * Gets a list of peers that have a specific chunk.
 * @param {string} fileId - The ID of the file.
 * @param {number} chunkIndex - The chunk index.
 * @returns {string[]} - A list of peer IDs.
 */
function getPeersForChunk(fileId, chunkIndex) {
  return chunkRegistry[fileId]?.[chunkIndex] || [];
}

/**
 * Removes all chunks associated with a peer.
 * @param {string} peerId - The ID of the peer.
 */
function removePeerChunks(peerId) {
  Object.keys(chunkRegistry).forEach((fileId) => {
    Object.keys(chunkRegistry[fileId]).forEach((chunkIndex) => {
      chunkRegistry[fileId][chunkIndex] = chunkRegistry[fileId][
        chunkIndex
      ].filter((id) => id !== peerId);
      if (chunkRegistry[fileId][chunkIndex].length === 0) {
        delete chunkRegistry[fileId][chunkIndex];
      }
    });
    if (Object.keys(chunkRegistry[fileId]).length === 0) {
      delete chunkRegistry[fileId];
    }
  });
}

module.exports = { addChunks, getPeersForChunk, removePeerChunks };
