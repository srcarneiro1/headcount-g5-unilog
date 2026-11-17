/**
 * Gestão de usuários (tela Usuários, como no Extra Cost). Sessão obrigatória; o e-mail de quem pede vem da sessão
 * assinada (nunca do navegador) e o Apps Script reconfere na planilha se é OWNER/ADMIN ativo a cada pedido.
 * A senha inicial/redefinida só atravessa para o Apps Script, que grava o hash; nada é armazenado aqui.
 */
import {readSession,sameOrigin,type AuthEnv} from '../_auth'
import {GatewayError,gatewayPost,reply,type GatewayEnv} from '../_gateway'
interface Env extends AuthEnv,GatewayEnv {}
type Context={request:Request;env:Env}
const GESTORES=['OWNER','ADMIN']

function erro(err:unknown,escrita:boolean):Response {
  if(err instanceof GatewayError){
    if(err.code==='DENIED')return reply({error:err.message},400)
    if(err.code==='CONFIG')return reply({error:err.message},503)
    // Escrita sem resposta confirmada: pode ter sido gravada. Não repetir às cegas (mesma regra do Extra).
    if(escrita)return reply({error:'Não foi possível confirmar o resultado da alteração. Consulte a lista de usuários antes de tentar novamente.',code:'RESULTADO_INCERTO'},502)
    return reply({error:err.message},502)
  }
  return reply({error:'Não foi possível concluir a operação.'},502)
}

export async function onRequestGet({request,env}:Context):Promise<Response> {
  const user=await readSession(request,env)
  if(!user)return reply({error:'Sessão ausente ou expirada.'},401)
  if(!GESTORES.includes(user.role))return reply({error:'Somente OWNER e ADMIN gerenciam usuários.'},403)
  try{
    const r=await gatewayPost<{ok:true;data:unknown[]}>(env,'USERS_LIST',{actorEmail:user.email})
    return reply({users:Array.isArray(r.data)?r.data:[]})
  }catch(err){return erro(err,false)}
}

export async function onRequestPost({request,env}:Context):Promise<Response> {
  if(!sameOrigin(request))return reply({error:'Origem não permitida.'},403)
  if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return reply({error:'Use JSON.'},415)
  const user=await readSession(request,env)
  if(!user)return reply({error:'Sessão ausente ou expirada.'},401)
  if(!GESTORES.includes(user.role))return reply({error:'Somente OWNER e ADMIN gerenciam usuários.'},403)
  let b:Record<string,unknown>
  try{b=await request.json()}catch{return reply({error:'JSON inválido.'},400)}
  const texto=(v:unknown,max:number)=>typeof v==='string'&&v.length<=max?v:''
  const email=texto(b.email,180).trim().toLowerCase()
  const password=texto(b.password,256)
  if(!/^\S+@\S+\.\S+$/.test(email))return reply({error:'Informe um e-mail válido.'},400)
  try{
    if(b.acao==='SALVAR'){
      const modulos=Array.isArray(b.modulos)?b.modulos.filter((m):m is string=>typeof m==='string'&&m.length<=24).slice(0,100):[]
      const r=await gatewayPost<{ok:true;data:unknown}>(env,'USER_SAVE',{actorEmail:user.email,novo:b.novo===true,email,nome:texto(b.nome,120).trim(),
        perfil:texto(b.perfil,20),modulos,ativo:b.ativo!==false,...(b.novo===true?{password}:{})})
      return reply({user:r.data})
    }
    if(b.acao==='REDEFINIR_SENHA'){
      const r=await gatewayPost<{ok:true;data:unknown}>(env,'USER_RESET_PASSWORD',{actorEmail:user.email,email,password})
      return reply({user:r.data})
    }
    return reply({error:'Ação inválida.'},400)
  }catch(err){return erro(err,true)}
}
