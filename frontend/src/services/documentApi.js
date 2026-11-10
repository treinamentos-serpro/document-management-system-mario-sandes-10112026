async function getErrorMessage(response) {
  try {
    const body = await response.json();
    return body.error?.message || 'Não foi possível concluir a solicitação.';
  } catch {
    return 'Não foi possível concluir a solicitação.';
  }
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
  return response.json();
}

export async function getDocuments() {
  const result = await requestJson('/api/documents');
  return result.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  return requestJson('/api/upload', { method: 'POST', body: formData });
}

export async function downloadDocument(id, fileName) {
  const response = await fetch(`/api/documents/${encodeURIComponent(id)}/download`);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const objectUrl = URL.createObjectURL(await response.blob());
  const link = window.document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  window.document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}