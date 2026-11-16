import {readFileSync} from 'node:fs'
import {describe, expect, it} from 'vitest'

// Valida TODAS as expressões de e-mail do Apps Script (login, leitura do usuário e provisionamento), lidas direto do
// arquivo .gs. Protege contra a regressão de 16/11/2026: na linha do provisionamento, barras invertidas duplicadas
// faziam a expressão exigir uma barra literal e recusar todo e-mail válido ("AUTH_PENDING_EMAIL não contém um e-mail
// válido."). Atenção: há mais de uma ocorrência — testar só a primeira escondia o defeito.
const fonte = readFileSync(new URL('./HeadcountApi.gs', import.meta.url), 'utf8')
const ocorrencias = [...fonte.matchAll(/if\(!(\/\^[^\n]*?\$\/)\.test\(email\)[^\n]*?new Error\('([^']+)'\)/g)]
  .map(m => ({mensagem: m[2], regex: new Function(`return ${m[1]}`)() as RegExp}))

describe('validações de e-mail do Apps Script', () => {
  it('encontra as três validações (login, usuário e provisionamento)', () => {
    expect(ocorrencias.map(o => o.mensagem)).toEqual([
      'Credenciais inválidas',
      'Usuário inválido',
      'AUTH_PENDING_EMAIL não contém um e-mail válido.',
    ])
  })
  for (const {mensagem, regex} of ocorrencias) {
    it.each(['ana@unilog.com.br', 'joao.silva@exemplo.com', 'a@b.co'])(`[${mensagem}] aceita e-mail válido: %s`, email => {
      expect(regex.test(email)).toBe(true)
    })
    it.each(['sem-arroba', 'nome@semponto', 'espaco no@exemplo.com', '@exemplo.com', ''])(`[${mensagem}] recusa e-mail inválido: %s`, email => {
      expect(regex.test(email)).toBe(false)
    })
  }
})
