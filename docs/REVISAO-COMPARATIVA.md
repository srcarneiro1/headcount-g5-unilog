# Revisão comparativa — Headcount G5 × Extra Cost Control (16/11/2026)

Escopo confirmado: **sem** Horas a Pagar, Catraca e Calendário (ficam no BI até haver fonte de dados). O app cobre
Funcionários (visão geral, colaboradores, distribuições), Supervisão e Organograma.

## Proteções de tela trazidas do Extra (src/brand/estabilidade.css)
| Problema | Causa no Headcount | Correção (origem no Extra) |
|---|---|---|
| Bordas brancas ao puxar a tela | `html` sem fundo e rolagem elástica livre | `overscroll-behavior-y: none` em html/body + fundo da página no html (commit 93ebb1b) |
| Tela ampliada/deslocada ao tocar num campo no iPhone | campos com 12 px | 16 px nos campos até 760 px (ios-input-zoom.css) |
| Página arrastando para o lado | conteúdo largo sem contenção | `overflow-x: clip` no conteúdo; tabelas rolam dentro do quadro com rolagem contida |
| Menu e listas "puxando" a página | sem contenção | `overscroll-behavior: contain` no menu, listas e diálogos |
| Realce azul ao tocar | padrão do navegador | `-webkit-tap-highlight-color: transparent` (next-shell.css) |
| E-mail/nomes longos estourando | sem quebra | reticências na identidade; quebra em títulos e cartões |
| Altura errada no celular | `100vh` | `100dvh` no app e no login |
| Botão de fechar o menu sobre o nome | sem espaço reservado | espaço de 60 px; nome em uma linha no celular |

Verificação: 5 telas × 5 larguras (360, 390, 768, 1024, 1440) — sem rolagem lateral, overscroll desligado, html
com fundo, campos ≥ 16 px no celular; menu aberto contido; login estável.

## Pontos já equivalentes ao Extra (sem mudança)
- Gateway: só aceita o endereço do Apps Script e redirecionamentos para hosts do Google; tempo limite de 20 s;
  respostas sem cache.
- Sessão: cookie `HttpOnly`, `Secure`, `SameSite=Lax`; autorização revalidada na planilha a cada leitura.
- Cabeçalhos de segurança (`public/_headers`): iguais aos do Extra, com HSTS a mais.

## Arquivos ocultos (ponto) — atenção na subida pelo GitHub web
- `.gitignore`: passa a ignorar `*.tsbuildinfo` (gerado pelo build), `*.pem`, `*.key` e `.clasprc.json`.
- `.github/workflows/ci.yml` e `.dev.vars.example`: sem mudança.
- Nunca versionar `.dev.vars` (segredos locais) nem `package-lock.json` enquanto o README não decidir adotá-lo.
