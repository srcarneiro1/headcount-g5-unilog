/** Cliente restrito do Apps Script; o token compartilhado nunca é enviado ao navegador. */
export interface GatewayEnv {
  APPS_SCRIPT_URL: string
  APPS_SCRIPT_GATEWAY_TOKEN: string
}
export class GatewayError extends Error {
  constructor(message:string,readonly code:'CONFIG'|'UPSTREAM'|'DENIED'='UPSTREAM'){super(message)}
}
export async function gatewayPost<T>(env:GatewayEnv,action:'LOGIN'|'HEADCOUNT_READ',input:Record<string,unknown>):Promise<T> {
  if(!env.APPS_SCRIPT_URL||!env.APPS_SCRIPT_GATEWAY_TOKEN)throw new GatewayError('Integração Apps Script não configurada.','CONFIG')
  let url:URL
  try{url=new URL(env.APPS_SCRIPT_URL)}catch{throw new GatewayError('Endereço da ponte inválido.','CONFIG')}
  if(url.protocol!=='https:'||url.hostname!=='script.google.com'||!/^\/macros\/s\/[^/]+\/exec$/.test(url.pathname))throw new GatewayError('Endereço Apps Script não permitido.','CONFIG')
  let response:Response
  try{
    response=await fetch(url.toString(),{
      method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify({token:env.APPS_SCRIPT_GATEWAY_TOKEN,action,...input}),
      redirect:'manual',signal:AbortSignal.timeout(20000),
    })
    // ContentService redireciona o corpo da resposta para um domínio do Google.
    if([301,302,303,307,308].includes(response.status)){
      const location=response.headers.get('Location')
      if(!location)throw new GatewayError('Ponte retornou redirecionamento inválido.')
      const target=new URL(location,url)
      if(target.protocol!=='https:'||!['script.googleusercontent.com','script.google.com'].includes(target.hostname))throw new GatewayError('Redirecionamento Apps Script não confiável.')
      response=await fetch(target.toString(),{method:'GET',redirect:'manual',signal:AbortSignal.timeout(20000)})
    }
  }catch(err){if(err instanceof GatewayError)throw err;throw new GatewayError('Não foi possível conectar ao Apps Script.')}
  if(!response.ok)throw new GatewayError('O Apps Script está indisponível.')
  let result:unknown
  try{result=await response.json()}catch{throw new GatewayError('Resposta inválida do Apps Script.')}
  if(!result||typeof result!=='object'||!('ok' in result))throw new GatewayError('Resposta incompleta do Apps Script.')
  const data=result as {ok:boolean;error?:string|{message?:string}}
  if(data.ok!==true){
    const msg=typeof data.error==='string'?data.error:data.error?.message||'Solicitação recusada.'
    throw new GatewayError(action==='LOGIN'?'E-mail ou senha inválidos, ou usuário inativo.':msg,'DENIED')
  }
  return result as T
}
export function reply(payload:unknown,status=200,extra?:HeadersInit):Response {
  return new Response(JSON.stringify(payload),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',...extra}})
}
