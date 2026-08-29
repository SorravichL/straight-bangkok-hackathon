-- FinAge database schema
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- One row per player, per server. Holds identity plus the player's live game state,
-- which is what /api/leaderboard ranks.
create table if not exists public.players (
  id          uuid primary key default gen_random_uuid(),
  username    text        not null,
  server      text        not null,
  money       bigint      not null default 25000,
  happiness   integer     not null default 100,
  knowledge   integer     not null default 0,
  occupation  text        not null default 'Unemployed',
  age         integer     not null default 18,
  turn        integer     not null default 1,
  cosmetics   jsonb       not null default '[]'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- "boom#1234" is one player on Server 1 and a different one on Server 2.
  constraint players_username_server_key unique (username, server),
  -- Matches the format the homepage asks for: yourname#1234
  constraint players_username_format check (username ~ '^[a-zA-Z0-9]+#[0-9]{4}$')
);

-- Leaderboard sorts: one index per tab (💵 / 🎓 / 😄), scoped to a server.
create index if not exists players_server_money_idx     on public.players (server, money desc);
create index if not exists players_server_knowledge_idx on public.players (server, knowledge desc);
create index if not exists players_server_happiness_idx on public.players (server, happiness desc);

-- Keep updated_at honest so "last played" is meaningful.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists players_set_updated_at on public.players;
create trigger players_set_updated_at
  before update on public.players
  for each row execute function public.set_updated_at();

-- Lock the table down: RLS on with zero policies means the public anon key can read
-- and write nothing. Every access goes through the Next.js API routes, which use the
-- service role key (it bypasses RLS) and never leaves the server.
alter table public.players enable row level security;
