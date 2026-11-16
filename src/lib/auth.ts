import {createClient, type SupabaseClient} from '@supabase/supabase-js'
let client:SupabaseClient|null=null
export const isDemo=import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE==='true'
export function getAuthClient():SupabaseClient|null {
 const url=import.meta.env.VITE_SUPABASE_URL
 const key=import.meta.env.VITE_SUPABASE_ANON_KEY
 if(!url||!key)return null
 if(!client)client=createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}})
 return client
}
