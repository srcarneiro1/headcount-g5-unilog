import {afterEach,describe,expect,it,vi} from 'vitest'
import {GatewayError,gatewayPost} from './_gateway'
const env={APPS_SCRIPT_URL:'https://script.google.com/macros/s/EXAMPLE_DEPLOYMENT/exec',APPS_SCRIPT_GATEWAY_TOKEN:'fake-local-token'}
afterEach(()=>vi.unstubAllGlobals())
describe('gateway Apps Script',()=>{
  it('recusa destino não confiável',async()=>{
    await expect(gatewayPost({...env,APPS_SCRIPT_URL:'https://evil.invalid/macros/s/X/exec'},'HEADCOUNT_READ',{})).rejects.toBeInstanceOf(GatewayError)
  })
  it('envia token somente para o Apps Script e valida resposta',async()=>{
    const mock=vi.fn(async(_url:string,init:RequestInit)=>{
      expect(JSON.parse(String(init.body))).toMatchObject({token:env.APPS_SCRIPT_GATEWAY_TOKEN,action:'HEADCOUNT_READ',email:'teste@exemplo.invalid'})
      return new Response(JSON.stringify({ok:true,employees:[]}),{status:200})
    })
    vi.stubGlobal('fetch',mock)
    const result=await gatewayPost<{ok:boolean;employees:unknown[]}>(env,'HEADCOUNT_READ',{email:'teste@exemplo.invalid'})
    expect(result.employees).toEqual([])
    expect(mock).toHaveBeenCalledTimes(1)
  })
  it('não acompanha redirects externos',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>new Response(null,{status:302,headers:{Location:'https://evil.invalid/path'}})))
    await expect(gatewayPost(env,'HEADCOUNT_READ',{})).rejects.toThrow('não confiável')
  })
})
