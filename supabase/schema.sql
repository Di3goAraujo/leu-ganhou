-- Leu, Ganhou! - esquema inicial para Supabase
-- Execute no SQL Editor do Supabase

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  age integer,
  avatar text not null default '🧒',
  weekly_goal_pages integer not null default 30,
  bonus_minutes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  title text not null,
  author text,
  category text,
  total_pages integer not null check (total_pages > 0),
  current_page integer not null default 0 check (current_page >= 0),
  status text not null default 'nao_iniciado' check (status in ('nao_iniciado', 'em_andamento', 'concluido')),
  created_at timestamptz not null default now()
);

create table if not exists public.reading_logs (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  previous_page integer not null default 0,
  current_page integer not null,
  pages_read integer not null check (pages_read > 0),
  minutes_earned integer not null check (minutes_earned >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.minute_transactions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  kind text not null check (kind in ('reading', 'usage', 'bonus', 'adjustment')),
  minutes_delta integer not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.books enable row level security;
alter table public.reading_logs enable row level security;
alter table public.minute_transactions enable row level security;

create policy "profiles own select"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles own upsert"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles own update"
on public.profiles
for update
using (auth.uid() = id);

create policy "parents manage own children"
on public.children
for all
using (auth.uid() = parent_id)
with check (auth.uid() = parent_id);

create policy "parents manage books from own children"
on public.books
for all
using (
  exists (
    select 1 from public.children c
    where c.id = books.child_id and c.parent_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.children c
    where c.id = books.child_id and c.parent_id = auth.uid()
  )
);

create policy "parents manage logs from own children"
on public.reading_logs
for all
using (
  exists (
    select 1 from public.children c
    where c.id = reading_logs.child_id and c.parent_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.children c
    where c.id = reading_logs.child_id and c.parent_id = auth.uid()
  )
);

create policy "parents manage minutes from own children"
on public.minute_transactions
for all
using (
  exists (
    select 1 from public.children c
    where c.id = minute_transactions.child_id and c.parent_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.children c
    where c.id = minute_transactions.child_id and c.parent_id = auth.uid()
  )
);

create index if not exists idx_children_parent_id on public.children(parent_id);
create index if not exists idx_books_child_id on public.books(child_id);
create index if not exists idx_reading_logs_child_id on public.reading_logs(child_id);
create index if not exists idx_minute_transactions_child_id on public.minute_transactions(child_id);


create table if not exists public.parent_settings (
  parent_id uuid primary key references auth.users(id) on delete cascade,
  parent_pin text not null default '1234',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.parent_settings enable row level security;

create policy "parents manage own settings"
on public.parent_settings
for all
using (auth.uid() = parent_id)
with check (auth.uid() = parent_id);
