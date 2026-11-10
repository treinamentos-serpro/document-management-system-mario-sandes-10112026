# Especificação - Document Management System

## 1. Objetivo

Disponibilizar uma aplicação web simples para enviar, listar e baixar documentos armazenados no filesystem local da aplicação.

## 2. Escopo

### Dentro do escopo

- Envio de documentos em PDF, DOCX ou TXT, com limite de 10 MiB por arquivo.
- Listagem de todos os documentos enviados nesta execução da aplicação.
- Download de um documento pelo identificador.
- Metadados associados a um proprietário demonstrativo fixo.
- Interface web para as operações previstas, integrada ao backend por meio do proxy `/api` do Vite.

### Fora do escopo

- Armazenamento externo, em nuvem ou em banco de dados.
- Persistência durável dos metadados; eles são mantidos em memória e se perdem ao reiniciar o processo.
- Autenticação, autorização, gerenciamento real de contas ou isolamento de documentos entre usuários.
- Filtro por proprietário, paginação, busca, edição, exclusão e versionamento de documentos.
- Garantia de que o conteúdo do arquivo corresponde semanticamente à extensão declarada; a validação de tipo nesta fase usa extensão e tipo de mídia informado.

## 3. Requisitos funcionais

| ID | Requisito | Critérios de aceite |
| --- | --- | --- |
| RF-01 | O sistema deve permitir o envio de um documento por requisição `multipart/form-data`. | Uma requisição com exatamente um arquivo permitido, de até 10 MiB, salva o arquivo localmente e retorna seus metadados. Sem arquivo, retorna `400`; tipo não aceito retorna `415`; arquivo acima do limite retorna `413`. |
| RF-02 | O sistema deve permitir listar os documentos conhecidos pela execução atual. | Retorna todos os metadados em memória, sem paginação ou filtro por proprietário, ordenados do mais recente para o mais antigo. Empates em `uploadedAt` são ordenados por `id` crescente. Uma coleção vazia retorna `200` e `documents: []`. |
| RF-03 | O sistema deve permitir baixar um documento pelo identificador. | Um identificador existente retorna o conteúdo binário como anexo e preserva o nome original no nome do download. Um identificador válido sem documento correspondente retorna `404`. |
| RF-04 | O sistema deve atribuir metadados a cada documento criado. | Cada upload recebe um identificador único, tamanho em bytes, data/hora de criação e o proprietário demonstrativo fixo definido nesta especificação. |
| RF-05 | O sistema deve permitir documentos com nomes originais repetidos. | Uploads de mesmo nome original não sobrescrevem uns aos outros; cada arquivo recebe um nome físico único derivado de seu identificador. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O conteúdo dos arquivos deve ser gravado somente no filesystem local da aplicação, em `backend/storage`, usando Multer com `diskStorage`. |
| RNF-02 | Os metadados devem ser mantidos em memória nesta fase. Reiniciar o processo remove a coleção de metadados; arquivos residuais no diretório local não são recuperados automaticamente. |
| RNF-03 | Configurações operacionais, como porta do servidor, devem ser obtidas por variáveis de ambiente conforme o princípio 12-Factor. A localização de armazenamento permanece local e não deve introduzir provedor externo. |
| RNF-04 | O tamanho máximo por arquivo é 10 MiB (10 × 1024 × 1024 bytes). A aplicação deve rejeitar arquivos maiores e não manter um arquivo parcial como documento disponível. |
| RNF-05 | Os únicos formatos aceitos são `.pdf`, `.docx` e `.txt`, com validação da extensão e do tipo de mídia informado na requisição. Esta validação não equivale à inspeção completa ou antivírus do conteúdo. |
| RNF-06 | Nomes fornecidos pelo cliente não devem ser usados como caminho físico. O servidor deve gerar o nome de armazenamento a partir do identificador e impedir travessia de diretório e sobrescrita acidental. |
| RNF-07 | Erros de API devem usar respostas JSON consistentes, sem expor caminhos locais, stack traces ou detalhes internos do filesystem. O download bem-sucedido é binário. |
| RNF-08 | O backend deve usar Node.js e Express com CommonJS; o frontend deve usar React e Vite com ESM. JavaScript é a linguagem desta fase, sem TypeScript. |

## 5. Modelo de dados (metadados do documento)

### Entidade `Document`

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador único, gerado pelo servidor (UUID). Também compõe o nome físico do arquivo. |
| `originalName` | string | Sim | Nome original fornecido pelo cliente, preservado para exibição e download; nunca usado como caminho de armazenamento. |
| `size` | number | Sim | Tamanho do arquivo em bytes, obtido do arquivo recebido e gravado. |
| `uploadedAt` | string | Sim | Data e hora UTC da criação, em formato ISO 8601. |
| `owner` | string | Sim | Identificador fixo `local-user` nesta fase. É metadado demonstrativo, não uma identidade autenticada nem uma regra de autorização. |

Exemplo de representação:

```json
{
  "id": "7f3b2d8a-6c1e-4a90-9f52-51b837e61234",
  "originalName": "relatorio.pdf",
  "size": 48231,
  "uploadedAt": "2026-11-10T14:30:00.000Z",
  "owner": "local-user"
}
```

Os metadados são armazenados em memória e associados a arquivos persistidos localmente. O nome físico deve ser derivado do `id` e manter uma extensão permitida, sem depender de diretórios ou caminhos enviados pelo cliente. A API não retorna esse nome físico nem o caminho absoluto.

O upload só deve ser considerado concluído quando o arquivo tiver sido gravado e os metadados adicionados à coleção. Se uma etapa falhar durante a requisição, a operação deve retornar erro e remover o arquivo parcial quando possível. Uma interrupção abrupta pode deixar arquivos órfãos: não há recuperação, limpeza automática ou persistência de metadados no escopo desta fase.

## 6. Contratos de API

O frontend acessa os caminhos com prefixo `/api`. O proxy configurado no Vite remove esse prefixo ao encaminhar a requisição ao backend. Assim, `/api/upload` no navegador corresponde a `/upload` no servidor Express.

### Convenções

- Formato de erro:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

- As mensagens de erro destinadas ao usuário devem estar em português; os códigos são identificadores estáveis em maiúsculas.
- IDs devem ser UUIDs. ID malformado retorna `400`; ID bem formado sem registro ou arquivo correspondente retorna `404`.
- Exceções inesperadas retornam `500` com mensagem genérica, sem detalhes internos.

### `POST /upload`

- Caminho do cliente: `/api/upload`.
- `Content-Type`: `multipart/form-data`.
- Campo de arquivo: `file`; deve haver exatamente um arquivo.
- Limite: 10 MiB. Formatos aceitos: PDF, DOCX e TXT, validados pela extensão e pelo tipo de mídia informado.
- Sucesso: `201 Created`, corpo JSON com os metadados do documento criado diretamente.

```json
{
  "id": "7f3b2d8a-6c1e-4a90-9f52-51b837e61234",
  "originalName": "relatorio.pdf",
  "size": 48231,
  "uploadedAt": "2026-11-10T14:30:00.000Z",
  "owner": "local-user"
}
```

| Status | Código de erro | Condição |
| --- | --- | --- |
| `400` | `FILE_REQUIRED` ou `INVALID_UPLOAD` | Campo ausente, arquivo vazio ou requisição de upload inválida. |
| `413` | `FILE_TOO_LARGE` | Arquivo acima de 10 MiB. |
| `415` | `UNSUPPORTED_FILE_TYPE` | Extensão ou tipo de mídia não aceito. |
| `500` | `INTERNAL_ERROR` | Falha inesperada ao gravar arquivo ou registrar metadados. |

### `GET /documents`

- Caminho do cliente: `/api/documents`.
- Sucesso: `200 OK`, corpo JSON envelopado em `documents`.
- Retorna todos os documentos da execução atual, em ordem decrescente de `uploadedAt`, com `id` crescente para desempate. Não há filtros, paginação ou autenticação.

```json
{
  "documents": [
    {
      "id": "7f3b2d8a-6c1e-4a90-9f52-51b837e61234",
      "originalName": "relatorio.pdf",
      "size": 48231,
      "uploadedAt": "2026-11-10T14:30:00.000Z",
      "owner": "local-user"
    }
  ]
}
```

Quando não houver documentos, retorna `200 OK` com `{"documents": []}`. Falha inesperada retorna `500` com `INTERNAL_ERROR`.

### `GET /documents/:id/download`

- Caminho do cliente: `/api/documents/:id/download`.
- Sucesso: `200 OK` com o conteúdo binário do arquivo.
- Deve enviar `Content-Disposition: attachment` com o nome original devidamente codificado para cabeçalho HTTP e `Content-Type` correspondente ao formato aceito.
- `400 INVALID_ID`: parâmetro `id` não está no formato UUID.
- `404 DOCUMENT_NOT_FOUND`: não há metadados para o ID ou o arquivo local não está disponível.
- `500 INTERNAL_ERROR`: falha inesperada na leitura do arquivo.

## 7. Decisões arquiteturais

- Backend em Node.js + Express, usando CommonJS; frontend em React + Vite, usando ESM.
- Backend organizado em Clean Architecture simples, com dependências no sentido `routes -> controllers -> services -> repositories`.
- Rotas definem endpoints e aplicam o middleware de recebimento de upload; controllers traduzem HTTP para chamadas de serviço e respostas; services concentram regras de validação e coordenação; repositories encapsulam metadados em memória e acesso ao armazenamento local.
- Multer com `diskStorage` grava exclusivamente em `backend/storage`. O nome físico é gerado pelo servidor; o nome original permanece apenas nos metadados.
- Metadados permanecem em memória durante a vida do processo. O filesystem local não constitui persistência dos metadados e não deve ser interpretado como armazenamento durável ou multi-instância.
- O frontend usa componentes funcionais com React Hooks e `fetch` para chamar o backend pelo prefixo `/api`, com proxy do Vite.
- Configurações de execução devem vir do ambiente. Dependências existentes devem ser preferidas; testes backend seguem `node:test`.
- `owner: "local-user"` é um valor fixo para demonstrar o campo do modelo. Como não há autenticação, todos os documentos são visíveis e baixáveis por qualquer cliente que alcance a aplicação.
- Armazenamento em nuvem, serviços de upload de terceiros, banco de dados, autenticação e versionamento estão explicitamente fora desta fase.

## 8. Plano de execução

As etapas abaixo descrevem a evolução futura do produto. Nesta entrega, somente esta especificação deve ser criada; nenhuma etapa de implementação de backend ou frontend faz parte do trabalho atual.

1. **Consolidar a especificação:** revisar requisitos, políticas de upload, modelo de metadados, status de erro e contratos de API antes de iniciar desenvolvimento.
2. **Implementar o fluxo de documentos no backend:** realizar upload local com Multer, manter metadados em memória e oferecer listagem e download pelas camadas definidas.
3. **Implementar a experiência web:** disponibilizar envio, listagem e download na interface React, consumindo os endpoints pelo proxy `/api`.
4. **Integrar e validar o fluxo completo:** verificar cenários de sucesso e erro, persistência de arquivos durante a execução, perda esperada de metadados após reinício e funcionamento da interface com o backend.

Critério de conclusão desta entrega documental: este arquivo deve conter as oito seções acima e permanecer como a única alteração de arquivo do repositório nesta tarefa.