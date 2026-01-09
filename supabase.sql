-- Supabase schema for MovieHub
-- Run this in Supabase SQL editor or via the CLI.

-- Table: user_ratings
create table if not exists public.user_ratings (
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id bigint not null,
  title text not null,
  media_type text not null check (media_type in ('movie','tv')),
  score smallint not null check (score in (-5,-2,2,5)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, tmdb_id)
);

-- Trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_user_ratings_updated_at on public.user_ratings;
create trigger trg_user_ratings_updated_at
before update on public.user_ratings
for each row execute function public.set_updated_at();

-- Indexes for performance
create index if not exists idx_user_ratings_user on public.user_ratings(user_id);
create index if not exists idx_user_ratings_tmdb on public.user_ratings(tmdb_id);

-- Row Level Security
alter table public.user_ratings enable row level security;

-- Policies: users can manage only their rows
drop policy if exists "Users can view own ratings" on public.user_ratings;
create policy "Users can view own ratings"
  on public.user_ratings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own ratings" on public.user_ratings;
create policy "Users can insert own ratings"
  on public.user_ratings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own ratings" on public.user_ratings;
create policy "Users can update own ratings"
  on public.user_ratings for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own ratings" on public.user_ratings;
create policy "Users can delete own ratings"
  on public.user_ratings for delete
  using (auth.uid() = user_id);

-- Table: skipped_titles
create table if not exists public.skipped_titles (
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, title)
);

alter table public.skipped_titles enable row level security;

drop policy if exists "Users can view own skipped titles" on public.skipped_titles;
create policy "Users can view own skipped titles"
  on public.skipped_titles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can upsert own skipped titles" on public.skipped_titles;
create policy "Users can upsert own skipped titles"
  on public.skipped_titles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own skipped titles" on public.skipped_titles;
create policy "Users can delete own skipped titles"
  on public.skipped_titles for delete
  using (auth.uid() = user_id);
