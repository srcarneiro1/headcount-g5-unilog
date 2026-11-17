import {isDemo} from './auth'

export type PerfilUsuario = 'OWNER' | 'ADMIN' | 'VISUALIZADOR'
export interface UsuarioGerenciado {
  email: string; nome: string; perfil: PerfilUsuario; modulos: string[]; ativo: boolean
  senhaConfigurada: boolean; exigeTrocaSenha: boolean; ultimaAlteracao: string
}
export interface Rascunho { email: string; nome: string; perfil: PerfilUsuario; modulos: string[]; ativo: boolean; password?: string }

async function chamar<T>(init?: RequestInit): Promise<T> {
  const r = await fetch('/api/usuarios', {credentials: 'same-origin', cache: 'no-store', ...init})
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Não foi possível concluir a operação.')
  return data as T
}

// Demonstração: usuários fictícios em memória, com as mesmas regras do Apps Script (para testar a tela sem o Google).
const demo: UsuarioGerenciado[] = [
  {email: 'demonstracao@exemplo.invalid', nome: 'Usuário Demonstração', perfil: 'OWNER', modulos: ['*'], ativo: true, senhaConfigurada: true, exigeTrocaSenha: false, ultimaAlteracao: '2026-11-10T12:00:00Z'},
  {email: 'supervisao@exemplo.invalid', nome: 'Supervisão Fictícia', perfil: 'ADMIN', modulos: ['M04', 'M05'], ativo: true, senhaConfigurada: true, exigeTrocaSenha: true, ultimaAlteracao: '2026-11-12T12:00:00Z'},
  {email: 'leitura@exemplo.invalid', nome: 'Leitura Fictícia', perfil: 'VISUALIZADOR', modulos: ['M04'], ativo: false, senhaConfigurada: true, exigeTrocaSenha: false, ultimaAlteracao: '2026-11-01T12:00:00Z'},
]
const falha = (m: string) => Promise.reject(new Error(m))

export function listarUsuarios(): Promise<UsuarioGerenciado[]> {
  if (isDemo) return Promise.resolve(demo.map(u => ({...u})))
  return chamar<{users: UsuarioGerenciado[]}>().then(r => r.users)
}

export function salvarUsuario(r: Rascunho, novo: boolean): Promise<UsuarioGerenciado> {
  if (isDemo) {
    const email = r.email.trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(email)) return falha('Informe um e-mail válido.')
    if (!r.nome.trim()) return falha('Informe o nome (até 120 caracteres).')
    if (!r.modulos.length) return falha('Selecione ao menos um módulo (ou "Todos os módulos").')
    const i = demo.findIndex(u => u.email === email)
    if (novo) {
      if (i >= 0) return falha('Já existe um usuário com este e-mail.')
      if ((r.password ?? '').length < 10) return falha('A senha precisa ter entre 10 e 256 caracteres.')
      const u: UsuarioGerenciado = {email, nome: r.nome.trim(), perfil: r.perfil, modulos: r.modulos, ativo: r.ativo, senhaConfigurada: true, exigeTrocaSenha: true, ultimaAlteracao: new Date().toISOString()}
      demo.push(u); return Promise.resolve({...u})
    }
    if (i < 0) return falha('Usuário não encontrado.')
    demo[i] = {...demo[i], nome: r.nome.trim(), perfil: r.perfil, modulos: r.modulos, ativo: r.ativo, ultimaAlteracao: new Date().toISOString()}
    return Promise.resolve({...demo[i]})
  }
  return chamar<{user: UsuarioGerenciado}>({method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({acao: 'SALVAR', novo, ...r})}).then(x => x.user)
}

export function redefinirSenha(email: string, password: string): Promise<UsuarioGerenciado> {
  if (isDemo) {
    const u = demo.find(x => x.email === email)
    if (!u) return falha('Usuário não encontrado.')
    if (password.length < 10) return falha('A senha precisa ter entre 10 e 256 caracteres.')
    Object.assign(u, {senhaConfigurada: true, exigeTrocaSenha: true, ultimaAlteracao: new Date().toISOString()})
    return Promise.resolve({...u})
  }
  return chamar<{user: UsuarioGerenciado}>({method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({acao: 'REDEFINIR_SENHA', email, password})}).then(x => x.user)
}
