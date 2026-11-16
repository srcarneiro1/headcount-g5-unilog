import type * as React from 'react'
import {useCallback,useEffect,useMemo,useState} from 'react'
import {BrowserRouter,NavLink,Navigate,Route,Routes,useLocation} from 'react-router-dom'
import {Button} from 'primereact/button'
import {Card} from 'primereact/card'
import {InputText} from 'primereact/inputtext'
import {Password} from 'primereact/password'
import {Message} from 'primereact/message'
import {Skeleton} from 'primereact/skeleton'
import {demoHub} from './data/demo'
import {BrandBackdrop} from './brand/BrandBackdrop'
import {fetchHub} from './lib/api'
import {AuthError,getCurrentUser,isDemo,login,logout as endSession,type AuthUser} from './lib/auth'
import {filterEmployees} from './lib/metrics'
import type {Filters,HubPayload} from './types'
import {emptyFilters} from './types'
import {FiltersBar,fmtDate} from './ui/common'
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
  // Login na identidade Unilog, igual ao Extra Cost (fundo Cinza UNILOG com ícones flutuando, cartão branco).
  return <div className="login-page">
    <BrandBackdrop/>
    <div className="login-side">
      <div className="brand-mark"><img src="/brand/unilog_express_logo_branco.svg" alt="Unilog Express"/><span className="product-chip">HEADCOUNT G5</span></div>
      <div><small className="overline-dash">GESTÃO DE PESSOAS</small><h1>O quadro do G5 <span className="accent">em um só lugar</span>, sempre atualizado.</h1><p>Indicadores operacionais integrados à base de cadastros, com acesso restrito e atualização controlada.</p></div>
      <div className="login-proof"><span><i className="pi pi-shield"/> Acesso protegido</span><span><i className="pi pi-lock"/> Credenciais seguras</span></div>
    </div>
    <div className="login-form-wrap"><Card className="login-card">
      <small className="eyebrow overline-dash">{requiresChange?'PRIMEIRO ACESSO':'ACESSO'}</small><h2>{requiresChange?'Crie sua própria senha':'Bem-vindo de volta'}</h2>
      <p>{requiresChange?'A senha recebida é temporária. Defina uma nova senha para liberar seu acesso.':'Entre com o usuário cadastrado pela administração.'}</p>
      <form onSubmit={submit}>
        <label>E-mail</label>
        <InputText type="email" required value={email} onChange={e=>{setEmail(e.target.value);setRequiresChange(false)}} placeholder="nome@empresa.com.br" autoComplete="email"/>
        <label>Senha</label>
        <Password value={password} onChange={e=>setPassword(e.target.value)} feedback={false} toggleMask inputClassName="password-input" placeholder="Digite sua senha" autoComplete="current-password" required/>
        {requiresChange&&<>
          <label>Nova senha</label>
          <Password value={newPassword} onChange={e=>setNewPassword(e.target.value)} feedback={false} toggleMask inputClassName="password-input" placeholder="Mínimo de 10 caracteres" autoComplete="new-password" required minLength={10}/>
          <label>Confirmar nova senha</label>
          <Password value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} feedback={false} toggleMask inputClassName="password-input" placeholder="Repita a nova senha" autoComplete="new-password" required minLength={10}/>
        </>}
        {error&&<Message severity="error" text={error}/>}
        <Button type="submit" label={requiresChange?'Concluir primeiro acesso':'Entrar'} icon="pi pi-arrow-right" iconPos="right" loading={busy}/>
      </form>
    </Card></div>
    <footer className="login-legal">© {new Date().getFullYear()} Unilog Express. Todos os direitos reservados.</footer>
  </div>
}
function Shell({hub,refresh,logout}:{hub:HubPayload;refresh:()=>Promise<void>;logout:()=>Promise<void>}){const[filters,setFilters]=useState<Filters>(emptyFilters),[drawer,setDrawer]=useState(false),[busy,setBusy]=useState(false);const location=useLocation(),rows=useMemo(()=>filterEmployees(hub.employees,filters),[hub.employees,filters]);useEffect(()=>setDrawer(false),[location.pathname]);async function doRefresh(){setBusy(true);try{await refresh()}finally{setBusy(false)}}return <div className="app-shell"><aside className={`sidebar ${drawer?'sidebar-open':''}`}><div className="sidebar-brand"><img className="sidebar-logo" src="/brand/unilog_express_logo_branco_sem_registro.svg" alt="Unilog Express"/><div className="sidebar-product"><strong>HEADCOUNT G5</strong><small>Gestão do quadro</small></div><Button className="drawer-close" icon="pi pi-times" text rounded onClick={()=>setDrawer(false)} aria-label="Fechar menu"/></div><div className="nav-caption">MENU PRINCIPAL</div><nav>{navItems.map(item=><NavLink key={item.path} to={item.path} end={item.path==='/'} className={({isActive})=>`side-link ${isActive?'active':''}`}><i className={`pi ${item.icon}`}/><span>{item.label}</span></NavLink>)}</nav><div className="sidebar-foot"><div className="identity"><span className="identity-icon"><i className="pi pi-user"/></span><span><strong>{hub.profile.email}</strong><small>{hub.profile.role}</small></span></div><button className="signout" type="button" onClick={()=>void logout()}><i className="pi pi-sign-out"/> Sair do sistema</button></div></aside>{drawer&&<button className="drawer-overlay" type="button" onClick={()=>setDrawer(false)} aria-label="Fechar navegação"/>}<div className="workspace"><header className="topbar"><div className="topbar-start"><Button className="menu-trigger" icon="pi pi-bars" text rounded onClick={()=>setDrawer(true)} aria-label="Abrir menu"/><span className="breadcrumb">GESTÃO DE PESSOAS <i className="pi pi-chevron-right"/> <strong>G5 · HEADCOUNT</strong></span></div><div className="topbar-end"><span className="sync-info"><i className="pi pi-circle-fill"/> {hub.source==='demo'?'Amostra fictícia':'Google Sheets · Sincronizado'}</span><Button icon="pi pi-refresh" rounded text severity="secondary" tooltip="Atualizar dados" disabled={busy||isDemo} onClick={()=>void doRefresh()}/></div></header><main className="content">{isDemo&&<div className="demo-ribbon"><i className="pi pi-info-circle"/><strong>Ambiente de demonstração</strong> — dados inteiramente fictícios. Não representam o quadro real G5.</div>}<div className="snapshot-bar"><span><i className="pi pi-calendar"/> Base: {fmtDate(hub.updatedAt)}</span><span><i className="pi pi-database"/> {countFmt.format(hub.employees.length)} matrículas acessíveis</span><span><i className="pi pi-shield"/> Perfil: {hub.profile.role}</span></div><FiltersBar rows={hub.employees} filters={filters} setFilters={setFilters}/><Routes><Route path="/" element={<Home rows={rows} hub={hub} filters={filters} setFilters={setFilters}/>}/><Route path="/colaboradores" element={<Employees rows={rows} filters={filters} setFilters={setFilters}/>}/><Route path="/supervisao" element={<Supervision rows={rows} filters={filters} setFilters={setFilters}/>}/><Route path="/analitico" element={<Analytics rows={rows}/>}/><Route path="/organograma" element={<OrgChart rows={rows}/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes><footer>HEADCOUNT G5 · UNILOG <span>Fonte operacional: Google Sheets / Cadastros</span></footer></main></div></div>}
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
