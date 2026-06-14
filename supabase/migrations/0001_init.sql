-- Routinery clone schema
-- Run this in the Supabase SQL editor (or via the Supabase CLI) on a fresh project.

-- ---------------------------------------------------------------------------
-- profiles (optional): one row per auth user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- routines
-- ---------------------------------------------------------------------------
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  time_of_day text,
  color text not null default '#6366f1',
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists routines_user_id_idx on public.routines (user_id);

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  name text not null,
  duration int not null default 60,
  position int not null default 0
);

create index if not exists tasks_routine_id_idx on public.tasks (routine_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.routines enable row level security;
alter table public.tasks enable row level security;

-- profiles: a user manages only their own profile row
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- routines: scoped directly by user_id
drop policy if exists "routines_select_own" on public.routines;
create policy "routines_select_own" on public.routines
  for select using (auth.uid() = user_id);

drop policy if exists "routines_insert_own" on public.routines;
create policy "routines_insert_own" on public.routines
  for insert with check (auth.uid() = user_id);

drop policy if exists "routines_update_own" on public.routines;
create policy "routines_update_own" on public.routines
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "routines_delete_own" on public.routines;
create policy "routines_delete_own" on public.routines
  for delete using (auth.uid() = user_id);

-- tasks: scoped via the parent routine's user_id
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks
  for select using (
    exists (
      select 1 from public.routines r
      where r.id = tasks.routine_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks
  for insert with check (
    exists (
      select 1 from public.routines r
      where r.id = tasks.routine_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks
  for update using (
    exists (
      select 1 from public.routines r
      where r.id = tasks.routine_id and r.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.routines r
      where r.id = tasks.routine_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks
  for delete using (
    exists (
      select 1 from public.routines r
      where r.id = tasks.routine_id and r.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
