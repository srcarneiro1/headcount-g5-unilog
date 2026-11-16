import type {HubPayload} from '../types'
export async function fetchHub():Promise<HubPayload>{
  const response=await fetch('/api/bootstrap',{credentials:'same-origin',headers:{Accept:'application/json'},cache:'no-store'})
  const body:unknown=await response.json().catch(()=>({error:'Resposta inválida do servidor.'}))
  if(!response.ok){const msg=typeof body==='object'&&body!==null&&'error' in body?String(body.error):'Falha ao consultar dados.';throw new Error(msg)}
  if(typeof body!=='object'||body===null||!('employees' in body)||!Array.isArray(body.employees))throw new Error('Formato de dados inesperado.')
  return body as HubPayload
}
