"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ClockState, CosmeticItem, PlayerRow, SavePayload } from "@/app/lib/game";
import { ApiError, fetchJson } from "@/app/lib/fetchJson";
import type { ActionEffects } from "@/app/lib/actions";

export type { CosmeticItem };

interface PlayerState {
  name: string;
  // Client-owned: changed by the game, saved back on a debounce.
  money: number;
  happiness: number;
  knowledge: number;
  occupation: string;
  cosmetics: CosmeticItem[];
  // Server-owned: derived from the room clock, read-only here.
  age: number;
  turn: number;
  points: number;
}

const EMPTY_PLAYER: PlayerState = {
  name: "",
  money: 0,
  happiness: 0,
  knowledge: 0,
  occupation: "",
  cosmetics: [],
  age: 0,
  turn: 1,
  points: 0,
};

const PLAYER_ID_KEY = "finage.playerId";
/** Which tick the player last saw the Action page on, per player. */
const SEEN_TICK_KEY = "finage.seenTick";
const SAVE_DEBOUNCE_MS = 600;
/** How often to re-read the server while idle. The countdown also forces a
 *  refresh the moment a tick lands, so this is only a safety net. */
const POLL_MS = 10_000;

interface GameContextType {
  player: PlayerState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  formatLargeNumber: (amount: number) => string;
  addCosmetic: (item: CosmeticItem) => void;

  playerId: string | null;
  server: string | null;
  joinGame: (username: string, server: string) => Promise<PlayerRow>;
  saveNow: () => Promise<void>;
  isSaving: boolean;
  saveError: string | null;

  /** The room's shared clock, or null before the first read. */
  clock: ClockState | null;
  /** Whole seconds until everyone ages a year. */
  secondsToNextTick: number;
  /** ⌛ bank size, from the clock config. */
  maxPoints: number;
  /** Trade ⌛ time for one action; the server resolves the payoff. */
  takeAction: (name: string) => Promise<Required<ActionEffects>>;
  /** Transfer to a job. Costs ⌛1 and needs the job's minimum 🎓. */
  takeJob: (title: string) => Promise<void>;
  /** A new year has landed and there are ⌛ points waiting to be spent. */
  hasUnspentTick: boolean;
  /** Called by the Action page to clear the badge. */
  markActionsSeen: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

function rowToPlayer(row: PlayerRow): PlayerState {
  return {
    name: row.username,
    money: row.money,
    happiness: row.happiness,
    knowledge: row.knowledge,
    occupation: row.occupation,
    cosmetics: row.cosmetics ?? [],
    age: row.age,
    turn: row.turn,
    points: row.points,
  };
}

function playerToPayload(player: PlayerState): SavePayload {
  return {
    money: player.money,
    happiness: player.happiness,
    knowledge: player.knowledge,
    occupation: player.occupation,
    cosmetics: player.cosmetics,
  };
}

/** Fingerprint of the fields we actually save, so polling never triggers a write. */
function savedSignature(player: PlayerState): string {
  return JSON.stringify(playerToPayload(player));
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PlayerState>(EMPTY_PLAYER);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [server, setServer] = useState<string | null>(null);
  const [clock, setClock] = useState<ClockState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // null = never opened the Action page, so a brand-new player is nudged too.
  const [seenTick, setSeenTick] = useState<number | null>(null);

  const latestPlayer = useRef(player);
  latestPlayer.current = player;
  /** What the server last confirmed, so we only save real changes. */
  const savedSig = useRef<string | null>(null);
  /** Postgres clock minus browser clock, so a skewed laptop still counts down right. */
  const serverOffsetMs = useRef(0);

  const applyClock = useCallback((next: ClockState) => {
    serverOffsetMs.current = Date.parse(next.server_now) - Date.now();
    setClock(next);
  }, []);

  /** Take a server row wholesale — used on join, save and spend. */
  const adoptRow = useCallback((row: PlayerRow) => {
    const next = rowToPlayer(row);
    savedSig.current = savedSignature(next);
    setPlayer(next);
    setPlayerId(row.id);
    setServer(row.server);

    const stored = window.localStorage.getItem(`${SEEN_TICK_KEY}.${row.id}`);
    setSeenTick(stored === null ? null : Number(stored));
  }, []);

  /** Take only the clock-owned fields, leaving unsaved local changes alone. */
  const adoptServerFields = useCallback((row: PlayerRow) => {
    setPlayer((prev) => {
      if (prev.age === row.age && prev.turn === row.turn && prev.points === row.points) {
        return prev;
      }
      return { ...prev, age: row.age, turn: row.turn, points: row.points };
    });
  }, []);

  const persist = useCallback(
    async (id: string, snapshot: PlayerState) => {
      setIsSaving(true);
      try {
        const { player: row, clock: nextClock } = await fetchJson<{
          player: PlayerRow;
          clock: ClockState;
        }>(`/api/players/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(playerToPayload(snapshot)),
        });
        savedSig.current = savedSignature(snapshot);
        adoptServerFields(row);
        applyClock(nextClock);
        setSaveError(null);
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "Could not save progress");
      } finally {
        setIsSaving(false);
      }
    },
    [adoptServerFields, applyClock]
  );

  /** Pull the current age / ⌛ points for this player. */
  const refresh = useCallback(async () => {
    const id = playerId;
    if (!id) return;
    try {
      const { player: row, clock: nextClock } = await fetchJson<{
        player: PlayerRow;
        clock: ClockState;
      }>(`/api/players/${id}`);
      adoptServerFields(row);
      applyClock(nextClock);
    } catch {
      // Transient network blip — the next poll will catch up.
    }
  }, [playerId, adoptServerFields, applyClock]);

  // Resume a run after a reload.
  useEffect(() => {
    const savedId = window.localStorage.getItem(PLAYER_ID_KEY);
    if (!savedId) return;

    let cancelled = false;
    (async () => {
      try {
        const { player: row, clock: nextClock } = await fetchJson<{
          player: PlayerRow;
          clock: ClockState;
        }>(`/api/players/${savedId}`);
        if (cancelled) return;
        adoptRow(row);
        applyClock(nextClock);
      } catch (error) {
        // The run was deleted — forget it so the homepage can start a fresh one.
        if (error instanceof ApiError && error.status === 404) {
          window.localStorage.removeItem(PLAYER_ID_KEY);
        }
        // Otherwise: offline or Supabase not configured. The game still runs in memory.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [adoptRow, applyClock]);

  // Heartbeat for the countdown display.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsToNextTick = useMemo(() => {
    if (!clock) return 0;
    const remaining = Date.parse(clock.next_tick_at) - (now + serverOffsetMs.current);
    return Math.max(0, Math.ceil(remaining / 1000));
  }, [clock, now]);

  // The moment a tick lands, pull the new age and points.
  const tickPending = useRef(false);
  useEffect(() => {
    if (!playerId || !clock) return;
    if (secondsToNextTick > 0) {
      tickPending.current = false;
      return;
    }
    if (tickPending.current) return;
    tickPending.current = true;
    void refresh();
  }, [secondsToNextTick, playerId, clock, refresh]);

  // Safety net for a missed tick, a sleeping laptop, or a dropped request.
  useEffect(() => {
    if (!playerId) return;
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [playerId, refresh]);

  // Autosave. Fires only when a field we actually save has changed, so the
  // clock polling above never causes a write.
  const currentSig = savedSignature(player);
  useEffect(() => {
    if (!playerId) return;
    if (savedSig.current === null || savedSig.current === currentSig) return;

    const timer = setTimeout(() => void persist(playerId, latestPlayer.current), SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [currentSig, playerId, persist]);

  const joinGame = useCallback(
    async (username: string, selectedServer: string) => {
      const body = await fetchJson<{ player: PlayerRow; clock: ClockState; resumed: boolean }>(
        "/api/players",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, server: selectedServer }),
        }
      );

      adoptRow(body.player);
      applyClock(body.clock);
      window.localStorage.setItem(PLAYER_ID_KEY, body.player.id);
      return body.player;
    },
    [adoptRow, applyClock]
  );

  const markActionsSeen = useCallback(() => {
    const tick = clock?.global_tick;
    if (tick === undefined || !playerId) return;
    setSeenTick(tick);
    window.localStorage.setItem(`${SEEN_TICK_KEY}.${playerId}`, String(tick));
  }, [clock?.global_tick, playerId]);

  // Badge on: a year has passed since they last looked, and they have points
  // to spend on it. A fresh player (seenTick null) is nudged straight away.
  const hasUnspentTick =
    playerId !== null &&
    player.points > 0 &&
    (seenTick === null || (clock !== null && clock.global_tick > seenTick));

  const saveNow = useCallback(async () => {
    if (!playerId) return;
    await persist(playerId, latestPlayer.current);
  }, [playerId, persist]);

  /** Flush unsaved stats so the server's copy is current before it charges us. */
  const flushPending = useCallback(async () => {
    if (!playerId) throw new Error("Start a game before taking actions");
    if (savedSig.current !== savedSignature(latestPlayer.current)) {
      await persist(playerId, latestPlayer.current);
    }
    return playerId;
  }, [playerId, persist]);

  const takeAction = useCallback(
    async (name: string) => {
      const id = await flushPending();
      const body = await fetchJson<{
        player: PlayerRow;
        clock: ClockState;
        spent: number;
        effects: Required<ActionEffects>;
      }>(`/api/players/${id}/spend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: name }),
      });

      adoptRow(body.player);
      applyClock(body.clock);
      return body.effects;
    },
    [flushPending, adoptRow, applyClock]
  );

  const takeJob = useCallback(
    async (title: string) => {
      const id = await flushPending();
      const body = await fetchJson<{ player: PlayerRow; clock: ClockState }>(
        `/api/players/${id}/career`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job: title }),
        }
      );

      adoptRow(body.player);
      applyClock(body.clock);
    },
    [flushPending, adoptRow, applyClock]
  );

  function formatLargeNumber(amount: number): string {
    if (amount >= 1000000||amount <= -1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000||amount <= -1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    } else {
      return `$${amount}`;
    }
  }

  function addCosmetic(item: CosmeticItem) {
    setPlayer((prev) => ({
      ...prev,
      cosmetics: [...prev.cosmetics, item],
    }));
  }

  return (
    <GameContext.Provider
      value={{
        player,
        setPlayer,
        formatLargeNumber,
        addCosmetic,
        playerId,
        server,
        joinGame,
        saveNow,
        isSaving,
        saveError,
        clock,
        secondsToNextTick,
        maxPoints: clock?.max_points ?? 12,
        takeAction,
        takeJob,
        hasUnspentTick,
        markActionsSeen,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
