const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const app = require('../src/app');
const documentRepository = require('../src/repositories/documentRepository');

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download de documentos', async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  let uploadedId;

  try {
    const missingFileUpload = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: new FormData(),
    });
    assert.equal(missingFileUpload.status, 400);

    const invalidForm = new FormData();
    invalidForm.set('file', new Blob(['conteudo'], { type: 'application/octet-stream' }), 'arquivo.exe');
    const invalidUpload = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: invalidForm,
    });
    assert.equal(invalidUpload.status, 415);

    const oversizedForm = new FormData();
    oversizedForm.set(
      'file',
      new Blob([Buffer.alloc(10 * 1024 * 1024 + 1)], { type: 'text/plain' }),
      'grande.txt',
    );
    const oversizedUpload = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: oversizedForm,
    });
    assert.equal(oversizedUpload.status, 413);

    const form = new FormData();
    form.set('file', new Blob(['conteudo do documento'], { type: 'text/plain' }), 'relatorio.txt');
    const uploadResponse = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      body: form,
    });
    assert.equal(uploadResponse.status, 201);

    const uploadedDocument = await uploadResponse.json();
    uploadedId = uploadedDocument.id;
    assert.equal(uploadedDocument.originalName, 'relatorio.txt');
    assert.equal(uploadedDocument.size, 21);
    assert.equal(uploadedDocument.owner, 'local-user');

    const listResponse = await fetch(`${baseUrl}/documents`);
    assert.equal(listResponse.status, 200);
    const { documents } = await listResponse.json();
    assert.ok(documents.some((document) => document.id === uploadedId));

    const downloadResponse = await fetch(`${baseUrl}/documents/${uploadedId}/download`);
    assert.equal(downloadResponse.status, 200);
    assert.match(downloadResponse.headers.get('content-disposition'), /relatorio\.txt/);
    assert.equal(await downloadResponse.text(), 'conteudo do documento');

    const invalidIdResponse = await fetch(`${baseUrl}/documents/not-a-uuid/download`);
    assert.equal(invalidIdResponse.status, 400);

    const missingResponse = await fetch(`${baseUrl}/documents/7f3b2d8a-6c1e-4a90-9f52-51b837e61234/download`);
    assert.equal(missingResponse.status, 404);
  } finally {
    if (uploadedId) {
      const document = documentRepository.removeDocument(uploadedId);
      if (document) {
        await fs.unlink(document.filePath).catch(() => {});
      }
    }
  }
});
