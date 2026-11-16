# Continuidade do Headcount G5 — instruções ao Claude

Repositório `srcarneiro1/headcount-g5-unilog`. Stack: React 19, TypeScript, Vite, PrimeReact, Cloudflare Pages Functions e Google Apps Script/Sheets.

## Fonte de verdade da arquitetura

**Não introduzir Supabase, Firebase, PostgreSQL nem outro banco de dados.** A fonte de registros, usuários e permissões é `COLABORADORES G5`, com `Cadastros`, `Dados` e `CAD_USUARIOS`. O modelo de autenticação segue a estrutura do Extra Cost: autenticação verificada pelo Apps Script e sessão assinada em cookie HttpOnly no Cloudflare. Não modificar o projeto Extra Cost.

O projeto é de consulta. A autorização por módulos é imposta no **Apps Script**, ao reler o usuário na aba `CAD_USUARIOS` a cada solicitação. Nunca confiar em módulos informados pelo navegador ou no cookie como autorização atual. Ver `docs/ARQUITETURA.md`.

## Estrutura

- `src/pages`: Home, Employees, Supervision, Analytics, OrgChart.
- `src/lib/metrics.ts` e `metrics.test.ts`: métricas puras e testadas.
- `src/lib/auth.ts`: chamadas de login, sessão e logout ao mesmo domínio.
- `functions/_auth.ts`: cookies JWT via `jose` (8h, HttpOnly, Secure, SameSite=Lax).
- `functions/_gateway.ts`: Apps Script HTTPS via segredo de servidor.
- `functions/api/auth/*`: login, estado da sessão e logout.
- `functions/api/bootstrap.ts`: dados filtrados do Headcount.
- `apps-script/HeadcountApi.gs`: autenticação, acesso à aba `CAD_USUARIOS`, leitura minimizada de `Cadastros`; senha inicial provisionada manualmente por Script Properties.
- `src/data/demo.ts`: apenas dados fictícios; nunca em produção.

## Regras obrigatórias

1. **Nunca versionar dados reais de colaboradores, CPF, nascimento, telefone, senhas, salt/hash ou tokens**, inclusive em fixtures, issues, screenshots e logs.
2. Não criar fluxo de catraca.
3. Não criar edição de colaboradores na planilha sem requisitos e aprovação. A única escrita prevista no Apps Script é `CAD_USUARIOS` durante setup e troca de senha.
4. Não classificar automaticamente todo status diferente de `Trabalhando` como desligamento.
5. Não expor `APPS_SCRIPT_GATEWAY_TOKEN`, `APP_SESSION_SECRET`, `AUTH_PASSWORD_PEPPER` ou `SPREADSHEET_ID` no frontend.
6. Não modificar `bi-logistico-v2` nem `extra-cost-control-unilog`.
7. Testar build, login, 401/403, módulos, senha inicial, logout, layout mobile, consistência de métricas e resposta da ponte. NUNCA considerar integração real homologada sem testes com a implantação autorizada.
8. Revisar proteção contra brute force, retenção, KDF de senha, políticas de acesso aos hashes na planilha e observabilidade sem dados pessoais antes de produção.

## Continuidade sugerida

Gerar e versionar `package-lock.json` para CI determinística; testes de Pages Functions; cache com escopo correto; indicadores de HC contratado/realizado apenas depois de definir regra de negócio; melhoria da experiência mobile; autorização e auditoria. Não incluir serviços externos de persistência apenas por conveniência tecnológica.

**Configuração do Cloudflare Pages:** branch `main`, comando `npm run build`, output `dist`, Node 22. Segredos `APPS_SCRIPT_URL`, `APPS_SCRIPT_GATEWAY_TOKEN`, `APP_SESSION_SECRET`. A execução atual ainda requer configurar Apps Script, usuários e segredo no Cloudflare; não há deploy autenticado homologado.
