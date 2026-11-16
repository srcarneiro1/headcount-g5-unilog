# Headcount G5 · UNILOG

Base independente para consulta e análise do headcount G5, com identidade visual inspirada no Extra Cost Control e arquitetura adaptada ao problema de gestão de pessoas. **Não é um fork do BI Logístico.**

> **Estado:** scaffold de desenvolvimento. Ainda não é uma aplicação publicada ou homologada. Os dados exibidos pelo modo de demonstração são inteiramente fictícios. Nenhum registro real de colaboradores integra este repositório.

## Escopo inicial

- Visão geral: efetivo, pessoas trabalhando, demais situações, admissões do mês, alocações e consistência cadastral.
- Colaboradores: listagem, pesquisa, filtros e situação funcional.
- Supervisão: equipes e distribuição por liderança, sem assumir um centro de custo exclusivo por supervisor.
- Distribuições: cliente, cargo, módulo, turno, centro de custo e tempo de casa.
- Organograma: representação **indicativa** baseada em supervisor e encarregado informados.

**Fora do escopo:** catraca; controle de acesso físico; folha de pagamento; edição de cadastros na planilha. Os módulos de escaninhos e vestiários podem ser considerados no futuro, mas não foram incluídos nesta entrega.

## Como executar

Requisitos: Node.js 22+, npm.

```bash
npm install
npm run dev:demo
```

Abra `http://localhost:5173`. `dev:demo` exibe uma amostra sintética e não acessa a planilha. Para testar o modo autenticado, configure `.env` e use `npm run dev`. A API real (`/api/bootstrap`) exige Cloudflare Pages Functions; para simular o ambiente local completo, use o comando `npm run build` seguido de `npm run pages:dev`.

**Scripts:** `npm run dev`, `npm run dev:demo`, `npm run test`, `npm run build`, `npm run pages:dev`.

Não existe `package-lock.json` porque o ambiente de geração não teve acesso ao registro npm. Execute `npm install` e versione o lockfile gerado antes de substituir o comando da CI por `npm ci`. O código ainda requer testes de instalação/build em ambiente com conectividade.

## Tecnologias

React, TypeScript, Vite, React Router, PrimeReact, Chart.js, Cloudflare Pages Functions, Supabase Auth e Google Apps Script como ponte **somente de leitura** do Google Sheets. Componentes visuais seguem a linguagem cromática do Extra Cost; nenhuma regra interna do BI foi copiada.

## Organização

```text
src/
  App.tsx               # Shell, autenticação visual e rotas
  pages/                # Telas independentes
  ui/common.tsx         # Cards, filtros e gráficos compartilhados
  lib/metrics.ts        # Regras puras de métricas
  lib/metrics.test.ts   # Testes das regras
  lib/auth.ts           # Cliente Supabase
  lib/api.ts            # Cliente HTTP /api/bootstrap
  data/demo.ts          # Amostra fictícia
  types.ts              # Tipagem do contrato
functions/api/bootstrap.ts  # Gateway de autenticação e autorização
apps-script/HeadcountApi.gs  # Leitura protegida da planilha
supabase/migrations/        # Tabela e política de acesso isolada
docs/                       # Arquitetura, decisões e transição
.github/workflows/ci.yml    # Testes e build no GitHub Actions
```

## Fonte de dados

A origem prevista é a planilha **COLABORADORES G5**, aba **Cadastros** (22 colunas). O Apps Script utiliza somente campos úteis ao headcount: matrícula, nome, cargo, área, admissão, centro de custo, situação, alocação, horário/turno, supervisor, encarregado, módulo e processo. **CPF, telefone, nascimento e outras informações não são retornadas pela API.** A ponte faz leitura das colunas da aba para construir o payload sanitizado; ela não grava ou altera células.

A coluna **Status** contém valores como `Trabalhando`, `Afastado`, `Auxílio Doença`, `Verificar` e `Tarefa Sumiço`. O KPI de pessoas trabalhando conta apenas `Trabalhando`. As demais situações ficam agrupadas, **não são interpretadas automaticamente como desligamento**. A aba `Senior` poderá apoiar conciliação futura, mas não é usada para sobrescrever dados nesta fase.

## Configuração real (sem expor segredos)

1. Configure um projeto Supabase Auth, preferencialmente com inscrição pública desabilitada, e registre os usuários autorizados.
2. Execute **depois de revisar** `supabase/migrations/001_headcount_access.sql` no SQL Editor do projeto Supabase. Crie autorizações explícitas por usuário; `active` é `false` por padrão.
3. Preencha as variáveis públicas de `.env.example` num arquivo `.env` **local**, sem versioná-lo.
4. Crie um projeto Apps Script separado, com o conteúdo de `apps-script/HeadcountApi.gs`. Nas *Script Properties*, configure `SPREADSHEET_ID` e `HEADCOUNT_API_TOKEN` aleatório e longo. Publique como Web App, executado pelo proprietário e acessível pela ponte.
5. No Cloudflare Pages, configure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `HEADCOUNT_API_URL` e `HEADCOUNT_API_TOKEN` como variáveis/segredos do ambiente de Functions. **O token da ponte nunca deve ter prefixo `VITE_`.** Defina output build `dist` e função sob `/api/bootstrap`.
6. Autorize usuários na tabela `headcount_access`. A propriedade `modules` deve conter módulos explícitos (ex.: `M04`, `M05`) ou `*` para acesso a todos. Vetor vazio implica acesso negado.
7. Faça deploy de **Preview** e verifique 401 sem sessão, 403 sem autorização, filtragem por módulos, CSV e visualização mobile antes de publicar produção.

O método inicial de integração por Apps Script deve passar por revisão de segurança e limites de uso antes de operação corporativa. A autenticação da tela não substitui a autorização do endpoint.

## Continuidade

Leia [CLAUDE.md](CLAUDE.md) e [docs/ARQUITETURA.md](docs/ARQUITETURA.md) antes de alterar o projeto. Mudanças devem preservar o isolamento do BI Logístico e Extra Cost, sem alterações nos repositórios de origem.
