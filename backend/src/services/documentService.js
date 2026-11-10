const fs = require('node:fs/promises');
const path = require('node:path');
const documentRepository = require('../repositories/documentRepository');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createHttpError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

async function createDocument(file, id) {
  if (!file) {
    throw createHttpError(400, 'FILE_REQUIRED', 'Envie um arquivo no campo "file".');
  }

  const originalName = path
    .basename(file.originalname.replace(/\\/g, '/'))
    .replace(/[\x00-\x1f\x7f]/g, '');

  if (!originalName || file.size === 0) {
    await fs.unlink(file.path).catch(() => {});
    throw createHttpError(400, 'INVALID_UPLOAD', 'O arquivo deve ter um nome e conteúdo.');
  }

  const metadata = {
    id,
    originalName,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: 'local-user',
  };

  try {
    return documentRepository.saveDocument(metadata, file.path);
  } catch (error) {
    await fs.unlink(file.path).catch(() => {});
    throw error;
  }
}

function listDocuments() {
  return documentRepository.listDocuments();
}

async function getDocumentForDownload(id) {
  if (!UUID_PATTERN.test(id)) {
    throw createHttpError(400, 'INVALID_ID', 'O identificador do documento é inválido.');
  }

  const document = documentRepository.findDocumentById(id);
  if (!document) {
    throw createHttpError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  try {
    await fs.access(document.filePath);
  } catch {
    throw createHttpError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  return document;
}

module.exports = {
  createDocument,
  listDocuments,
  getDocumentForDownload,
};