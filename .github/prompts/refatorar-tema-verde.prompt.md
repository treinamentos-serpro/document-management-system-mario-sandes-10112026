---
description: Refatora o visual do frontend para uma paleta predominantemente verde, sem alterar comportamento.
name: refatorar-tema-verde
argument-hint: intensidade do verde (ex. suave, médio, forte) - opcional
agent: agent
---

# Refatorar o site em tons de verde

Refatore o visual do frontend do DMS para uma paleta predominantemente verde, usando `${input:intensidade:intensidade do verde (suave, médio ou forte)}` como referência de intensidade.

Escopo:

- Arquivos de estilo em `frontend/src` (principalmente `App.css`, além de qualquer CSS inline em `frontend/src/components` e `frontend/src/pages`, se existirem).
- Não altere a lógica dos componentes, as chamadas `fetch` para `/api`, nem a estrutura de markup, exceto quando necessário para acessibilidade de contraste.

Diretrizes de cor:

1. Centralize as cores em variáveis CSS (`:root`) e reutilize-as. Substitua valores hexadecimais repetidos por essas variáveis, evitando duplicação.
2. Use verde como cor de destaque principal (botões primários, foco, indicadores de sessão, ícones, contadores).
3. Mantenha fundos neutros com leve matiz verde (ex.: `#edf1ed`, `#f7faf7`) e cabeçalho em verde escuro.
4. Substitua o laranja/terracota de acentos (ex.: `#ef9573`, `#b45b3e`) por variações de verde. Mantenha uma única cor de acento de alerta apenas para erros (`.error-message`, `.inline-error`, `.download-error`), pois estados de erro precisam continuar distintos.
5. Hover, foco e estados `:disabled` devem continuar visíveis e com contraste suficiente (WCAG AA: mínimo 4.5:1 para texto normal).
6. Preserve as mensagens de sucesso (`.success-message`) em tom verde.

Requisitos:

- Não quebre funcionalidades existentes: upload, listagem, download e mensagens de erro devem continuar funcionando e legíveis.
- Não adicione dependências nem bibliotecas de temas.
- Não altere textos ao usuário (que permanecem em português).
- Só adicione comentários onde a intenção da cor não for óbvia.

Validação:

- Rode o build do frontend (`npm run build` dentro de `frontend`) e confirme que não há erros.
- Revise visualmente as telas de upload e listagem, verificando contraste e estados de hover, foco e desabilitado.
- Liste ao final um resumo das variáveis de cor criadas e das substituições feitas.
