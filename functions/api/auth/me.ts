import {readSession,type AuthEnv} from '../../_auth'
import {reply} from '../../_gateway'
export async function onRequestGet({request,env}:{request:Request;env:AuthEnv}):Promise<Response>{
  const user=await readSession(request,env)
  return user?reply({user}):reply({error:'Sessão ausente ou expirada.'},401)
}
