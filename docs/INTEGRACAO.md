# Implantação — Cloudflare Pages + Google Sheets

1. Cloudflare Pages: conectar repositório GitHub `srcarneiro1/headcount-g5-unilog`, branch `main`, `npm run build`, output `dist`, Node 22.
2. Apps Script: criar **projeto isolado** com `apps-script/HeadcountApi.gs`, apontando `SPREADSHEET_ID` para `COLABORADORES G5`.
3. Configurar `GATEWAY_TOKEN` nas Script Properties. Manter outro valor independente para `APP_SESSION_SECRET` no Cloudflare.
4. Apenas após autorização para mudar a planilha, executar `setupHeadcountAuthSheet()` e conferir `CAD_USUARIOS`.
5. Cadastrar linhas de usuários (sem senhas em claro). Para cada um, configurar `AUTH_PENDING_EMAIL` e `AUTH_PENDING_PASSWORD` temporariamente em Script Properties e executar `applyPendingUserPassword()`; remover de qualquer screenshot e histórico de alterações.
6. Publicar Web App Apps Script `Execute as: Me`; acessível ao gateway Cloudflare. O endpoint exige token secreto e só tem as ações `LOGIN` e `HEADCOUNT_READ`.
7. No Cloudflare Pages → Settings → Variables and Secrets, cadastrar **Encrypted Secrets** `APPS_SCRIPT_URL`, `APPS_SCRIPT_GATEWAY_TOKEN`, `APP_SESSION_SECRET` em Production e Preview quando adequado. Implantar novamente após salvar.
8. Não publicar colaboradores nem hashes no GitHub. Testar inicialmente em Preview e conferir 401/403, filtração por módulos, login, troca de senha, logout, situação funcional e painel mobile.

## Verificações mínimas

| Cenário | Esperado |
| --- | --- |
| GET `/api/bootstrap` sem cookie | 401 |
| GET `/api/auth/me` sem cookie | 401 |
| POST `/api/auth/login` com usuário inexistente ou senha errada | 401 |
| Perfil inativo após login | GET `/api/bootstrap` = 403 |
| Usuário sem módulos liberados | Login negado |
| Perfil `M04` | Somente colaboradores com `module=M04` |
| Primeiro login com senha provisória | Solicitação de senha definitiva; depois nova sessão |
| Logout | Limpa cookie; próxima consulta = 401 |
| Segredos ausentes | Mensagem de erro; nunca dados abertos |
| Falha/timeout Apps Script | Erro controlado sem registro pessoal |

## Observações técnicas

O **front publicado não oferece modo demo em produção**. O Apps Script não recebe requisições diretas do navegador. Não existe necessidade de criar outro banco para armazenar contas ou colaboradores. O endpoint do Apps Script pode ser público na camada Google, mas a comunicação é protegida por segredo de alta entropia verificado em todas as chamadas; trate o URL como dado de infraestrutura e restrinja logs.

Antes do uso real, rever as regras de proteção contra tentativas repetidas de login, a guarda dos hashes na planilha e o algoritmo de derivação de senha.
