const chunkRegistry = {}; // { fileId: { chunkIndex: [peerId, ...] } }

/**

 * @param {string} peerId
 * @param {string} fileId
 * @param {number[]} chunks
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

 * @param {string} fileId - The ID of the file.
 * @param {number} chunkIndex - The chunk index.
 * @returns {string[]} - A list of peer IDs.
 */
function getPeersForChunk(fileId, chunkIndex) {
  return chunkRegistry[fileId]?.[chunkIndex] || [];
}

/**

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
function sendindices(fileid) {
  console.log(fileid);
  return Object.keys(chunkRegistry[fileid]);
}

module.exports = {
  addChunks,
  getPeersForChunk,
  removePeerChunks,
  sendindices,
  chunkRegistry,
};
