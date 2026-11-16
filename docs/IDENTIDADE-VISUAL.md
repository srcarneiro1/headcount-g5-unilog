# Identidade visual — Manual de Marca Unilog 2026 (Revisão 2)

> Aplicada no Headcount G5 com os mesmos arquivos do Extra Cost Control (`src/brand/`, `public/brand/`, `public/fonts/`). Ajustes finos em `src/brand/shell.css`.

Mesma linguagem visual aplicada no Extra Cost Control (família Unilog). Arquivos prontos neste kit:
- `public/brand/` — logos **oficiais** (vetor): branco com e sem ®, colorido com e sem ®, favicon.
- `public/fonts/` — **Roboto** 300/400/700/900 em woff2 (subconjunto latino, ~21 KB cada),
  hospedada no próprio app (sem Google Fonts).
- `src/brand/brand.css` — `@font-face`, tokens de cor e o estilo do fundo animado.
- `src/brand/BrandBackdrop.tsx` — fundo animado (ícones de logística flutuando), decorativo.

## Tokens
| Token | Valor | Uso |
|---|---|---|
| `--unilog-cinza` | `#494a56` | texto principal, barra lateral, fundos escuros |
| `--unilog-cinza-80` | `#6d6e78` | texto secundário |
| `--unilog-cinza-60` | `#92929a` | texto auxiliar, ícones inativos |
| `--unilog-cinza-40` | `#b6b7bb` | bordas de campos |
| `--unilog-cinza-20` | `#dbdbdd` | bordas e divisórias |
| `--unilog-cinza-10` | `#ededee` | fundo da página, "em andamento" |
| `--unilog-vermelho` | `#db0812` | ação principal, destaque, "atenção" |
| `--unilog-vermelho-hover` | `#b00610` | hover e texto vermelho sobre claro |
| `--unilog-vermelho-10` | `#fbe6e7` | fundo de seleção e alertas |
Status: concluído/atendido em verde suave (`#3f7c59` texto, `#edf8f2` fundo); pendência/atenção em âmbar suave
(`#a87900`, `#fff7e8`); erro/atenção crítica no vermelho oficial. Azul e roxo **não** são usados.

## Regras
- **Fonte**: Roboto em tudo (Bold títulos, Regular/Light corpo, Black números de destaque). Nada de Inter.
- **Logo**: só os SVG oficiais. Abaixo de 120 px de largura use a versão **sem ®**; mínimo 64 px.
- **Cantos**: botões e campos 6 px; cartões 8 px; pílulas 999 px.
- **Texto vermelho sobre o Cinza UNILOG não é permitido** (contraste); destaque com sublinhado vermelho.
- **Sem degradês**; fundos escuros lisos em `#494a56`.
- **Alertas**: fundo vermelho 10 + barra lateral vermelha de 4 px.
- **Login**: fundo Cinza UNILOG com `BrandBackdrop`, logo branco com ®, título com linha vermelha antes
  ("— RETRABALHO CONTROLE"), cartão branco, botão "Entrar com Keycloak" vermelho, rodapé
  "© {ano} Unilog Express. Todos os direitos reservados.". Respeitar `prefers-reduced-motion`.
- **Barra lateral**: Cinza UNILOG, item ativo com marcador vermelho; barra do navegador (`themeColor`) `#494a56`.
- **Componentes PrimeReact** (se usados): trocar as cores de severidade do tema (info/azul e help/roxo → cinza;
  danger → `#db0812`; success/warning → tons suaves acima).
- **Acessibilidade**: contraste AA, foco visível (contorno vermelho translúcido), campos de 16 px no celular
  (evita zoom do iOS).
