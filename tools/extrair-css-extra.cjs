// Extrai do CSS COMPILADO do Extra Cost as regras das classes usadas pelo Headcount (menu, topo, login, cartões),
// preservando @media/@supports, e as variáveis CSS de que elas dependem (resolvidas recursivamente).
const fs = require('fs'), path = require('path')
const postcss = require(require.resolve('postcss', { paths: [process.argv[3] || '.'] }))
// Uso: node tools/extrair-css-extra.cjs <saída.css> <pasta do Extra com node_modules> (após npm run build no Extra)
const dir = path.join(process.argv[3] || '.', 'dist/_next/static/css')
const css = fs.readdirSync(dir).filter(f => f.endsWith('.css')).map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n')
const root = postcss.parse(css)
const prefixos = ['nx-app','nx-sidebar','nx-navigation','nx-nav-','nx-admin-group','nx-user-','nx-avatar','nx-icon-button','nx-desktop-collapse',
  'nx-mobile-close','nx-mobile-menu','nx-workspace','nx-topbar','nx-gateway-state','nx-scope-chip','nx-login','nx-brand-copy','nx-brand-topline',
  'nx-accent','nx-overline','nx-product-chip','nx-field-icon','nx-password','nx-primary-button','dashboard-page-heading','ui-eyebrow',
  'dashboard-metric','nx-dashboard-metric-card','dashboard-metrics-grid','nx-content',
  // Tela Usuários: notificação, carregamento (esqueleto), estado vazio, erro no formulário e barra da tabela.
  'nx-prime-notice','ui-skeleton','nx-prime-skeleton','ui-empty-state','nx-prime-empty','nx-inline-error','nx-table-toolbar','nx-table-search','nx-table-count']
const classeAlvo = new RegExp('\\.(' + prefixos.map(p => p.replace(/[-]/g, '\\-')).join('|') + ')')
// Seletores que mexem em componentes globais fora do escopo (evita alterar telas que não pedimos).
const fora = /\.nx-app\s+\.(p-datatable|p-dropdown|p-inputtext|p-button|p-card|p-tag|p-paginator)/
const saida = postcss.root()
let regras = 0
root.walkRules(rule => {
  const seletores = rule.selectors.filter(s => classeAlvo.test(s) && !fora.test(s))
  if (!seletores.length) return
  const nova = rule.clone({ selectors: seletores })
  // Reconstrói os @media/@supports que envolvem a regra.
  let alvo = nova, pai = rule.parent
  while (pai && pai.type === 'atrule') { const at = pai.clone({ nodes: [] }); at.append(alvo); alvo = at; pai = pai.parent }
  saida.append(alvo); regras++
})
// Variáveis usadas, resolvidas recursivamente a partir das declarações de :root/html/body do Extra.
const defs = {}
root.walkDecls(d => { if (d.prop.startsWith('--') && d.parent.type === 'rule' && /(^|,)\s*(:root|html|body)\s*($|,)/.test(d.parent.selector)) defs[d.prop] = d.value })
const usadas = new Set(), fila = [...saida.toString().matchAll(/var\((--[\w-]+)/g)].map(m => m[1])
while (fila.length) { const v = fila.pop(); if (usadas.has(v)) continue; usadas.add(v); for (const m of (defs[v] || '').matchAll(/var\((--[\w-]+)/g)) fila.push(m[1]) }
const vars = [...usadas].filter(v => defs[v]).sort().map(v => `  ${v}: ${defs[v]};`).join('\n')
const semDef = [...usadas].filter(v => !defs[v])
const cabecalho = `/* GERADO a partir do CSS compilado do Extra Cost Control (srcarneiro1/extra-cost-control-unilog) por
   tools/extrair-css-extra.cjs — menu lateral, barra superior, login, cabeçalho de página, cartões de indicadores, notificações, carregamento e estado vazio.
   Não editar à mão: ajustes do Headcount ficam em src/brand/shell.css. */\n:root {\n${vars}\n}\n`
fs.writeFileSync(process.argv[2], cabecalho + saida.toString() + '\n')
console.log(JSON.stringify({ regras, variaveis: usadas.size, semDefinicao: semDef }))
