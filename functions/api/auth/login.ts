import {sameOrigin,sessionCookie,signSession,type AuthEnv,type SessionUser} from '../../_auth'
import {GatewayError,gatewayPost,reply,type GatewayEnv} from '../../_gateway'
type Env=AuthEnv&GatewayEnv
type Context={request:Request;env:Env}
interface LoginResult {ok:true;data:{email:string;nome:string;perfil:string;modules:string[];exigeTrocaSenha?:boolean}}

export async function onRequestPost({request,env}:Context):Promise<Response> {
  if(!sameOrigin(request))return reply({error:'Origem não permitida.'},403)
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return reply({error:'Use JSON.'},415)
  let body:{email?:unknown;password?:unknown;newPassword?:unknown}
  try{body=await request.json()}catch{return reply({error:'JSON inválido.'},400)}
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():''
  const password=typeof body.password==='string'?body.password:''
  const newPassword=typeof body.newPassword==='string'?body.newPassword:''
  if(!/^\S+@\S+\.\S+$/.test(email)||email.length>180||!password||password.length>256||newPassword.length>256)return reply({error:'Informe credenciais válidas.'},400)
  try{
    const upstream=await gatewayPost<LoginResult>(env,'LOGIN',{email,password,...(newPassword?{newPassword}:{})})
    const data=upstream.data
    if(data.exigeTrocaSenha===true)return reply({error:'Defina uma nova senha para concluir o primeiro acesso.',code:'PASSWORD_CHANGE_REQUIRED'},409)
    if(!data||data.email!==email||!['OWNER','ADMIN','VISUALIZADOR'].includes(data.perfil)||!Array.isArray(data.modules)||data.modules.length===0)return reply({error:'Perfil sem autorização para o Headcount.'},403)
    const user:SessionUser={email,name:String(data.nome||email),role:data.perfil as SessionUser['role']}
    const signed=await signSession(env,user)
    return reply({user},200,{'Set-Cookie':sessionCookie(signed)})
  }catch(err){
    if(err instanceof GatewayError)return reply({error:err.message},err.code==='DENIED'?401:err.code==='CONFIG'?503:502)
    return reply({error:'Não foi possível iniciar a sessão.'},503)
  }
}
