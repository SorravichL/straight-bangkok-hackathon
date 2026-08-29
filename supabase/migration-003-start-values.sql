-- Migration 003 — starting values.
-- money 25,000 · age 18 · happiness 100 · knowledge 0
-- Safe to run more than once.

-- Column defaults, so a row inserted straight from SQL matches the game.
alter table public.players alter column money     set default 25000;
alter table public.players alter column happiness set default 100;
alter table public.players alter column knowledge set default 0;
alter table public.players alter column age       set default 18;

-- The clock owns the starting age for players joining mid-session.
update public.game_clock set starting_age = 18;

-- Optional: reset everyone who already joined to the new starting values.
-- Uncomment and run if you want a clean room before the demo.
--
-- update public.players
-- set money = 25000, happiness = 100, knowledge = 0,
--     occupation = 'Unemployed', cosmetics = '[]'::jsonb,
--     points = 3, points_synced_tick = public.current_tick(),
--     joined_at_tick = public.current_tick(),
--     age = 18, turn = 1;
