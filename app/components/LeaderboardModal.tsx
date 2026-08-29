"use client";
import { useEffect, useState } from "react";
import styles from "./leaderboardModal.module.css";
import { useGame } from "../context/GameProvider";
import { fetchJson } from "@/app/lib/fetchJson";
import type { RosterEntry } from "@/app/api/roster/route";
import type { PlayerRow } from "@/app/lib/game";

type Sort = "money" | "knowledge" | "happiness" | "all";

const SORTS: { key: Sort; label: string }[] = [
  { key: "money", label: "💵" },
  { key: "knowledge", label: "🎓" },
  { key: "happiness", label: "😄" },
  { key: "all", label: "all" },
];

/** Score reads better without a trailing ".0". */
function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default function LeaderboardModal({ onClose }: { onClose: () => void }) {
  const { playerId, server, formatLargeNumber } = useGame();

  const [sort, setSort] = useState<Sort>("money");
  const [players, setPlayers] = useState<RosterEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  // Which player is expanded, plus their full row once it arrives.
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PlayerRow | null>(null);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("loading");
      try {
        const params = new URLSearchParams({ sort });
        // Rank against the server this player is actually on.
        if (server) params.set("server", server);
        const body = await fetchJson<{ players: RosterEntry[] }>(`/api/roster?${params}`);
        if (cancelled) return;
        setPlayers(body.players);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load the leaderboard");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sort, server]);

  // Pull the full row only when someone is actually opened.
  useEffect(() => {
    if (!openId) return;
    let cancelled = false;
    setDetail(null);
    setDetailError("");
    (async () => {
      try {
        const body = await fetchJson<{ player: PlayerRow }>(`/api/players/${openId}`);
        if (!cancelled) setDetail(body.player);
      } catch (err) {
        if (!cancelled) {
          setDetailError(err instanceof Error ? err.message : "Could not load that player");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openId]);

  // Escape closes the detail first, then the window.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (openId) setOpenId(null);
      else onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId, onClose]);

  /**
   * The headline number for the tab you're on.
   *
   * The icon trails the number so it stays pinned to the right edge — with the
   * icon leading, a 3-digit score shifted it left of a 1-digit one.
   */
  function rightValue(entry: RosterEntry): string {
    switch (sort) {
      case "knowledge":
        return `${entry.knowledge} 🎓`;
      case "happiness":
        return `${entry.happiness} 😄`;
      case "all":
        return `${formatScore(entry.score)}p`;
      default:
        return formatLargeNumber(entry.money);
    }
  }

  const summary = players.find((entry) => entry.id === openId);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      {/* Clicks inside the window shouldn't dismiss it. */}
      <div className={styles.window} onClick={(event) => event.stopPropagation()}>
        <div className={styles.titleBar}>
          {openId ? (
            <button className={styles.iconButton} onClick={() => setOpenId(null)} aria-label="Back">
              ‹
            </button>
          ) : (
            <span style={{ width: 26 }} />
          )}
          <span>{openId ? "Player" : "Leaderboard"}</span>
          <button className={styles.iconButton} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {!openId && (
          <>
            <div className={styles.sortRow}>
              {SORTS.map((option) => (
                <button
                  key={option.key}
                  className={`${styles.sortChip} ${sort === option.key ? styles.sortChipActive : ""}`}
                  onClick={() => setSort(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className={styles.list}>
              {status === "loading" && <div className={styles.empty}>Loading…</div>}
              {status === "error" && <div className={styles.empty}>{error}</div>}
              {status === "ready" && players.length === 0 && (
                <div className={styles.empty}>No players yet — be the first!</div>
              )}
              {status === "ready" &&
                players.map((entry, index) => (
                  <button
                    key={entry.id}
                    className={`${styles.row} ${entry.id === playerId ? styles.rowMe : ""}`}
                    onClick={() => setOpenId(entry.id)}
                  >
                    <span className={styles.rank}>{index + 1}</span>
                    <span>
                      <span className={styles.name}>{entry.username}</span>
                      <span className={styles.mini}>
                        <span>🎂 {entry.age}</span>
                        <span>🎓 {entry.knowledge}</span>
                        <span>😄 {entry.happiness}</span>
                      </span>
                    </span>
                    <span className={styles.money}>{rightValue(entry)}</span>
                  </button>
                ))}
            </div>
          </>
        )}

        {openId && (
          <div className={styles.detail}>
            <div className={styles.detailName}>{summary?.username ?? "…"}</div>
            <div className={styles.detailSub}>
              {summary?.occupation} · {summary?.server}
              {summary && ` · active ${timeAgo(summary.updated_at)}`}
            </div>

            {detailError && <div className={styles.empty}>{detailError}</div>}
            {!detail && !detailError && <div className={styles.empty}>Loading…</div>}

            {detail && (
              <>
                <div className={styles.statRow}>
                  <span>Overall Score</span>
                  <span>{summary ? formatScore(summary.score) : "—"}</span>
                </div>
                <div className={styles.statRow}>
                  <span>Net Worth</span>
                  <span>{formatLargeNumber(detail.money)}</span>
                </div>
                <div className={styles.statRow}>
                  <span>Age</span>
                  <span>{detail.age}</span>
                </div>
                <div className={styles.statRow}>
                  <span>Year</span>
                  <span>{detail.turn}</span>
                </div>
                <div className={styles.statRow}>
                  <span>Knowledge 🎓</span>
                  <span>{detail.knowledge}</span>
                </div>
                <div className={styles.statRow}>
                  <span>Happiness 😄</span>
                  <span>{detail.happiness}</span>
                </div>
                <div className={styles.statRow}>
                  <span>Occupation</span>
                  <span>{detail.occupation}</span>
                </div>
                <div className={styles.statRow}>
                  <span>Time left ⌛️</span>
                  <span>{detail.points}</span>
                </div>

                <div className={styles.sectionTitle}>
                  Cosmetics ({detail.cosmetics?.length ?? 0})
                </div>
                {(detail.cosmetics ?? []).length === 0 ? (
                  <div className={styles.empty} style={{ padding: "0.5rem" }}>
                    Nothing bought yet
                  </div>
                ) : (
                  (detail.cosmetics ?? []).map((item, index) => (
                    <div className={styles.itemRow} key={`${item.name}-${index}`}>
                      <span>{item.name}</span>
                      <span>{item.price}</span>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
