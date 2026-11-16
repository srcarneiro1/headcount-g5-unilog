# Instruções de continuidade · Claude / colaboradores

Projeto: `srcarneiro1/headcount-g5-unilog`.

## Objetivo
Desenvolver o Headcount G5 como produto independente. Extra Cost Control fornece **referência visual**, não arquitetura a copiar. BI Logístico V2 serve apenas de histórico de escolhas tecnológicas, **não de base de código**. Preserve a separação entre apresentação, regras de negócio e integração de dados. Não inclua nenhuma função da catraca.

## Situação atual
- Scaffold React/TypeScript/Vite/PrimeReact com telas de headcount e demo sintética.
- Fonte real planejada: Google Sheets `COLABORADORES G5`, aba `Cadastros`.
- Gateway `/api/bootstrap` autentica no Supabase, consulta autorização com RLS e consome Apps Script via segredo no servidor.
- A aplicação está em **modo consulta**. Não habilitar criação/edição/exclusão sem definição expressa das regras de governança.
- Não houve homologação do `npm install`, build e deploy neste ambiente. Primeira tarefa técnica: verificar e corrigir build, testes e tipagens, e versionar `package-lock.json`.

## Invariantes
1. Não versionar dados reais, CPF, nascimento, telefone, senhas, tokens, chaves, exports de colaboradores ou `.env`.
2. Nunca expor `HEADCOUNT_API_TOKEN` no frontend nem chamar Apps Script diretamente pelo navegador.
3. Recusar dados sem sessão Supabase válida e `headcount_access.active=true`; acesso por módulos deve ser explícito.
4. Não equiparar todas as situações que não são `Trabalhando` a desligamento; evitar inferências não definidas pela gestão.
5. Manter testes para `metrics.ts` e acrescentar testes de autorização/transformação no backend.
6. Preservar a planilha original sem alterações e sem criar escrita na ponte.
7. Não modificar os repositórios `bi-logistico-v2` e `extra-cost-control-unilog`.
8. Antes de publicar, conferir regras de RH, autorização, coleta mínima de dados, responsividade, acessibilidade e segurança.

## Próximas melhorias prioritárias
- Validar npm install/build/test em Node 22 e gerar lockfile.
- Refatorar `src/App.tsx` e `src/ui/common.tsx` se crescerem, extraindo shell e componentes especializados.
- Testar a ponte do Apps Script contra implantação real, inclusive redirecionamentos, falhas e cotas.
- Implementar paginação mobile verdadeira e virtualização para bases grandes.
- Ampliar validações de registros duplicados e conciliar status com a aba `Senior` **somente após definir precedência**.
- Definir especificação dos indicadores: HC contratado/realizado, vagas, corte por competência, movimentações e desligamentos, se houver fontes confiáveis.
- Desenvolver testes de integração, observabilidade sem PII e proteção contra abuso.

## Critério de aceite
A versão não estará pronta para uso operacional até passar em `npm test`, `npm run build`, validação de acesso 401/403, comparação de indicadores com a planilha, testes de não exposição de PII e aceite do responsável pelo processo.
