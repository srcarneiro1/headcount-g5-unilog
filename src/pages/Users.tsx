import {useEffect, useMemo, useState} from 'react'
import {DataTable} from 'primereact/datatable'
import {Column} from 'primereact/column'
import {Button} from 'primereact/button'
import {Dialog} from 'primereact/dialog'
import {InputText} from 'primereact/inputtext'
import {Password} from 'primereact/password'
import {Dropdown} from 'primereact/dropdown'
import {MultiSelect} from 'primereact/multiselect'
import {InputSwitch} from 'primereact/inputswitch'
import {Tag} from 'primereact/tag'
import {Panel, Title} from '../ui/common'
import {listarUsuarios, redefinirSenha, salvarUsuario, type PerfilUsuario, type Rascunho, type UsuarioGerenciado} from '../lib/usuarios'

const ROTULO: Record<PerfilUsuario, string> = {OWNER: 'Owner', ADMIN: 'Admin', VISUALIZADOR: 'Visualizador'}
const vazio: Rascunho = {email: '', nome: '', perfil: 'VISUALIZADOR', modulos: [], ativo: true, password: ''}
const fmtData = (v: string) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? (v || '—') : d.toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'}) }

/** Senha temporária forte (sem caracteres ambíguos), para o administrador copiar e enviar à pessoa. */
function gerarSenha(): string {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, b => alfabeto[b % alfabeto.length]).join('').replace(/^(.{4})(.{4})(.{4})$/, '$1-$2-$3')
}

/**
 * Usuários (igual ao Extra Cost): o administrador cadastra com uma senha inicial; no primeiro acesso a pessoa é
 * obrigada a criar a própria senha. Regras conferidas também no Apps Script (fonte da verdade).
 */
export function Users({meuEmail, meuPerfil, modulosDisponiveis}: {meuEmail: string; meuPerfil: PerfilUsuario; modulosDisponiveis: string[]}) {
  const [usuarios, setUsuarios] = useState<UsuarioGerenciado[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [aviso, setAviso] = useState('')
  const [erroLista, setErroLista] = useState('')
  const [editor, setEditor] = useState<{novo: boolean; rascunho: Rascunho} | null>(null)
  const [erroEditor, setErroEditor] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [alvoSenha, setAlvoSenha] = useState<UsuarioGerenciado | null>(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erroSenha, setErroSenha] = useState('')

  async function carregar() {
    setCarregando(true); setErroLista('')
    try { setUsuarios(await listarUsuarios()) } catch (e) { setErroLista((e as Error).message) } finally { setCarregando(false) }
  }
  useEffect(() => { void carregar() }, [])

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? usuarios.filter(u => [u.nome, u.email, u.perfil, u.modulos.join(' ')].some(v => v.toLowerCase().includes(q))) : usuarios
  }, [usuarios, busca])
  const perfis = (meuPerfil === 'OWNER' ? ['OWNER', 'ADMIN', 'VISUALIZADOR'] : ['ADMIN', 'VISUALIZADOR']).map(p => ({label: ROTULO[p as PerfilUsuario], value: p}))
  const opcoesModulos = [{label: 'Todos os módulos', value: '*'}, ...modulosDisponiveis.map(m => ({label: m, value: m}))]
  const eu = (u: Rascunho) => u.email.toLowerCase() === meuEmail.toLowerCase()
  const bloqueado = (u: UsuarioGerenciado) => u.perfil === 'OWNER' && meuPerfil !== 'OWNER'

  async function salvar() {
    if (!editor) return
    setSalvando(true); setErroEditor('')
    try {
      const u = await salvarUsuario(editor.rascunho, editor.novo)
      setEditor(null)
      setAviso(editor.novo
        ? `Usuário ${u.email} cadastrado. Envie o e-mail e a senha inicial à pessoa: no primeiro acesso ela cria a própria senha.`
        : `Usuário ${u.email} atualizado. Mudanças de perfil, módulos ou situação valem no próximo login.`)
      await carregar()
    } catch (e) { setErroEditor((e as Error).message) } finally { setSalvando(false) }
  }
  async function confirmarRedefinicao() {
    if (!alvoSenha) return
    setSalvando(true); setErroSenha('')
    try {
      await redefinirSenha(alvoSenha.email, novaSenha)
      setAviso(`Senha de ${alvoSenha.email} redefinida. Envie a nova senha à pessoa: ela será obrigada a trocá-la no próximo acesso.`)
      setAlvoSenha(null); setEditor(null); await carregar()
    } catch (e) { setErroSenha((e as Error).message) } finally { setSalvando(false) }
  }

  const senhaBody = (u: UsuarioGerenciado) => !u.senhaConfigurada ? <Tag value="Sem senha" severity="danger"/>
    : u.exigeTrocaSenha ? <Tag value="Troca pendente" severity="warning"/> : <Tag value="Configurada" severity="success"/>
  const r = editor?.rascunho
  const muda = (p: Partial<Rascunho>) => setEditor(x => (x ? {...x, rascunho: {...x.rascunho, ...p}} : x))

  return <>
    <Title semFiltros title="Usuários" subtitle="Cadastre quem acessa o Headcount. A senha inicial é temporária: no primeiro acesso a pessoa cria a própria senha."
      action={<Button label="Novo usuário" icon="pi pi-user-plus" className="nx-primary-button" onClick={() => { setErroEditor(''); setEditor({novo: true, rascunho: {...vazio}}) }}/>}/>
    {aviso && <div className="usuarios-aviso" role="status"><i className="pi pi-check-circle"/><span>{aviso}</span><Button text rounded icon="pi pi-times" aria-label="Fechar aviso" onClick={() => setAviso('')}/></div>}
    <Panel title="Acessos cadastrados" kicker="ADMINISTRAÇÃO" action={<span className="search-wrap"><i className="pi pi-search"/><InputText value={busca} placeholder="Buscar nome, e-mail, perfil ou módulo…" onChange={e => setBusca(e.target.value)}/></span>}>
      {erroLista && <p className="usuarios-erro" role="alert"><i className="pi pi-exclamation-circle"/> {erroLista}</p>}
      <DataTable className="employee-table usuarios-tabela" value={visiveis} loading={carregando} dataKey="email" stripedRows size="small" emptyMessage="Nenhum usuário encontrado." sortField="nome" sortOrder={1}>
        <Column header="Usuário" sortable sortField="nome" body={(u: UsuarioGerenciado) => <div className="usuario-celula"><strong>{u.nome}</strong><small>{u.email}</small></div>}/>
        <Column header="Perfil" sortable sortField="perfil" body={(u: UsuarioGerenciado) => ROTULO[u.perfil] ?? u.perfil}/>
        <Column header="Módulos" body={(u: UsuarioGerenciado) => u.modulos.includes('*') ? 'Todos' : u.modulos.join(', ')}/>
        <Column header="Status" body={(u: UsuarioGerenciado) => <Tag value={u.ativo ? 'Ativo' : 'Inativo'} severity={u.ativo ? 'success' : 'secondary'}/>}/>
        <Column header="Senha" body={senhaBody}/>
        <Column header="Último ajuste" sortable sortField="ultimaAlteracao" body={(u: UsuarioGerenciado) => fmtData(u.ultimaAlteracao)}/>
        <Column header="Ação" style={{width: '8rem'}} body={(u: UsuarioGerenciado) => <Button label="Editar" icon="pi pi-pencil" size="small" outlined disabled={bloqueado(u)}
          tooltip={bloqueado(u) ? 'Somente um OWNER altera outro OWNER.' : undefined} tooltipOptions={{showOnDisabled: true}}
          onClick={() => { setErroEditor(''); setEditor({novo: false, rascunho: {email: u.email, nome: u.nome, perfil: u.perfil, modulos: u.modulos, ativo: u.ativo}}) }}/>}/>
      </DataTable>
    </Panel>

    <Dialog header={editor?.novo ? 'Novo usuário' : 'Editar usuário'} visible={!!editor} onHide={() => !salvando && setEditor(null)} style={{width: 'min(620px, 96vw)'}} modal
      footer={<div className="usuarios-rodape">
        {!editor?.novo && <Button label="Redefinir senha" icon="pi pi-key" outlined disabled={salvando} onClick={() => { const u = usuarios.find(x => x.email === r?.email); if (u) { setNovaSenha(''); setConfirmacao(''); setErroSenha(''); setAlvoSenha(u) } }}/>}
        <span className="flex-espaco"/>
        <Button label="Cancelar" text disabled={salvando} onClick={() => setEditor(null)}/>
        <Button label={salvando ? 'Salvando…' : editor?.novo ? 'Cadastrar usuário' : 'Salvar alterações'} icon={salvando ? 'pi pi-spin pi-spinner' : 'pi pi-check'} className="nx-primary-button" disabled={salvando} onClick={() => void salvar()}/>
      </div>}>
      {r && <div className="usuarios-form">
        {erroEditor && <div className="usuarios-erro" role="alert"><i className="pi pi-exclamation-circle"/> {erroEditor}</div>}
        <label><span>Nome</span><InputText value={r.nome} onChange={e => muda({nome: e.target.value})} autoComplete="name"/></label>
        <label><span>E-mail</span><InputText type="email" value={r.email} disabled={!editor?.novo} onChange={e => muda({email: e.target.value})} autoComplete="email"/>
          {!editor?.novo && <small>O e-mail identifica a conta e não é alterado na edição.</small>}</label>
        <label><span>Perfil</span><Dropdown value={r.perfil} options={perfis} disabled={!editor?.novo && eu(r)} onChange={e => muda({perfil: e.value})}/>
          <small>{r.perfil === 'VISUALIZADOR' ? 'Consulta os módulos liberados.' : 'Consulta os módulos liberados e gerencia usuários.'}{!editor?.novo && eu(r) ? ' Você não pode alterar o seu próprio perfil.' : ''}</small></label>
        <label><span>Módulos</span><MultiSelect value={r.modulos} options={opcoesModulos} display="chip" placeholder="Selecione"
          onChange={e => muda({modulos: (e.value as string[]).includes('*') && !r.modulos.includes('*') ? ['*'] : (e.value as string[]).filter(m => m !== '*' || (e.value as string[]).length === 1)})}/>
          <small>"Todos os módulos" libera inclusive módulos novos da planilha.</small></label>
        {editor?.novo && <label><span>Senha inicial</span>
          <div className="usuarios-senha"><Password value={r.password} onChange={e => muda({password: e.target.value})} feedback={false} toggleMask autoComplete="new-password"/>
            <Button label="Gerar" icon="pi pi-refresh" outlined type="button" onClick={() => muda({password: gerarSenha()})}/></div>
          <small>Mínimo de 10 caracteres. Só o resumo protegido (hash) é guardado; copie a senha agora para enviar à pessoa.</small></label>}
        <label><span>Status</span><div className="usuarios-switch"><InputSwitch checked={r.ativo} disabled={!editor?.novo && eu(r)} onChange={e => muda({ativo: !!e.value})}/><strong>{r.ativo ? 'Ativo' : 'Inativo'}</strong></div></label>
      </div>}
    </Dialog>

    <Dialog header="Redefinir senha" visible={!!alvoSenha} onHide={() => !salvando && setAlvoSenha(null)} style={{width: 'min(480px, 96vw)'}} modal
      footer={<div className="usuarios-rodape"><span className="flex-espaco"/><Button label="Cancelar" text disabled={salvando} onClick={() => setAlvoSenha(null)}/>
        <Button label={salvando ? 'Salvando…' : 'Redefinir senha'} icon={salvando ? 'pi pi-spin pi-spinner' : 'pi pi-key'} className="nx-primary-button"
          disabled={salvando || novaSenha.length < 10 || novaSenha !== confirmacao} onClick={() => void confirmarRedefinicao()}/></div>}>
      {alvoSenha && <div className="usuarios-form">
        <p className="usuarios-alvo">{alvoSenha.nome} · {alvoSenha.email}</p>
        {erroSenha && <div className="usuarios-erro" role="alert"><i className="pi pi-exclamation-circle"/> {erroSenha}</div>}
        <label><span>Nova senha</span><div className="usuarios-senha"><Password value={novaSenha} onChange={e => setNovaSenha(e.target.value)} feedback={false} toggleMask autoComplete="new-password"/>
          <Button label="Gerar" icon="pi pi-refresh" outlined type="button" onClick={() => { const s = gerarSenha(); setNovaSenha(s); setConfirmacao(s) }}/></div>
          <small>Mínimo de 10 caracteres. A pessoa será obrigada a trocá-la no próximo acesso.</small></label>
        <label><span>Confirmar nova senha</span><Password value={confirmacao} onChange={e => setConfirmacao(e.target.value)} feedback={false} toggleMask autoComplete="new-password"/>
          {confirmacao && novaSenha !== confirmacao && <small className="usuarios-erro-texto">As senhas não conferem.</small>}</label>
      </div>}
    </Dialog>
  </>
}
