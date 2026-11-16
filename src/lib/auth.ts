export const isDemo=import.meta.env.DEV&&import.meta.env.VITE_DEMO_MODE==='true'
export interface AuthUser {email:string;name:string;role:'OWNER'|'ADMIN'|'VISUALIZADOR'}
export class AuthError extends Error {
  constructor(message:string,readonly code:string='AUTH_ERROR'){super(message)}
}
async function parseAuth(response:Response):Promise<AuthUser>{
  const data=await response.json().catch(()=>({error:'Resposta inválida do servidor.'})) as {user?:AuthUser;error?:string;code?:string}
  if(!response.ok||!data.user)throw new AuthError(data.error||'Falha na autenticação.',data.code||String(response.status))
  return data.user
}
export async function getCurrentUser():Promise<AuthUser|null>{
  const response=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'})
  if(response.status===401)return null
  return parseAuth(response)
}
export async function login(email:string,password:string,newPassword?:string):Promise<AuthUser>{
  const response=await fetch('/api/auth/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,...(newPassword?{newPassword}:{})})})
  return parseAuth(response)
}
export async function logout():Promise<void>{
  await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'}).catch(()=>undefined)
}
