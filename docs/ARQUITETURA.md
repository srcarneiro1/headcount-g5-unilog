# Arquitetura Headcount G5 — sem banco externo

## Fluxo

```text
React (usuário e telas)
  └─ /api/auth/login → Pages Function → Apps Script LOGIN → CAD_USUARIOS
       └─ cookie de sessão assinado no Cloudflare (8 horas, HttpOnly)
           └─ /api/bootstrap → Pages Function verifica cookie
                └─ Apps Script HEADCOUNT_READ lê CAD_USUARIOS novamente
                    └─ filtra por MODULOS autorizado antes de retornar
                        └─ Cadastros (sem CPF/contato/nascimento)
```

O cookie prova a autenticação, mas **não substitui** a autorização mais recente da planilha. Retirar `ATIVO` ou `MODULOS` do usuário bloqueia novas leituras sem aguardar o cookie expirar.

## Aba de usuários

`CAD_USUARIOS`, criada manualmente via `setupHeadcountAuthSheet()`:

| Coluna | Nome | Uso |
| --- | --- | --- |
| A | EMAIL | Identificador único; normalizado em minúsculas |
| B | NOME | Nome de exibição |
| C | SENHA_HASH | Hash iterativo com salt e pepper; não é senha em texto puro |
| D | SALT | Valor aleatório individual |
| E | PERFIL | `OWNER`, `ADMIN`, `VISUALIZADOR` |
| F | MODULOS | `*`, ou lista como `M04;M05` |
| G | ATIVO | `SIM` ou inativo |
| H | EXIGE_TROCA_SENHA | `SIM` até primeiro login com nova senha |
| I | ULTIMA_ALTERACAO | Momento de troca da senha |

Acessos são bloqueados quando o usuário não existe, é inativo, está duplicado ou não possui módulos explícitos. `*` significa todos os módulos. Os papéis são informativos nesta fase, pois o Headcount é somente consulta.

## Contrato operacional

| Campo entregue | Coluna Cadastros | Observação |
| --- | --- | --- |
| id | G — Cadastro | Matrícula |
| name | A — Nome | Nome funcional |
| role | E — Título Reduzido (Cargo) | Cargo |
| area | F — Área funcional | Área |
| admission | H — Admissão | Data exibida |
| costCenter | M — C.C | Centro de custo |
| status | N — Status | Texto original |
| client | O — Alocação | Cliente/depositante |
| shift | P — Horário | Escala |
| supervisorId | Q — ID Superior | Identificador |
| supervisor | R — Nome Superior | Supervisor |
| lead | T — Nome Encarregado | Encarregado |
| module | U — Módulo | Escopo de acesso |
| process | V — Processo Principal | Processo |

**Não retornados:** Contato, CPF, Nascimento, Armário, Escaninho. A aba `Dados` fornece somente `L1` como data de referência. Nenhuma outra aba faz parte da integração inicial.

## Segredos e superfícies

- Cloudflare Secrets: `APPS_SCRIPT_URL`, `APPS_SCRIPT_GATEWAY_TOKEN`, `APP_SESSION_SECRET`.
- Google Apps Script Script Properties: `SPREADSHEET_ID`, `GATEWAY_TOKEN`, `AUTH_PASSWORD_PEPPER`; temporariamente `AUTH_PENDING_EMAIL`, `AUTH_PENDING_PASSWORD` apenas durante provisionamento.
- Navegador recebe exclusivamente cookie de sessão HttpOnly e payload já filtrado, nunca token do gateway.

A planilha deve ter acesso restrito porque armazena hashes de senha. O algoritmo inicial de hash segue a implementação operacional do Extra Cost (2.048 rodadas de SHA-256 com salt e pepper), mas não equivale a Argon2id/scrypt/PBKDF2 com custo recomendado; rever antes de ampliação de usuários.

## Pendências de governança

Origem definitiva para afastamentos e desligamentos (`Cadastros` vs `Senior`), tratamento de matrículas duplicadas, autorização entre galpões G6/G9, definição de HC vendido/realizado, regramento de exportação, limites de login, auditoria e retenção de dados.
