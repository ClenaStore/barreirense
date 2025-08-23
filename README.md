# Painel de Aniversários (Frontend)
Site estático que lê uma Planilha Google (via Web App do Apps Script) e dispara mensagens via endpoint da Vercel.

## Publicação (GitHub Pages)
1. Repositório → Settings → Pages → Source = **Deploy from a branch**, Branch = **main**.
2. Acesse: `https://SEU_USUARIO.github.io/aniversarios-frontend/`.

## Configuração
- Edite `index.html` e ajuste:
  - `GAS_URL` (URL do seu Apps Script publicado)
  - `WHATSAPP_ENDPOINT` (URL pública da Vercel)
