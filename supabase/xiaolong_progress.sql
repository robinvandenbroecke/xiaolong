create table public.xiaolong_progress (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  revision bigint not null default 1 check (revision > 0),
  players jsonb not null check (jsonb_typeof(players) = 'array'
    and jsonb_array_length(players) <= 100 and octet_length(players::text) <= 4000000)
);

alter table public.xiaolong_progress enable row level security;
revoke all on public.xiaolong_progress from public, anon, authenticated;
grant select, insert (players), update (players, revision) on public.xiaolong_progress to authenticated;

create policy xiaolong_read_own on public.xiaolong_progress for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy xiaolong_insert_own on public.xiaolong_progress for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy xiaolong_update_own on public.xiaolong_progress for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
