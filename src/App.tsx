import type * as React from 'react'
import {useCallback,useEffect,useMemo,useState} from 'react'
import {BrowserRouter,NavLink,Navigate,Route,Routes,useLocation} from 'react-router-dom'
import {Button} from 'primereact/button'
import {InputText} from 'primereact/inputtext'
import {Password} from 'primereact/password'
import {Skeleton} from 'primereact/skeleton'
import {demoHub} from './data/demo'
import {BrandBackdrop} from './brand/BrandBackdrop'
import {Users} from './pages/Users'
import {Avatar} from 'primereact/avatar'
import {fetchHub} from './lib/api'
import {AuthError,getCurrentUser,isDemo,login,logout as endSession,type AuthUser} from './lib/auth'
import {filterEmployees} from './lib/metrics'
import type {Filters,HubPayload} from './types'
import {emptyFilters} from './types'
import {FiltersBar,FiltersSlot,fmtDate} from './ui/common'
import {Home} from './pages/Home'
import {Employees} from './pages/Employees'
import {Supervision} from './pages/Supervision'
import {Analytics} from './pages/Analytics'
import {OrgChart} from './pages/OrgChart'
const countFmt=new Intl.NumberFormat('pt-BR')
const navItems=[{path:'/',label:'Visão geral',icon:'pi-chart-bar'},{path:'/colaboradores',label:'Colaboradores',icon:'pi-users'},{path:'/supervisao',label:'Supervisão',icon:'pi-sitemap'},{path:'/analitico',label:'Distribuições',icon:'pi-chart-pie'},{path:'/organograma',label:'Organograma',icon:'pi-share-alt'}]
function Login({onLogin}:{onLogin:(user:AuthUser)=>void}) {
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [newPassword,setNewPassword]=useState('')
  const [confirmPassword,setConfirmPassword]=useState('')
  const [requiresChange,setRequiresChange]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  async function submit(e:React.FormEvent) {
    e.preventDefault()
    if(requiresChange&&newPassword!==confirmPassword){setError('A confirmação da nova senha não confere.');return}
    setBusy(true);setError('')
    try {
      const user=await login(email,password,requiresChange?newPassword:undefined)
      onLogin(user)
    }catch(err){
      if(err instanceof AuthError&&err.code==='PASSWORD_CHANGE_REQUIRED'){
        setRequiresChange(true)
      }else setError(err instanceof Error?err.message:'Não foi possível autenticar.')
    }finally{setBusy(false)}
  }
  // Login com a mesma marcação do Extra Cost (LoginExperience): cartão em duas colunas, marca à esquerda, formulário à direita.
  return <main className="nx-login-page nx-login-brand-v2">
    <BrandBackdrop/>
    <section className="nx-login-card" aria-labelledby="login-title">
      <aside className="nx-login-brand">
        <div className="nx-brand-topline"><img src="/brand/unilog_express_logo_branco.svg" alt="Unilog Express"/><span className="nx-product-chip">GESTÃO</span></div>
        <div className="nx-brand-copy">
          <span className="nx-overline nx-overline-light nx-overline-dash">HEADCOUNT G5</span>
          <h1>O quadro do G5 <span className="nx-accent">em um só lugar</span>, sempre atualizado.</h1>
          <p>Indicadores do efetivo integrados à base de cadastros, com acesso restrito por módulo.</p>
        </div>
        <div className="nx-login-proof"><span><i className="pi pi-shield"/> Acesso protegido</span><span><i className="pi pi-lock"/> Credenciais seguras</span></div>
      </aside>
      <div className="nx-login-form-panel">
        <div className="nx-login-heading">
          <span className="nx-overline nx-overline-dash">{requiresChange?'PRIMEIRO ACESSO':'ACESSO'}</span>
          <h2 id="login-title">{requiresChange?'Crie sua própria senha':'Bem-vindo de volta'}</h2>
          <p>{requiresChange?'A senha recebida é temporária. Defina uma nova senha para liberar seu acesso.':'Entre com o usuário cadastrado pela administração.'}</p>
        </div>
        <form className="nx-login-form" onSubmit={submit}>
          <label htmlFor="login-email">E-mail</label>
          <span className="p-input-icon-left nx-field-icon"><i className="pi pi-envelope"/>
            <InputText id="login-email" type="email" value={email} onChange={e=>{setEmail(e.target.value);setRequiresChange(false)}} placeholder="nome@empresa.com.br" autoComplete="username" required disabled={busy||requiresChange}/>
          </span>
          <label htmlFor="login-password">{requiresChange?'Senha temporária':'Senha'}</label>
          <Password inputId="login-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Digite sua senha" autoComplete="current-password" feedback={false} toggleMask required disabled={busy||requiresChange} className="nx-password" inputClassName="nx-password-input"/>
          {requiresChange&&<>
            <label htmlFor="new-password">Nova senha</label>
            <Password inputId="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Mínimo de 10 caracteres" autoComplete="new-password" feedback={false} toggleMask required minLength={10} disabled={busy} className="nx-password" inputClassName="nx-password-input"/>
            <label htmlFor="confirm-password">Confirmar nova senha</label>
            <Password inputId="confirm-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" autoComplete="new-password" feedback={false} toggleMask required minLength={10} disabled={busy} className="nx-password" inputClassName="nx-password-input"/>
          </>}
          {error&&<div className="nx-login-error" role="alert"><i className="pi pi-exclamation-circle"/><span>{error}</span></div>}
          <Button type="submit" label={busy?'Salvando…':requiresChange?'Definir minha senha':'Entrar'} icon={busy?'pi pi-spin pi-spinner':requiresChange?'pi pi-check':'pi pi-arrow-right'} iconPos="right" disabled={busy} className="nx-primary-button"/>
        </form>
        <div className="nx-login-footnote"><i className="pi pi-info-circle"/><span>{requiresChange?'A nova senha substitui a senha temporária e não é armazenada em texto puro.':'O acesso depende de uma conta ativa com perfil e módulos definidos.'}</span></div>
      </div>
    </section>
    <footer className="nx-login-legal">© {new Date().getFullYear()} Unilog Express. Todos os direitos reservados.</footer>
  </main>
}

function Shell({hub,refresh,logout}:{hub:HubPayload;refresh:()=>Promise<void>;logout:()=>Promise<void>}){
  // Estrutura igual ao Extra Cost (FunctionalShell/ShellSidebar/ShellTopbar): menu só com o logo e botão de recolher,
  // usuário no rodapé (inicial, nome, perfil · módulos, sair) e barra superior com o produto e o nome da página.
  const[filters,setFilters]=useState<Filters>(emptyFilters),[drawer,setDrawer]=useState(false),[collapsed,setCollapsed]=useState(false),[busy,setBusy]=useState(false)
  const location=useLocation(),rows=useMemo(()=>filterEmployees(hub.employees,filters),[hub.employees,filters])
  useEffect(()=>setDrawer(false),[location.pathname])
  async function doRefresh(){setBusy(true);try{await refresh()}finally{setBusy(false)}}
  // Gestão de usuários: só OWNER e ADMIN (o Apps Script reconfere na planilha a cada pedido).
  const gestor=hub.profile.role==='OWNER'||hub.profile.role==='ADMIN'
  const pagina=location.pathname.startsWith('/usuarios')?'Usuários':navItems.find(item=>item.path==='/'?location.pathname==='/':location.pathname.startsWith(item.path))?.label||'Visão geral'
  const nome=hub.profile.name||hub.profile.email
  const modulos=hub.profile.modules.includes('*')?'Todos os módulos':hub.profile.modules.length?hub.profile.modules.join(', '):'Sem módulos'
  return <main className={`nx-app ${collapsed?'is-collapsed':''}`}>
    {drawer&&<button className="nx-sidebar-backdrop" type="button" aria-label="Fechar menu" onClick={()=>setDrawer(false)}/>}
    <aside className={`nx-sidebar ${drawer?'is-mobile-open':''}`}>
      <div className="nx-sidebar-brand">
        <img src="/brand/unilog_express_logo_branco_sem_registro.svg" alt="Unilog Express"/>
        <button type="button" className="nx-icon-button nx-desktop-collapse" onClick={()=>setCollapsed(c=>!c)} aria-label={collapsed?'Expandir menu':'Recolher menu'}><i className={collapsed?'pi pi-angle-right':'pi pi-angle-left'}/></button>
        <button type="button" className="nx-icon-button nx-mobile-close" onClick={()=>setDrawer(false)} aria-label="Fechar menu"><i className="pi pi-times"/></button>
      </div>
      <nav className="nx-navigation" aria-label="Navegação principal">
        {navItems.map(item=><NavLink key={item.path} to={item.path} end={item.path==='/'} title={item.label} className={({isActive})=>`nx-nav-item ${isActive?'is-active':''}`}><i className={`pi ${item.icon}`}/><span>{item.label}</span></NavLink>)}
        {gestor&&<div className="nx-admin-group"><span className="nx-nav-caption">ADMINISTRAÇÃO</span>
          <NavLink to="/usuarios" title="Usuários" className={({isActive})=>`nx-nav-item ${isActive?'is-active':''}`}><i className="pi pi-user-edit"/><span>Usuários</span></NavLink></div>}
      </nav>
      <div className="nx-user-card">
        <Avatar label={nome.slice(0,1).toUpperCase()} shape="circle" className="nx-avatar"/>
        <div className="nx-user-copy" title={hub.profile.email}><strong>{nome}</strong><span>{roleLabel(hub.profile.role)} · {modulos}</span></div>
        <button type="button" className="nx-icon-button" onClick={()=>void logout()} aria-label="Sair"><i className="pi pi-sign-out"/></button>
      </div>
    </aside>
    <section className="nx-workspace">
      <header className="nx-topbar">
        <div className="nx-topbar-title">
          <button type="button" className="nx-icon-button nx-mobile-menu" onClick={()=>setDrawer(true)} aria-label="Abrir menu"><i className="pi pi-bars"/></button>
          <div><small>HEADCOUNT G5</small><strong>{pagina}</strong></div>
        </div>
        <div className="nx-topbar-status">
          <span className="nx-gateway-state"><i/> {hub.source==='demo'?'Amostra fictícia':'Base conectada'}</span>
          <button type="button" className="nx-icon-button" disabled={busy||isDemo} onClick={()=>void doRefresh()} aria-label="Atualizar dados" title="Atualizar dados"><i className={`pi pi-refresh ${busy?'pi-spin':''}`}/></button>
        </div>
      </header>
      <div className="content">
        {isDemo&&<div className="demo-ribbon"><i className="pi pi-info-circle"/><strong>Ambiente de demonstração</strong> — dados inteiramente fictícios. Não representam o quadro real G5.</div>}
        {!location.pathname.startsWith('/usuarios')&&<div className="snapshot-bar"><span><i className="pi pi-calendar"/> Base: {fmtDate(hub.updatedAt)}</span><span><i className="pi pi-database"/> {countFmt.format(hub.employees.length)} matrículas acessíveis</span></div>}
        <FiltersSlot.Provider value={<FiltersBar rows={hub.employees} filters={filters} setFilters={setFilters}/>}>
          <Routes><Route path="/" element={<Home rows={rows} hub={hub} filters={filters} setFilters={setFilters}/>}/><Route path="/colaboradores" element={<Employees rows={rows} filters={filters} setFilters={setFilters}/>}/><Route path="/supervisao" element={<Supervision rows={rows} filters={filters} setFilters={setFilters}/>}/><Route path="/analitico" element={<Analytics rows={rows}/>}/><Route path="/organograma" element={<OrgChart rows={rows}/>}/><Route path="/usuarios" element={gestor?<Users meuEmail={hub.profile.email} meuPerfil={hub.profile.role} modulosDisponiveis={[...new Set(hub.employees.map(e=>e.module).filter(Boolean))].sort()}/>:<Navigate to="/" replace/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>
        </FiltersSlot.Provider>
      </div>
    </section>
  </main>
}
/** Rótulo do perfil como no Extra (profileLabel): primeira letra maiúscula. */
function roleLabel(role:string){const r=role.toLowerCase();return r==='visualizador'?'Visualizador':r.charAt(0).toUpperCase()+r.slice(1)}
function Loading(){return <div className="loading"><div className="loading-card"><Skeleton width="110px" height="32px"/><Skeleton width="250px" height="18px" className="mt"/><Skeleton width="210px" height="14px"/><div className="loading-progress"/></div></div>}
function App() {
  const [user,setUser]=useState<AuthUser|null>(null)
  const [ready,setReady]=useState(isDemo)
  const [hub,setHub]=useState<HubPayload|null>(isDemo?demoHub:null)
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  useEffect(()=>{
    if(isDemo)return
    let mounted=true
    getCurrentUser().then(current=>{
      if(mounted){setUser(current);setReady(true)}
    }).catch(()=>{if(mounted){setUser(null);setReady(true)}})
    return()=>{mounted=false}
  },[])
  const refresh=useCallback(async()=>{
    if(isDemo)return
    setBusy(true);setError('')
    try{setHub(await fetchHub())}
    catch(err){setError(err instanceof Error?err.message:'Não foi possível carregar o quadro.');setHub(null)}
    finally{setBusy(false)}
  },[])
  useEffect(()=>{
    if(!isDemo&&ready&&user&&!hub&&!busy&&!error){void refresh()}
  },[user,ready,hub,busy,error,refresh])
  async function signOut() {
    await endSession()
    setUser(null);setHub(null);setError('')
  }
  if(!ready)return <Loading/>
  if(!isDemo&&!user)return <Login onLogin={current=>{setUser(current);setHub(null);setError('')}}/>
  if(error)return <div className="state-screen"><div><i className="pi pi-exclamation-triangle"/><h2>Não foi possível abrir o Headcount</h2><p>{error}</p><Button label="Tentar novamente" icon="pi pi-refresh" onClick={()=>void refresh()}/><Button label="Sair" text severity="secondary" onClick={()=>void signOut()}/></div></div>
  if(!hub)return <Loading/>
  return <BrowserRouter><Shell hub={hub} refresh={refresh} logout={signOut}/></BrowserRouter>
}
export default App
