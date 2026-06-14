# Stream — a routine & habit tracker

Stream is a [Routinery](https://www.routinery.app/)-style routine/habit tracker
built as a full web app with user accounts and a persistent Postgres database.

Sign up, build routines out of timed tasks, and **run** a routine with a
full-screen countdown timer (progress ring, pause / skip / restart / stop, and a
completion screen). All data is scoped per-user with Postgres Row Level Security.

## Stack

- **Next.js (App Router)** + **TypeScript** + **Tailwind CSS**
- **Supabase** — Postgres database **and** authentication
- `@supabase/supabase-js` + `@supabase/ssr` for auth in Next.js (Server
  Components for reads, Server Actions for mutations)
- Deploy target: **Vercel**

## Features

- Email + password auth (Supabase Auth), plus an optional Google OAuth button
  (no-op with a friendly message if the provider isn't configured).
- Create, edit, reorder (▲/▼), and delete routines. Each routine has a name,
  optional time-of-day, a color, and an ordered list of tasks.
- Each task has a name and a duration — add via quick presets (5 / 10 / 20 min)
  or a custom minutes + seconds input.
- Each routine picks one of five cool **ocean color themes** (Deep, Lagoon,
  Kelp, Reef, Tide); the immersive timer renders fully in that theme for both
  light and dark mode.
- **Run** a routine: full-screen timer that steps through each task with a
  countdown ring, an overall progress bar, and Pause / Skip / Restart / Stop
  controls, ending on a "complete" screen.
- Row Level Security: a user can only see and modify their own routines/tasks.
- **Liquid Glass UI** — frosted-glass surfaces with springy drag/tilt physics and
  a persistent light/dark theme toggle (top-right). The kit lives in
  `src/app/liquid-glass.css` + `src/lib/liquid-glass.js`, wired up via
  `src/app/GlassProvider.tsx`. Visual classes (`.card`, `.glass`, `.field`,
  `.btn`) skin the UI; the `data-glass` attribute adds physics to leaf controls.

---

## 1. Local setup

Requires Node.js 18.18+ (Node 20+ recommended).

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase values (step 2)
npm run dev                  # http://localhost:3000
```

### Environment variables

Set these in `.env.local` for local dev and in Vercel for production:

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → **API** → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → **API** → Project API keys → `anon` `public` |

Both are safe to expose to the browser (the anon key is protected by Row Level
Security). Never commit `.env.local` — it's git-ignored.

---

## 2. Supabase setup

1. **Create a project** at <https://supabase.com/dashboard> (free tier is fine).
   Wait for it to finish provisioning.
2. **Run the migration SQL.** Open the **SQL Editor**, paste the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) (also
   printed in full below), and click **Run**. This creates the `profiles`,
   `routines`, and `tasks` tables, enables RLS, and adds the per-user policies.
3. **Enable email auth.** Go to **Authentication → Providers → Email** and make
   sure it's enabled. For the smoothest local testing you can turn **"Confirm
   email" off** (Authentication → Providers → Email) so sign-up logs you in
   immediately; leave it on for production if you want email verification.
4. **Add redirect URLs.** Go to **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000` (for dev) — change to your Vercel URL
     for production.
   - **Redirect URLs:** add both
     `http://localhost:3000/auth/callback` and
     `https://<your-vercel-domain>/auth/callback`.
5. **(Optional) Google OAuth.** Authentication → Providers → **Google**: enable
   it and paste a Google OAuth client ID/secret. If you skip this, the
   "Continue with Google" button simply shows a message telling you to use
   email/password — the rest of the app works fine.
6. Copy your **Project URL** and **anon key** into `.env.local` (step 1).

---

## 3. Deploy to Vercel

1. Push this repo to GitHub (already done if you're reading this there).
2. Go to <https://vercel.com/new> and **import the repository**.
3. Framework preset auto-detects **Next.js** — leave the build settings as-is.
4. Under **Environment Variables**, add the two vars from the table above:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**.
6. Once deployed, copy your production URL and add it back in Supabase:
   - **Site URL** → your Vercel domain
   - **Redirect URLs** → `https://<your-vercel-domain>/auth/callback`

That's it — visit the deployed URL and sign up.

---

## 4. Verify it works

1. Open the app and **sign up** with an email + password (you're redirected to
   `/routines`).
2. Click **+ New routine**, give it a name, pick a color, and **add a few tasks**
   (e.g. "Stretch" 1m, "Meditate" 5m). Save it.
3. Hit **▶ Start** and watch the timer step through the tasks — try **Pause**,
   **Skip**, and **Stop**.
4. **Log out** (top-right).
5. **Log back in** with the same credentials → your routine is **still there**.
   (Bonus: create a second account and confirm it can't see the first account's
   routines — RLS in action.)

---

## Project structure

```
src/
  app/
    login/                 # auth UI + login/signup server actions
    auth/callback/         # OAuth / email-link code exchange
    auth/signout/          # POST sign-out
    routines/              # list, new, [id]/edit, [id]/run + server actions
  lib/
    supabase/              # browser, server, and middleware clients (@supabase/ssr)
    format.ts, types.ts
middleware.ts              # refreshes the session + guards routes (redirects to /login)
supabase/migrations/       # SQL schema + RLS policies
```

---

## Database schema & RLS (the migration, printed in full)

Run this in the Supabase SQL editor (same as `supabase/migrations/0001_init.sql`):

```sql
-- Routinery clone schema

-- profiles (optional): one row per auth user
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- routines
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

-- tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  name text not null,
  duration int not null default 60,
  position int not null default 0
);
create index if not exists tasks_routine_id_idx on public.tasks (routine_id);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.routines enable row level security;
alter table public.tasks enable row level security;

-- profiles policies
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- routines policies (scoped by user_id)
create policy "routines_select_own" on public.routines
  for select using (auth.uid() = user_id);
create policy "routines_insert_own" on public.routines
  for insert with check (auth.uid() = user_id);
create policy "routines_update_own" on public.routines
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "routines_delete_own" on public.routines
  for delete using (auth.uid() = user_id);

-- tasks policies (scoped via parent routine's user_id)
create policy "tasks_select_own" on public.tasks
  for select using (exists (
    select 1 from public.routines r
    where r.id = tasks.routine_id and r.user_id = auth.uid()));
create policy "tasks_insert_own" on public.tasks
  for insert with check (exists (
    select 1 from public.routines r
    where r.id = tasks.routine_id and r.user_id = auth.uid()));
create policy "tasks_update_own" on public.tasks
  for update using (exists (
    select 1 from public.routines r
    where r.id = tasks.routine_id and r.user_id = auth.uid()))
  with check (exists (
    select 1 from public.routines r
    where r.id = tasks.routine_id and r.user_id = auth.uid()));
create policy "tasks_delete_own" on public.tasks
  for delete using (exists (
    select 1 from public.routines r
    where r.id = tasks.routine_id and r.user_id = auth.uid()));

-- Auto-create a profile row on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

> The committed migration file uses `drop policy if exists ...` before each
> `create policy`, so it's safe to re-run.
