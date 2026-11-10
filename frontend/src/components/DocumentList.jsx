import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getFileExtension(fileName) {
  return fileName.split('.').pop()?.slice(0, 4).toUpperCase() || 'FILE';
}

export default function DocumentList({ documents, isLoading, error, onRetry }) {
  if (isLoading && documents.length === 0) {
    return <p className="list-state" role="status">Carregando documentos…</p>;
  }

  if (error && documents.length === 0) {
    return (
      <div className="list-state list-error" role="alert">
        <p>{error}</p>
        <button className="text-button" type="button" onClick={onRetry}>Tentar novamente</button>
      </div>
    );
  }

  if (documents.length === 0) {
    return <p className="list-state empty-state">Nenhum documento armazenado.</p>;
  }

  return (
    <div className="document-list-wrap">
      {error && <p className="inline-error" role="alert">{error}</p>}
      <div className="document-list-header" aria-hidden="true">
        <span>DOCUMENTO</span>
        <span>ADICIONADO</span>
        <span>TAMANHO</span>
        <span />
      </div>
      <ul className="document-list">
        {documents.map((document) => (
          <li className="document-row" key={document.id}>
            <div className="document-name-cell">
              <span className="file-type" aria-hidden="true">{getFileExtension(document.originalName)}</span>
              <span className="document-name" title={document.originalName}>{document.originalName}</span>
            </div>
            <time className="document-date" dateTime={document.uploadedAt}>{formatDate(document.uploadedAt)}</time>
            <span className="document-size">{formatFileSize(document.size)}</span>
            <DownloadButton document={document} />
          </li>
        ))}
      </ul>
    </div>
  );
}