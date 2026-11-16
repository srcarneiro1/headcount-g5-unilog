import {clearSessionCookie,sameOrigin} from '../../_auth'
import {reply} from '../../_gateway'
export async function onRequestPost({request}:{request:Request}):Promise<Response>{
  if(!sameOrigin(request))return reply({error:'Origem não permitida.'},403)
  return reply({ok:true},200,{'Set-Cookie':clearSessionCookie()})
}
