import {describe,expect,it} from 'vitest'
import {clearSessionCookie,readSession,sameOrigin,sessionCookie,signSession} from './_auth'
const env={APP_SESSION_SECRET:'s'.repeat(64)}
const user={email:'teste@exemplo.invalid',name:'Usuário Fictício',role:'VISUALIZADOR' as const}

describe('sessão Headcount G5',()=>{
  it('cria cookie HttpOnly, seguro e de mesmo site',async()=>{
    const token=await signSession(env,user)
    const cookie=sessionCookie(token)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('SameSite=Lax')
    const request=new Request('https://headcount.exemplo.invalid/api/bootstrap',{headers:{cookie}})
    expect(await readSession(request,env)).toEqual(user)
  })
  it('rejeita segredo errado e cookie adulterado',async()=>{
    const token=await signSession(env,user)
    const request=new Request('https://headcount.exemplo.invalid/api/bootstrap',{headers:{cookie:sessionCookie(token)}})
    expect(await readSession(request,{APP_SESSION_SECRET:'x'.repeat(64)})).toBeNull()
    const bad=new Request('https://headcount.exemplo.invalid/api/bootstrap',{headers:{cookie:sessionCookie(token+'a')}})
    expect(await readSession(bad,env)).toBeNull()
  })
  it('não cria sessão com segredo fraco e limpa o cookie no logout',async()=>{
    await expect(signSession({APP_SESSION_SECRET:'fraco'},user)).rejects.toThrow()
    expect(clearSessionCookie()).toContain('Max-Age=0')
  })
  it('rejeita requisições POST entre origens',()=>{
    expect(sameOrigin(new Request('https://headcount.exemplo.invalid/api/auth/login',{headers:{origin:'https://outra.exemplo.invalid'}}))).toBe(false)
    expect(sameOrigin(new Request('https://headcount.exemplo.invalid/api/auth/login',{headers:{origin:'https://headcount.exemplo.invalid'}}))).toBe(true)
  })
})
