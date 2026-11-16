/** Headcount: cookie assinado no edge; autorização atual e seleção de módulos na planilha. */
import {readSession,type AuthEnv} from '../_auth'
import {GatewayError,gatewayPost,reply,type GatewayEnv} from '../_gateway'
interface Env extends AuthEnv,GatewayEnv {}
type Context={request:Request;env:Env}
type EmployeeRecord={id:string;name:string;module:string;[key:string]:unknown}
interface ReadResult {ok:true;updatedAt:string;sourceDate:string;employees:EmployeeRecord[];profile:{email:string;role:string;modules:string[]};quality:{duplicateIds:number;invalidRows:number}}
export async function onRequestGet({request,env}:Context):Promise<Response> {
  const user=await readSession(request,env)
  if(!user)return reply({error:'Sessão ausente ou expirada.'},401)
  try{
    // O Apps Script consulta CAD_USUARIOS novamente, inclusive ATIVO e MODULOS.
    // O navegador não escolhe seu próprio escopo.
    const data=await gatewayPost<ReadResult>(env,'HEADCOUNT_READ',{email:user.email})
    if(!Array.isArray(data.employees)||data.employees.length>10000||!data.profile||data.profile.email!==user.email||!Array.isArray(data.profile.modules)||!data.profile.modules.length)return reply({error:'Resposta ou permissão inválida na fonte.'},502)
    if(!data.employees.every(e=>e&&typeof e.id==='string'&&typeof e.name==='string'&&typeof e.module==='string'))return reply({error:'Dados da fonte inválidos.'},502)
    return reply({updatedAt:data.updatedAt,sourceDate:data.sourceDate||'',employees:data.employees,profile:data.profile,source:'google-sheets',quality:data.quality||{duplicateIds:0,invalidRows:0}})
  }catch(err){
    if(err instanceof GatewayError)return reply({error:err.code==='DENIED'?'Acesso desativado ou sem módulos liberados.':err.message},err.code==='DENIED'?403:err.code==='CONFIG'?503:502)
    return reply({error:'Não foi possível consultar a base do Headcount.'},502)
  }
}
