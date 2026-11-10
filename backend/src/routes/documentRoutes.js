const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const documentController = require('../controllers/documentController');

const router = express.Router();
const storageDirectory = path.resolve(__dirname, '../../storage');
const maxFileSize = 10 * 1024 * 1024;
const acceptedTypes = new Map([
  ['.pdf', 'application/pdf'],
  ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ['.txt', 'text/plain'],
]);

fs.mkdirSync(storageDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, storageDirectory),
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const id = crypto.randomUUID();
    req.documentId = id;
    callback(null, `${id}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize, files: 1 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const expectedMimeType = acceptedTypes.get(extension);

    if (!expectedMimeType || file.mimetype !== expectedMimeType) {
      const error = new Error('O tipo de arquivo não é aceito. Envie PDF, DOCX ou TXT.');
      error.statusCode = 415;
      error.code = 'UNSUPPORTED_FILE_TYPE';
      callback(error);
      return;
    }

    callback(null, true);
  },
});

router.post('/upload', upload.single('file'), documentController.uploadDocument);
router.get('/documents', documentController.listDocuments);
router.get('/documents/:id/download', documentController.downloadDocument);

module.exports = router;