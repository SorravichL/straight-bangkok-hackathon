"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./leaderboard.module.css";
import { useGame } from "../context/GameProvider";
import type { LeaderboardEntry, LeaderboardMetric } from "@/app/lib/game";
import { fetchJson } from "@/app/lib/fetchJson";

const TABS: { metric: LeaderboardMetric; icon: string }[] = [
  { metric: "knowledge", icon: "🎓" },
  { metric: "money", icon: "💵" },
  { metric: "happiness", icon: "😄" },
];

export default function LeaderboardPage() {
  const router = useRouter();
  const { playerId, server, formatLargeNumber } = useGame();

  const [metric, setMetric] = useState<LeaderboardMetric>("money");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setStatus("loading");
      try {
        const params = new URLSearchParams({ metric, limit: "25" });
        // Rank against the server the player is actually on.
        if (server) params.set("server", server);

        const body = await fetchJson<{ entries: LeaderboardEntry[] }>(
          `/api/leaderboard?${params}`
        );
        if (cancelled) return;

        setEntries(body.entries);
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
  }, [metric, server]);

  const formatScore = (score: number) =>
    metric === "money" ? formatLargeNumber(score) : String(score);

  return (
    <div className={styles.container}>
      <div className={styles.title}>Leader board</div>

      <div className={styles.tabRow}>
        {TABS.map((tab) => (
          <button
            key={tab.metric}
            className={`${styles.tab} ${metric === tab.metric ? styles.active : ""}`}
            onClick={() => setMetric(tab.metric)}
          >
            {tab.icon}
          </button>
        ))}
      </div>

      <div className={styles.table}>
        {status === "loading" && <div className={styles.row}>Loading…</div>}
        {status === "error" && <div className={styles.row}>{error}</div>}
        {status === "ready" && entries.length === 0 && (
          <div className={styles.row}>No players yet — be the first!</div>
        )}
        {status === "ready" &&
          entries.map((item) => (
            <div
              key={item.id}
              className={`${styles.row} ${item.id === playerId ? styles.highlight : ""}`}
            >
              <div className={styles.rank}>{item.rank}</div>
              <div className={styles.name}>{item.username}</div>
              <div className={styles.money}>{formatScore(item.score)}</div>
            </div>
          ))}
      </div>
      <button
        className="mt-4 w-full  bg-[#81B64C] text-white py-2 rounded-lg"
        onClick={() => router.push("/dashboard")}
      >
        Continue
      </button>
    </div>
  );
}
