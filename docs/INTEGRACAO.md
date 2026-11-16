# Implantação inicial e diagnóstico

## Sem infraestrutura conectada

Use `npm run dev:demo`. Todas as pessoas, matrículas e vínculos exibidos são fictícios.

## Com infraestrutura conectada

1. Configurar Supabase Auth e a tabela `headcount_access` (migração SQL).
2. Publicar o Apps Script isolado, com propriedades `SPREADSHEET_ID` e `HEADCOUNT_API_TOKEN`.
3. Adicionar as variáveis no Cloudflare Pages, separando segredos de configurações públicas.
4. Validar endpoint `/api/bootstrap` com conta autorizada.

## Cenários obrigatórios de verificação

| Cenário | Resposta esperada |
|---|---|
| Sem Authorization | HTTP 401 |
| Token expirado | HTTP 401 |
| Perfil ausente ou inativo | HTTP 403 |
| Perfil sem módulos liberados | HTTP 403 |
| Módulos específicos | Apenas colaboradores dos módulos liberados |
| Credenciais da ponte ausentes | HTTP 503 |
| Fonte indisponível | HTTP 502 |
| Login autorizado | HTTP 200, dados mínimos e `Cache-Control: private, no-store` |

Compare os agregados por alocação, módulo e status com a origem antes de publicar. Nunca use dados reais em screenshots, logs de CI ou issues públicas.
