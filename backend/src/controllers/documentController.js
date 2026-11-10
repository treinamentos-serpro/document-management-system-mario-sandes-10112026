const documentService = require('../services/documentService');

async function uploadDocument(req, res) {
  const document = await documentService.createDocument(req.file, req.documentId);
  return res.status(201).json(document);
}

function listDocuments(req, res) {
  return res.status(200).json({ documents: documentService.listDocuments() });
}

async function downloadDocument(req, res, next) {
  const document = await documentService.getDocumentForDownload(req.params.id);

  return res.download(document.filePath, document.originalName, (error) => {
    if (!error) {
      return;
    }

    if (res.headersSent) {
      res.destroy(error);
      return;
    }

    if (error.code === 'ENOENT') {
      error.statusCode = 404;
      error.code = 'DOCUMENT_NOT_FOUND';
      error.message = 'Documento não encontrado.';
    }

    next(error);
  });
}

module.exports = {
  uploadDocument,
  listDocuments,
  downloadDocument,
};