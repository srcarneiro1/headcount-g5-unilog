/** Sessões assinadas do Headcount G5. Não usa banco de dados nem credenciais no navegador. */
import {SignJWT, jwtVerify} from 'jose'

export interface AuthEnv { APP_SESSION_SECRET: string }
export type AccessRole = 'OWNER' | 'ADMIN' | 'VISUALIZADOR'
export interface SessionUser { email:string; name:string; role:AccessRole }
const COOKIE = 'headcount_g5_session'
const ISSUER = 'headcount-g5-unilog'
const AUDIENCE = 'headcount-g5'
const SESSION_SECONDS = 8 * 60 * 60

function secret(env:AuthEnv):Uint8Array|null {
  const value = String(env?.APP_SESSION_SECRET||'').trim()
  return value.length >= 32 ? new TextEncoder().encode(value) : null
}
function cookieValue(request:Request):string {
  const cookie = request.headers.get('cookie')||''
  const match = cookie.split(';').map(v=>v.trim()).find(v=>v.startsWith(`${COOKIE}=`))
  if(!match)return ''
  try{return decodeURIComponent(match.slice(COOKIE.length+1))}catch{return ''}
}
export async function signSession(env:AuthEnv, user:SessionUser):Promise<string> {
  const key = secret(env)
  if(!key)throw new Error('APP_SESSION_SECRET não configurado (mínimo 32 caracteres).')
  return new SignJWT({email:user.email.trim().toLowerCase(),name:user.name,role:user.role})
    .setProtectedHeader({alg:'HS256'}).setIssuer(ISSUER).setAudience(AUDIENCE)
    .setSubject(user.email.trim().toLowerCase()).setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`).sign(key)
}
export async function readSession(request:Request, env:AuthEnv):Promise<SessionUser|null> {
  const key=secret(env), value=cookieValue(request)
  if(!key||!value)return null
  try{
    const {payload}=await jwtVerify(value,key,{issuer:ISSUER,audience:AUDIENCE,algorithms:['HS256']})
    const email=typeof payload.email==='string'?payload.email.trim().toLowerCase():''
    const role=payload.role
    if(!email||!['OWNER','ADMIN','VISUALIZADOR'].includes(String(role)))return null
    return {email,name:typeof payload.name==='string'?payload.name:email,role:role as AccessRole}
  }catch{return null}
}
export function sessionCookie(token:string):string {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Lax`
}
export function clearSessionCookie():string {
  return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
}
export function sameOrigin(request:Request):boolean {
  const origin=request.headers.get('origin')
  if(!origin)return true
  try{return new URL(origin).origin===new URL(request.url).origin}catch{return false}
}
