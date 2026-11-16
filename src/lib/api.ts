import type {HubPayload} from '../types'
import {getAuthClient} from './auth'
export async function fetchHub():Promise<HubPayload>{
 const auth=getAuthClient()
 if(!auth)throw new Error('Supabase Auth não configurado.')
 const {data:{session},error}=await auth.auth.getSession()
 if(error||!session)throw new Error('Sessão expirada. Entre novamente.')
 const response=await fetch('/api/bootstrap',{headers:{Authorization:`Bearer ${session.access_token}`,Accept:'application/json'},cache:'no-store'})
 const body:unknown=await response.json().catch(()=>({error:'Resposta inválida do servidor.'}))
 if(!response.ok){const msg=typeof body==='object'&&body!==null&&'error' in body?String(body.error):'Falha ao consultar dados.';throw new Error(msg)}
 if(typeof body!=='object'||body===null||!('employees' in body)||!Array.isArray(body.employees))throw new Error('Formato de dados inesperado.')
 return body as HubPayload
}
