-- Handy checks for the FinAge database.
-- Paste any single block into the Supabase SQL Editor and Run.

-- 1. Everything, newest activity first
select * from public.players order by updated_at desc;

-- 2. Readable summary
select
  username,
  server,
  money,
  knowledge as "🎓",
  happiness as "😄",
  occupation,
  age,
  turn,
  jsonb_array_length(cosmetics) as items,
  updated_at
from public.players
order by money desc;

-- 3. Leaderboard — swap `money` for `knowledge` or `happiness` to check the other tabs
select
  row_number() over (order by money desc, updated_at asc) as rank,
  username,
  money
from public.players
where server = 'Server 1'
order by money desc, updated_at asc
limit 25;

-- 4. What each player bought (one row per cosmetic)
select
  p.username,
  item->>'name'  as item,
  item->>'price' as price,
  item->>'happiness' as happiness
from public.players p,
     lateral jsonb_array_elements(p.cosmetics) as item
order by p.username;

-- 5. Who saved in the last 5 minutes (proves autosave is firing)
select username, money, age, turn, updated_at
from public.players
where updated_at > now() - interval '5 minutes'
order by updated_at desc;

-- 6. Give yourself money so you can test buying houses and cars
update public.players
set money = 5000000
where username = 'asdawd#1234' and server = 'Server 2';

-- 7. Reset one player back to the starting state
update public.players
set money = 10000, happiness = 5, knowledge = 1,
    occupation = 'Unemployed', age = 17, turn = 1, cosmetics = '[]'::jsonb
where username = 'asdawd#1234' and server = 'Server 2';

-- 8. Wipe every player (clears the leaderboard — no undo)
delete from public.players;

-- ===========================================================================
-- Live clock (migration 002)
-- ===========================================================================

-- 9. Watch the whole room live — age and ⌛ points update every read
select username, server, live_age, live_points, money, knowledge, happiness, years_lived
from public.player_live
order by live_age desc, money desc;

-- 10. Where is the clock right now?
select *, next_tick_at - now() as time_to_next_year from public.clock_state();

-- 11. Set the tick length. 300 = 5 minutes. Use 20 to rehearse quickly.
update public.game_clock set tick_seconds = 300;

-- 12. START THE DEMO — resets the clock to now, so everyone begins at year 0.
--     Run this right before people join.
update public.game_clock set started_at = now();

-- 13. Full reset between runs: clear the room and restart the clock.
delete from public.players;
update public.game_clock set started_at = now();

-- 14. Tune the room (starting age, join bonus, ⌛ bank size)
update public.game_clock
set starting_age = 18, starting_points = 3, max_points = 12;
