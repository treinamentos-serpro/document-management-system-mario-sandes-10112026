const documents = new Map();

function saveDocument(metadata, filePath) {
  documents.set(metadata.id, { ...metadata, filePath });
  return { ...metadata };
}

function listDocuments() {
  return [...documents.values()]
    .map(({ filePath, ...metadata }) => metadata)
    .sort((left, right) => {
      const dateOrder = right.uploadedAt.localeCompare(left.uploadedAt);
      return dateOrder || left.id.localeCompare(right.id);
    });
}

function findDocumentById(id) {
  const document = documents.get(id);
  return document ? { ...document } : null;
}

function removeDocument(id) {
  const document = documents.get(id);
  documents.delete(id);
  return document ? { ...document } : null;
}

module.exports = {
  saveDocument,
  listDocuments,
  findDocumentById,
  removeDocument,
};