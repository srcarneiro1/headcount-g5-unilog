# Headcount G5 · UNILOG

Painel independente para consulta e análise do quadro G5. Visual inspirado no **Extra Cost Control**; código organizado especificamente para headcount. **Sem banco externo**: a origem operacional e os usuários ficam na planilha Google Sheets `COLABORADORES G5`.

> Base de desenvolvimento, não homologada em produção. O modo de demonstração usa somente registros fictícios. Nenhuma pessoa real, senha, hash ou token está no repositório.

## Arquitetura

```text
Navegador (React / PrimeReact, cookie de sessão HttpOnly)
   ↓
Cloudflare Pages Functions (login, sessão JWT, API)
   ↓ token do gateway exclusivo do servidor
Google Apps Script (autenticação, perfis, filtragem por módulo)
   ↓
Google Sheets · COLABORADORES G5
  ├─ Cadastros (fonte de colaboradores, somente leitura)
  ├─ Dados (data de atualização)
  └─ CAD_USUARIOS (controle de acesso e hashes de senhas)
```

O gateway só envia dados depois do login. O Apps Script revalida `ATIVO`, `PERFIL` e `MODULOS` da conta em cada consulta. **Nunca** coloque a URL/token do Apps Script no React nem publique a planilha na internet.

## Telas

Visão geral, Colaboradores, Supervisão, Distribuições e Organograma indicativo. **Sem catraca.** A planilha de colaboradores não é editada pelo painel nesta versão; a autenticação tem um fluxo separado e controlado de provisionamento/troca de senha.

## Executar localmente

Node.js 22+ e npm:

```bash
npm install
npm run dev:demo
```

Abre `http://localhost:5173`, com registros fictícios e sem acesso à planilha.

Para simular a aplicação integrada ao gateway Cloudflare, configure o arquivo **local** `.dev.vars` com base em `.dev.vars.example`, execute `npm run build` e `npm run pages:dev` (porta indicada pelo Wrangler). Não versione `.dev.vars`.

Validação:

```bash
npm test
npm run build
```

O tema visual PrimeReact é gerado no `prebuild`/`predev` e não deve ser versionado. A CI GitHub Actions executa instalação, testes e build. Não existe `package-lock.json` no scaffold inicial; gerar e versionar antes de substituir `npm install` por `npm ci`.

## Implantação no Cloudflare Pages

Conecte `srcarneiro1/headcount-g5-unilog` usando Git integration. Configure:

| Campo | Valor |
| --- | --- |
| Production branch | `main` |
| Framework | React (Vite) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | raiz do repositório |
| NODE_VERSION | `22` |

Configure os **três segredos** em *Workers & Pages → projeto → Settings → Variables and Secrets*, em Production e nos Previews que precisam acessar a integração. A mudança de segredo exige nova publicação:

| Secret | Conteúdo |
| --- | --- |
| `APPS_SCRIPT_URL` | URL da implantação `/exec` do Apps Script isolado de Headcount |
| `APPS_SCRIPT_GATEWAY_TOKEN` | token longo, exclusivo deste projeto, igual à Script Property `GATEWAY_TOKEN` |
| `APP_SESSION_SECRET` | segredo independente com pelo menos 32 caracteres aleatórios, assina cookies JWT no Cloudflare |

**Nenhuma variável `VITE_SUPABASE_*` ou serviço de banco é usado.** A interface é publicada mesmo sem os segredos; o login apenas retorna erro de configuração até que a ponte exista.

## Configurar o Apps Script e os usuários

1. Crie um projeto Apps Script novo, cole `apps-script/HeadcountApi.gs`, sem alterar o Apps Script do Extra Cost.
2. Em *Project Settings → Script properties*, configure `SPREADSHEET_ID` com o ID de `COLABORADORES G5` e `GATEWAY_TOKEN` com o mesmo valor do segredo `APPS_SCRIPT_GATEWAY_TOKEN` do Cloudflare.
3. Execute manualmente `setupHeadcountAuthSheet()` **somente depois de autorizar a criação da aba** `CAD_USUARIOS`. A função cria a aba de usuários (se não existir) e o segredo `AUTH_PASSWORD_PEPPER` em Script Properties; não altera `Cadastros`.
4. Preencha manualmente uma linha em `CAD_USUARIOS`, com `EMAIL`, `NOME`, `PERFIL` (`OWNER`, `ADMIN` ou `VISUALIZADOR`), `MODULOS` (`*` ou `M04;M05`) e `ATIVO` (`SIM`). Deixe `SENHA_HASH`/`SALT` vazios inicialmente. O perfil sem módulos não tem acesso.
5. Temporariamente em *Script properties*, configure `AUTH_PENDING_EMAIL` e `AUTH_PENDING_PASSWORD` (senha forte de 10+ caracteres). Execute `applyPendingUserPassword()`. A função grava somente o hash com salt na aba, exige alteração da senha no primeiro login e apaga as propriedades temporárias, mesmo em caso de falha.
6. Publique *Deploy → New deployment → Web app* executando como proprietário. O Web App precisa aceitar chamadas do gateway; o acesso não depende do login Google do usuário final, e o segredo é validado a cada chamada.
7. Copie a URL `/exec` para o segredo `APPS_SCRIPT_URL` no Cloudflare. Faça um novo deploy.

A aba `CAD_USUARIOS` contém hashes de senhas e permissões: restrinja o acesso de edição e visualização da planilha. Esse esquema segue o fluxo atual do Extra Cost, cujo hash iterativo de SHA-256 com pepper merece revisão para uma KDF de senha moderna antes de uso ampliado. Também devem ser definidos limites de tentativas de login no Cloudflare.

## Homologação obrigatória

- Sem sessão: `/api/bootstrap` retorna 401.
- Usuário inativo ou sem módulos: autenticação negada ou leitura 403.
- Perfil limitado a `M04`: nenhum colaborador de outro módulo no retorno.
- CPF, telefone e nascimento nunca são retornados pela API.
- Atualização dos indicadores confere com a aba `Cadastros` para o mesmo recorte.
- Troca obrigatória de senha no primeiro acesso, logout e expiração de sessão funcionam.
- Cloudflare Preview protegido antes de habilitar usuários reais em produção.

Consulte [docs/ARQUITETURA.md](docs/ARQUITETURA.md), [docs/INTEGRACAO.md](docs/INTEGRACAO.md) e [CLAUDE.md](CLAUDE.md) para desenvolvimento no Claude.
