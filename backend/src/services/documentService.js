const fs = require('node:fs/promises');
const path = require('node:path');
const documentRepository = require('../repositories/documentRepository');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_OWNER = 'local-user';
const DOCUMENT_NOT_FOUND_MESSAGE = 'Documento não encontrado.';

function createHttpError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function documentNotFoundError() {
  return createHttpError(404, 'DOCUMENT_NOT_FOUND', DOCUMENT_NOT_FOUND_MESSAGE);
}

function assertValidDocumentId(id) {
  if (!UUID_PATTERN.test(id)) {
    throw createHttpError(400, 'INVALID_ID', 'O identificador do documento é inválido.');
  }
}

// Remove separadores de caminho e caracteres de controle do nome enviado pelo cliente.
function sanitizeOriginalName(name) {
  return path
    .basename(name.replace(/\\/g, '/'))
    .replace(/[\x00-\x1f\x7f]/g, '');
}

function buildMetadata(id, originalName, size) {
  return {
    id,
    originalName,
    size,
    uploadedAt: new Date().toISOString(),
    owner: DEFAULT_OWNER,
  };
}

async function removeFileQuietly(filePath) {
  await fs.unlink(filePath).catch(() => {});
}

async function isFileAvailable(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function createDocument(file, id) {
  if (!file) {
    throw createHttpError(400, 'FILE_REQUIRED', 'Envie um arquivo no campo "file".');
  }

  const originalName = sanitizeOriginalName(file.originalname);
  if (!originalName || file.size === 0) {
    await removeFileQuietly(file.path);
    throw createHttpError(400, 'INVALID_UPLOAD', 'O arquivo deve ter um nome e conteúdo.');
  }

  try {
    return documentRepository.saveDocument(buildMetadata(id, originalName, file.size), file.path);
  } catch (error) {
    await removeFileQuietly(file.path);
    throw error;
  }
}

function listDocuments() {
  return documentRepository.listDocuments();
}

async function getDocumentForDownload(id) {
  assertValidDocumentId(id);

  const document = documentRepository.findDocumentById(id);
  if (!document || !(await isFileAvailable(document.filePath))) {
    throw documentNotFoundError();
  }

  return document;
}

module.exports = {
  createDocument,
  listDocuments,
  getDocumentForDownload,
};