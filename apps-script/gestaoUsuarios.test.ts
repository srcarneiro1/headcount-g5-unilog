import {readFileSync} from 'node:fs'
import {createHash, randomUUID} from 'node:crypto'
import vm from 'node:vm'
import {beforeEach, describe, expect, it} from 'vitest'

/**
 * Executa o PRÓPRIO HeadcountApi.gs (sem cópia) com dublês mínimos das APIs do Google: planilha em memória,
 * propriedades, SHA-256 (bytes com sinal, como o Utilities), UUID, trava e ContentService.
 */
const HEADERS = ['EMAIL', 'NOME', 'SENHA_HASH', 'SALT', 'PERFIL', 'MODULOS', 'ATIVO', 'EXIGE_TROCA_SENHA', 'ULTIMA_ALTERACAO']
type Celula = string | Date

function ambiente() {
  const linhas: Celula[][] = [HEADERS.slice()]
  const props: Record<string, string> = {SPREADSHEET_ID: 'planilha', GATEWAY_TOKEN: 'token-gateway', AUTH_PASSWORD_PEPPER: 'p'.repeat(40)}
  const exibir = (v: Celula | undefined) => (v instanceof Date ? v.toISOString() : String(v ?? ''))
  const aba = {
    getLastRow: () => linhas.length,
    getRange: (row: number, col: number, nr = 1, nc = 1) => {
      const bloco = () => Array.from({length: nr}, (_, i) => Array.from({length: nc}, (_, j) => linhas[row - 1 + i]?.[col - 1 + j] ?? ''))
      const r = {
        getDisplayValues: () => bloco().map(l => l.map(exibir)),
        getValues: () => bloco(),
        setValues: (vals: Celula[][]) => { vals.forEach((l, i) => l.forEach((v, j) => { while (linhas.length < row + i) linhas.push(Array(HEADERS.length).fill('')); linhas[row - 1 + i][col - 1 + j] = v })); return r },
        setValue: (v: Celula) => r.setValues([[v]]),
        setNumberFormat: () => r,
      }
      return r
    },
  }
  const ctx: Record<string, unknown> = {
    console,
    PropertiesService: {getScriptProperties: () => ({getProperty: (k: string) => props[k] ?? null, setProperty: (k: string, v: string) => { props[k] = v }, deleteProperty: (k: string) => { delete props[k] }})},
    SpreadsheetApp: {openById: () => ({getSheetByName: (n: string) => (n === 'CAD_USUARIOS' ? aba : null)})},
    Utilities: {
      DigestAlgorithm: {SHA_256: 'sha256'}, Charset: {UTF_8: 'utf8'},
      computeDigest: (_a: string, valor: string) => [...createHash('sha256').update(valor, 'utf8').digest()].map(b => (b > 127 ? b - 256 : b)),
      getUuid: () => randomUUID(),
    },
    LockService: {getScriptLock: () => ({waitLock: () => undefined, releaseLock: () => undefined})},
    ContentService: {MimeType: {JSON: 'json'}, createTextOutput: (t: string) => ({setMimeType: () => JSON.parse(t)})},
  }
  vm.createContext(ctx)
  vm.runInContext(readFileSync(new URL('./HeadcountApi.gs', import.meta.url), 'utf8'), ctx)
  const post = (body: Record<string, unknown>) => (ctx.doPost as (e: unknown) => {ok: boolean; data?: any; error?: string})({postData: {contents: JSON.stringify({token: 'token-gateway', ...body})}})
  const semente = (email: string, perfil: string, senha: string, extra: Partial<Record<string, string>> = {}) => {
    const salt = 's'.repeat(64)
    const hash = (ctx.hcHash_ as (p: string, s: string) => string)(senha, salt)
    linhas.push([email, extra.nome ?? email, hash, salt, perfil, extra.modulos ?? '*', extra.ativo ?? 'SIM', 'NAO', ''])
  }
  return {linhas, post, semente}
}

describe('gestão de usuários (Apps Script)', () => {
  let a: ReturnType<typeof ambiente>
  beforeEach(() => {
    a = ambiente()
    a.semente('dona@unilog.com.br', 'OWNER', 'senha-da-dona-123')
    a.semente('admin@unilog.com.br', 'ADMIN', 'senha-do-admin-123', {modulos: 'M04'})
    a.semente('leitor@unilog.com.br', 'VISUALIZADOR', 'senha-do-leitor-1', {modulos: 'M04'})
  })

  it('lista sem expor hash nem salt', () => {
    const r = a.post({action: 'USERS_LIST', actorEmail: 'dona@unilog.com.br'})
    expect(r.ok).toBe(true)
    expect(r.data).toHaveLength(3)
    expect(Object.keys(r.data[0]).sort()).toEqual(['ativo', 'email', 'exigeTrocaSenha', 'modulos', 'nome', 'perfil', 'senhaConfigurada', 'ultimaAlteracao'])
  })

  it('primeiro acesso completo: cria com senha temporária → login exige troca → troca → entra com a nova', () => {
    const c = a.post({action: 'USER_SAVE', actorEmail: 'admin@unilog.com.br', novo: true, email: 'Nova.Pessoa@Unilog.com.br', nome: 'Nova Pessoa',
      perfil: 'VISUALIZADOR', modulos: ['M04', 'M05'], ativo: true, password: 'Temporaria-2026'})
    expect(c.ok).toBe(true)
    expect(c.data).toMatchObject({email: 'nova.pessoa@unilog.com.br', modulos: ['M04', 'M05'], senhaConfigurada: true, exigeTrocaSenha: true})
    const linha = a.linhas.find(l => l[0] === 'nova.pessoa@unilog.com.br')!
    expect(linha[2]).not.toContain('Temporaria') // só o hash fica na planilha
    expect(a.post({action: 'LOGIN', email: 'nova.pessoa@unilog.com.br', password: 'Temporaria-2026'}).data.exigeTrocaSenha).toBe(true)
    expect(a.post({action: 'LOGIN', email: 'nova.pessoa@unilog.com.br', password: 'Temporaria-2026', newPassword: 'Minha-Senha-Nova-1'}).data.exigeTrocaSenha).toBe(false)
    expect(a.post({action: 'LOGIN', email: 'nova.pessoa@unilog.com.br', password: 'Minha-Senha-Nova-1'}).data.exigeTrocaSenha).toBe(false)
    expect(a.post({action: 'LOGIN', email: 'nova.pessoa@unilog.com.br', password: 'Temporaria-2026'}).ok).toBe(false)
  })

  it('redefinir senha volta a exigir a troca e invalida a senha antiga', () => {
    const r = a.post({action: 'USER_RESET_PASSWORD', actorEmail: 'admin@unilog.com.br', email: 'leitor@unilog.com.br', password: 'Redefinida-2026'})
    expect(r.data.exigeTrocaSenha).toBe(true)
    expect(a.post({action: 'LOGIN', email: 'leitor@unilog.com.br', password: 'senha-do-leitor-1'}).ok).toBe(false)
    expect(a.post({action: 'LOGIN', email: 'leitor@unilog.com.br', password: 'Redefinida-2026'}).data.exigeTrocaSenha).toBe(true)
  })

  it('edita nome, perfil, módulos e situação', () => {
    const r = a.post({action: 'USER_SAVE', actorEmail: 'dona@unilog.com.br', email: 'leitor@unilog.com.br', nome: 'Leitor Renomeado', perfil: 'ADMIN', modulos: ['*'], ativo: false})
    expect(r.data).toMatchObject({nome: 'Leitor Renomeado', perfil: 'ADMIN', modulos: ['*'], ativo: false})
  })

  const recusas: [string, Record<string, unknown>, string][] = [
    ['visualizador não gerencia', {action: 'USERS_LIST', actorEmail: 'leitor@unilog.com.br'}, 'Somente OWNER e ADMIN gerenciam usuários.'],
    ['ADMIN não cria OWNER', {action: 'USER_SAVE', actorEmail: 'admin@unilog.com.br', novo: true, email: 'x@unilog.com.br', nome: 'X', perfil: 'OWNER', modulos: ['*'], password: 'Temporaria-2026'}, 'Somente um OWNER pode cadastrar ou promover outro OWNER.'],
    ['ADMIN não altera OWNER', {action: 'USER_SAVE', actorEmail: 'admin@unilog.com.br', email: 'dona@unilog.com.br', nome: 'D', perfil: 'ADMIN', modulos: ['*']}, 'Somente um OWNER pode alterar outro OWNER.'],
    ['ADMIN não redefine OWNER', {action: 'USER_RESET_PASSWORD', actorEmail: 'admin@unilog.com.br', email: 'dona@unilog.com.br', password: 'Redefinida-2026'}, 'Somente um OWNER pode redefinir a senha de outro OWNER.'],
    ['não se desativa', {action: 'USER_SAVE', actorEmail: 'admin@unilog.com.br', email: 'admin@unilog.com.br', nome: 'A', perfil: 'ADMIN', modulos: ['M04'], ativo: false}, 'Você não pode desativar nem alterar o seu próprio perfil.'],
    ['e-mail repetido', {action: 'USER_SAVE', actorEmail: 'dona@unilog.com.br', novo: true, email: 'LEITOR@unilog.com.br', nome: 'L', perfil: 'VISUALIZADOR', modulos: ['M04'], password: 'Temporaria-2026'}, 'Já existe um usuário com este e-mail.'],
    ['senha curta', {action: 'USER_SAVE', actorEmail: 'dona@unilog.com.br', novo: true, email: 'y@unilog.com.br', nome: 'Y', perfil: 'VISUALIZADOR', modulos: ['M04'], password: 'curta'}, 'A senha precisa ter entre 10 e 256 caracteres.'],
    ['sem módulos', {action: 'USER_SAVE', actorEmail: 'dona@unilog.com.br', novo: true, email: 'z@unilog.com.br', nome: 'Z', perfil: 'VISUALIZADOR', modulos: [], password: 'Temporaria-2026'}, 'Selecione ao menos um módulo (ou "Todos os módulos").'],
    ['e-mail inválido', {action: 'USER_SAVE', actorEmail: 'dona@unilog.com.br', novo: true, email: 'sem-arroba', nome: 'W', perfil: 'VISUALIZADOR', modulos: ['M04'], password: 'Temporaria-2026'}, 'Informe um e-mail válido.'],
    ['usuário inativo não gerencia', {action: 'USERS_LIST', actorEmail: 'ninguem@unilog.com.br'}, 'Seu acesso não permite gerenciar usuários.'],
  ]
  it.each(recusas)('recusa: %s', (_n, body, mensagem) => {
    const r = a.post(body)
    expect(r).toEqual({ok: false, error: mensagem})
  })

  it('token do gateway errado é recusado antes de tudo', () => {
    const r = (a.post as unknown as (b: Record<string, unknown>) => {ok: boolean; error: string})({action: 'USERS_LIST', actorEmail: 'dona@unilog.com.br', token: 'errado'})
    expect(r).toEqual({ok: false, error: 'Acesso não autorizado.'})
  })
})
