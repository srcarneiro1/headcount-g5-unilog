/** Gateway Cloudflare: autenticação e autorização antes de expor qualquer dado de pessoas. */
interface Env {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  HEADCOUNT_API_URL: string
  HEADCOUNT_API_TOKEN: string
}
type WorkerContext = {request: Request;env:Env}
type EmployeeRecord = {
  id:string;name:string;role:string;area:string;admission:string;costCenter:string;status:string;
  client:string;shift:string;supervisorId:string;supervisor:string;lead:string;module:string;process:string
}
const HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}
function json(value:unknown,status=200){return new Response(JSON.stringify(value),{status,headers:HEADERS})}
function safeEndpoint(url:string){try{const u=new URL(url);return u.protocol==='https:'&&u.hostname.endsWith('.supabase.co')}catch{return false}}
async function safeScriptResult(url:string,token:string){
  if(!url.startsWith('https://script.google.com/macros/s/'))throw Error('Ponte Apps Script não configurada.')
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,action:'HEADCOUNT_READ'}),redirect:'manual',signal:AbortSignal.timeout(20000)})
  let final=response
  if([301,302,303,307,308].includes(response.status)){
    const location=response.headers.get('Location');if(!location)throw Error('Ponte retornou redirecionamento sem destino.')
    const target=new URL(location,url)
    if(target.protocol!=='https:'||!['script.googleusercontent.com','script.google.com'].includes(target.hostname))throw Error('Redirecionamento não confiável na ponte.')
    // O ContentService do Apps Script redireciona a leitura da resposta para um URL GET.
    final=await fetch(target.toString(),{method:'GET',redirect:'manual',signal:AbortSignal.timeout(20000)})
  }
  if(!final.ok)throw Error(`Ponte indisponível (HTTP ${final.status}).`)
  const body:unknown=await final.json();if(!body||typeof body!=='object'||!('ok' in body)||(body as {ok:unknown}).ok!==true)throw Error('Ponte recusou acesso ou retornou dados inválidos.')
  return body as {ok:true;updatedAt:string;sourceDate?:string;employees:EmployeeRecord[];quality:{duplicateIds:number;invalidRows:number}}
}
export async function onRequestGet({request,env}:WorkerContext):Promise<Response>{
  if(!env.SUPABASE_URL||!env.SUPABASE_ANON_KEY||!env.HEADCOUNT_API_URL||!env.HEADCOUNT_API_TOKEN)return json({error:'Integração do servidor não configurada.'},503)
  if(!safeEndpoint(env.SUPABASE_URL))return json({error:'Endereço Supabase inválido.'},503)
  const header=request.headers.get('Authorization')||'';if(!/^Bearer [\w.-]+$/.test(header))return json({error:'Sessão ausente.'},401)
  const token=header.slice(7)
  const base=env.SUPABASE_URL.replace(/\/$/,'')
  try{
    const userResponse=await fetch(`${base}/auth/v1/user`,{headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000)})
    if(!userResponse.ok)return json({error:'Sessão inválida ou expirada.'},401)
    const user=await userResponse.json() as {id?:string;email?:string}
    if(!user.id||!user.email||!/^[a-f\d-]{36}$/i.test(user.id))return json({error:'Identidade inválida.'},401)
    const query=`${base}/rest/v1/headcount_access?select=role,modules,active&user_id=eq.${encodeURIComponent(user.id)}&limit=1`
    const profileResponse=await fetch(query,{headers:{apikey:env.SUPABASE_ANON_KEY,Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000)})
    if(!profileResponse.ok)return json({error:'Falha ao consultar autorização.'},503)
    const profiles=await profileResponse.json() as {role?:string;modules?:string[];active?:boolean}[]
    const profile=profiles[0]
    if(!profile?.active||!['OWNER','ADMIN','VISUALIZADOR'].includes(profile.role||''))return json({error:'Seu usuário não possui permissão para acessar este painel.'},403)
    const raw=await safeScriptResult(env.HEADCOUNT_API_URL,env.HEADCOUNT_API_TOKEN)
    if(!Array.isArray(raw.employees)||raw.employees.length>10000)return json({error:'Volume ou formato inesperado da fonte.'},502)
    const modules=Array.isArray(profile.modules)?profile.modules.filter(x=>typeof x==='string').map(x=>x.trim().toUpperCase()):[]
    if(!modules.length)return json({error:'Perfil sem módulos autorizados.'},403)
    const employeeRows=raw.employees.filter(e=>e&&typeof e.id==='string'&&typeof e.name==='string'&&typeof e.module==='string')
    const employees=modules.includes('*')?employeeRows:employeeRows.filter(e=>modules.includes(e.module.trim().toUpperCase()))
    return json({updatedAt:raw.updatedAt,sourceDate:raw.sourceDate||'',source:'google-sheets',employees,profile:{email:user.email,role:profile.role,modules},quality:raw.quality||{duplicateIds:0,invalidRows:0}})
  }catch(e){console.error('Headcount bootstrap failed',e instanceof Error?e.name:'UnknownError');return json({error:'Não foi possível consultar o Headcount. Verifique a conexão e a ponte de dados.'},502)}
}
