import {afterEach, describe, expect, it, vi} from 'vitest'
import {signSession} from '../_auth'
import {onRequestGet, onRequestPost} from './usuarios'

const env = {APP_SESSION_SECRET: 'x'.repeat(48), APPS_SCRIPT_URL: 'https://script.google.com/macros/s/abc/exec', APPS_SCRIPT_GATEWAY_TOKEN: 'tk'}
async function pedido(role: 'OWNER' | 'ADMIN' | 'VISUALIZADOR', init: RequestInit = {}, origem = 'https://hc.exemplo') {
  const token = await signSession(env, {email: 'eu@unilog.com.br', name: 'Eu', role})
  return new Request('https://hc.exemplo/api/usuarios', {...init, headers: {cookie: `headcount_g5_session=${encodeURIComponent(token)}`, origin: origem, ...(init.headers || {})}})
}
function appsScript(resposta: unknown) {
  const f = vi.fn(async () => new Response(JSON.stringify(resposta), {status: 200}))
  vi.stubGlobal('fetch', f)
  return f
}
afterEach(() => vi.unstubAllGlobals())

describe('/api/usuarios', () => {
  it('sem sessão: 401', async () => {
    expect((await onRequestGet({request: new Request('https://hc.exemplo/api/usuarios'), env})).status).toBe(401)
  })
  it('VISUALIZADOR: 403 sem chamar o Apps Script', async () => {
    const f = appsScript({ok: true, data: []})
    expect((await onRequestGet({request: await pedido('VISUALIZADOR'), env})).status).toBe(403)
    expect(f).not.toHaveBeenCalled()
  })
  it('lista com o e-mail da SESSÃO como quem pede', async () => {
    const f = appsScript({ok: true, data: [{email: 'a@b.com'}]})
    const r = await onRequestGet({request: await pedido('ADMIN'), env})
    expect(await r.json()).toEqual({users: [{email: 'a@b.com'}]})
    const corpo = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(corpo).toMatchObject({action: 'USERS_LIST', actorEmail: 'eu@unilog.com.br', token: 'tk'})
  })
  it('salvar ignora actorEmail vindo do navegador', async () => {
    const f = appsScript({ok: true, data: {email: 'n@unilog.com.br'}})
    await onRequestPost({request: await pedido('OWNER', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({acao: 'SALVAR', novo: true, email: 'N@unilog.com.br', nome: 'N', perfil: 'VISUALIZADOR', modulos: ['M04'], password: 'Temporaria-2026', actorEmail: 'outro@x.com'})}), env})
    const corpo = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(corpo).toMatchObject({action: 'USER_SAVE', actorEmail: 'eu@unilog.com.br', email: 'n@unilog.com.br', password: 'Temporaria-2026'})
  })
  it('origem diferente: 403', async () => {
    appsScript({ok: true, data: {}})
    const r = await onRequestPost({request: await pedido('OWNER', {method: 'POST', headers: {'content-type': 'application/json'}, body: '{}'}, 'https://malicioso.exemplo'), env})
    expect(r.status).toBe(403)
  })
  it('mensagem de validação do Apps Script chega ao usuário (400)', async () => {
    appsScript({ok: false, error: 'Já existe um usuário com este e-mail.'})
    const r = await onRequestPost({request: await pedido('OWNER', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({acao: 'SALVAR', novo: true, email: 'n@unilog.com.br', nome: 'N', perfil: 'VISUALIZADOR', modulos: ['M04'], password: 'Temporaria-2026'})}), env})
    expect(r.status).toBe(400)
    expect(await r.json()).toEqual({error: 'Já existe um usuário com este e-mail.'})
  })
  it('escrita sem confirmação: orienta conferir a lista (não repetir às cegas)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('timeout') }))
    const r = await onRequestPost({request: await pedido('OWNER', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({acao: 'REDEFINIR_SENHA', email: 'n@unilog.com.br', password: 'Temporaria-2026'})}), env})
    expect(r.status).toBe(502)
    expect((await r.json()).code).toBe('RESULTADO_INCERTO')
  })
})
