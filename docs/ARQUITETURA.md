# Arquitetura e limites

## Fluxo de dados

```text
Navegador (React + PrimeReact)
  └─ Supabase Auth (sessão individual)
       └─ GET /api/bootstrap [Cloudflare Pages Function]
            ├─ valida token em /auth/v1/user do Supabase
            ├─ consulta headcount_access sob RLS e perfil do usuário
            └─ POST Apps Script [segredo exclusivo do servidor]
                  └─ planilha COLABORADORES G5 / Cadastros [somente leitura]
                      └─ dados mínimos normalizados (sem CPF, telefone ou nascimento)
```

A **segurança está no servidor**. A tela pode esconder controles, mas não define quais colaboradores o usuário pode receber. Cada requisição ao gateway exige sessão e autorização atuais.

## Camadas

- `src/pages`: composição de visualizações e interações.
- `src/ui`: linguagem visual comum; tokens de cor em `styles.css`.
- `src/lib/metrics.ts`: indicadores puros e testáveis.
- `src/types.ts`: contrato explícito da API.
- `src/lib/auth.ts` e `src/lib/api.ts`: adaptação do navegador.
- `functions/api/bootstrap.ts`: autorização e filtro por módulos.
- `apps-script/HeadcountApi.gs`: leitura e minimização dos dados.
- `supabase/migrations`: tabela isolada de autorizações; não afeta projetos anteriores automaticamente.

## Contrato inicial da aba Cadastros

| Campo API | Coluna | Interpretação |
|---|---|---|
| id | G — Cadastro | Matrícula; chave de unicidade provisória |
| name | A — Nome | Nome funcional |
| role | E — Título Reduzido (Cargo) | Cargo |
| area | F — Área funcional | Área |
| admission | H — Admissão | Data (formato exibido pela planilha) |
| costCenter | M — C.C | Centro de custo da aba Cadastros |
| status | N — Status | Texto tal como cadastrado |
| client | O — Alocação | Alocação / depositante |
| shift | P — Horário | Escala ou horário declarado |
| supervisorId | Q — ID Superior | ID do superior |
| supervisor | R — Nome Superior | Nome do superior |
| lead | T — Nome Encarregado | Nome do encarregado |
| module | U — Módulo | Escopo potencial de autorização |
| process | V — Processo Principal | Processo operacional |

`B — Contato`, `C — CPF`, `D — Nascimento`, armários e escaninhos não saem da ponte. `Senior`, `Geral Escaninho`, `Vestiários` e `Listas` não entram na API inicial. A aba `Dados` fornece apenas data de atualização.

## Decisões pendentes

- Fonte de verdade para vínculo, afastamento e desligamento: `Cadastros` versus `Senior`.
- Critérios de HC contratado, HC realizado, vacância e mobilidade (não implementados).
- Tratamento de matrículas duplicadas e sem matrícula, atualmente excluídas e contabilizadas em qualidade.
- Consolidação e autorização intergalpões G6/G9, alocação e centro de custo.
- Políticas de retenção, auditoria, exportação e classificação da informação.

## Alerta de segurança

O modo demo só funciona quando `import.meta.env.DEV` e `VITE_DEMO_MODE=true`; uma build de produção não deve oferecer acesso anônimo. A aplicação contém informação pessoal identificável quando integrada: use repositório privado se a equipe decidir incluir documentação interna adicional, valide permissões e não publique dados reais.
