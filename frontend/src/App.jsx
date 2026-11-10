import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { getDocuments } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  async function loadDocuments() {
    setIsLoading(true);
    setLoadError('');

    try {
      setDocuments(await getDocuments());
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  function handleUploaded() {
    loadDocuments();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D.</span>
          <span className="brand-name">ARQUIVO<span> / DMS</span></span>
        </a>
        <span className="session-indicator"><span /> Acesso local</span>
      </header>

      <main className="workspace">
        <div className="page-heading">
          <div>
            <p className="eyebrow">BIBLIOTECA</p>
            <h1>Seus documentos</h1>
          </div>
          <div className="document-count" aria-live="polite">
            <strong>{documents.length}</strong>
            <span>{documents.length === 1 ? 'documento' : 'documentos'}</span>
          </div>
        </div>

        <div className="workspace-grid">
          <section className="upload-section" aria-labelledby="upload-heading">
            <div className="section-heading">
              <span className="section-index">01</span>
              <h2 id="upload-heading">Adicionar arquivo</h2>
            </div>
            <UploadComponent onUploaded={handleUploaded} />
          </section>

          <section className="documents-section" aria-labelledby="documents-heading">
            <div className="section-heading documents-heading">
              <span className="section-index">02</span>
              <h2 id="documents-heading">Arquivos armazenados</h2>
              <button
                className="refresh-button"
                type="button"
                onClick={loadDocuments}
                disabled={isLoading}
                title="Atualizar lista"
                aria-label="Atualizar lista"
              >
                <span aria-hidden="true">↻</span>
              </button>
            </div>
            <DocumentList
              documents={documents}
              isLoading={isLoading}
              error={loadError}
              onRetry={loadDocuments}
            />
          </section>
        </div>
      </main>
      <footer className="app-footer">
        <span>DOCUMENT MANAGEMENT SYSTEM</span>
        <span>ARMAZENAMENTO LOCAL</span>
      </footer>
    </div>
  );
}
