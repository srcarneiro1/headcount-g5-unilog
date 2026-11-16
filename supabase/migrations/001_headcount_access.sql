-- Executar no projeto Supabase próprio/compartilhado apenas após revisão do administrador.
-- A tabela isola a autorização Headcount de outros sistemas.
create table if not exists public.headcount_access (
    user_id uuid primary key references auth.users(id) on delete cascade,
    role text not null check (role in ('OWNER','ADMIN','VISUALIZADOR')),
    modules text[] not null default '{}'::text[],
    active boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
alter table public.headcount_access enable row level security;
revoke all on public.headcount_access from anon;
grant select on public.headcount_access to authenticated;
drop policy if exists headcount_access_self_read on public.headcount_access;
create policy headcount_access_self_read on public.headcount_access
  for select to authenticated using ((select auth.uid())=user_id);
-- Não existem políticas INSERT/UPDATE/DELETE para usuários autenticados.
-- Provisionar no SQL Editor do Supabase por um operador autorizado.
-- Exemplo, substituir pelo UUID real do usuário: 
-- insert into public.headcount_access (user_id,role,modules,active)
-- values ('<USER_UUID>','VISUALIZADOR',array['M04','M05'],true);
