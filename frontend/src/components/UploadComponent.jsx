import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.txt'];

function validateFile(file) {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return 'Formato não aceito. Selecione PDF, DOCX ou TXT.';
  }
  if (file.size === 0) return 'O arquivo está vazio.';
  if (file.size > MAX_FILE_SIZE) return 'O arquivo excede o limite de 10 MiB.';
  return '';
}

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadComponent({ onUploaded }) {
  const inputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  function selectFile(file) {
    setError('');
    setSuccessMessage('');
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setSelectedFile(null);
      setError(validationError);
      return;
    }

    setSelectedFile(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setError('');
    setSuccessMessage('');

    try {
      await uploadDocument(selectedFile);
      setSuccessMessage('Arquivo enviado.');
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
      onUploaded?.();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 1) {
      setError('Envie um arquivo por vez.');
      setSelectedFile(null);
      return;
    }

    selectFile(files[0]);
  }

  return (
    <form className="upload-tool" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept=".pdf,.docx,.txt"
        onChange={(event) => selectFile(event.target.files?.[0])}
        aria-label="Selecionar documento"
      />
      <button
        className={`drop-zone${isDragging ? ' is-dragging' : ''}`}
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        aria-describedby="upload-constraints"
      >
        <span className="upload-symbol" aria-hidden="true">↑</span>
        <span className="drop-title">{selectedFile ? 'Arquivo selecionado' : 'Escolher documento'}</span>
        <span className="drop-subtitle">{selectedFile ? 'Clique para trocar o arquivo' : 'PDF, DOCX ou TXT'}</span>
      </button>
      <p className="upload-constraints" id="upload-constraints">Máximo de 10 MiB por arquivo</p>

      {selectedFile && (
        <div className="selected-file">
          <span className="selected-file-name" title={selectedFile.name}>{selectedFile.name}</span>
          <span>{formatFileSize(selectedFile.size)}</span>
        </div>
      )}
      {error && <p className="form-message error-message" role="alert">{error}</p>}
      {successMessage && <p className="form-message success-message" role="status">{successMessage}</p>}
      <button className="primary-button upload-submit" type="submit" disabled={!selectedFile || isUploading}>
        {isUploading ? 'Enviando…' : 'Enviar documento'}
      </button>
    </form>
  );
}