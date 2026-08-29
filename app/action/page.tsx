"use client";
import styles from "./action.module.css";
import ActionCard from "./../components/ActionCard";
import { useEffect, useState } from "react";
import { useGame } from "../context/GameProvider";
import { ACTION_CARDS, actionCost, actionValue } from "@/app/lib/actions";
import { findJob, money } from "@/app/lib/jobs";
import JobPanel from "@/app/components/JobPanel";

/** mm:ss until the whole room turns a year older. */
function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Action() {
  const { player, maxPoints, secondsToNextTick, takeAction, takeJob, markActionsSeen } = useGame();

  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showJobs, setShowJobs] = useState(false);

  // Opening this page is the acknowledgement — drop the navbar's red "!".
  useEffect(() => {
    markActionsSeen();
  }, [markActionsSeen]);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 3000);
    return () => clearTimeout(timer);
  }, [flash]);

  /** One click = one trade of ⌛ time for something else. */
  async function take(name: string) {
    if (busy) return;
    setError("");

    // Viewing jobs is free — it only opens the panel.
    if (ACTION_CARDS[name].opensCareers) {
      setShowJobs((open) => !open);
      return;
    }

    // Any other action closes the job panel.
    setShowJobs(false);
    setBusy(name);
    try {
      const effects = await takeAction(name);
      const parts: string[] = [];
      if (effects.knowledge) parts.push(`🎓 +${effects.knowledge}`);
      if (effects.happiness) parts.push(`😄 ${effects.happiness > 0 ? "+" : ""}${effects.happiness}`);
      if (effects.money) parts.push(money(effects.money));
      setFlash(`${name} → ${parts.join("   ")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not take that action");
    } finally {
      setBusy(null);
    }
  }

  async function accept(title: string) {
    if (busy) return;
    setBusy(title);
    setError("");
    try {
      await takeJob(title);
      setFlash(`You are now a ${title}`);
      setShowJobs(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not take that job");
    } finally {
      setBusy(null);
    }
  }

  const currentJob = findJob(player.occupation);

  return (
    <div>
      <div className={styles.head}>
        <div className={styles.topic}>Action</div>
        {/* The room's shared clock — everyone ages when this hits 0. */}
        <div className={styles.topic}>⌛️ {formatCountdown(secondsToNextTick)}</div>
      </div>

      <div className={styles.middle_container}>
        {/* Age · job · time, on one line above the cards. */}
        <div className={styles.statusRow}>
          <span className={styles.status_bar}>Age {player.age}</span>
          <span className={styles.jobBar} title={currentJob.title}>
            💼 {currentJob.title}
          </span>
          <span className={styles.status_bar}>
            ⌛️ {player.points}/{maxPoints}
          </span>
        </div>

        <div className={styles.header}>
          {Object.entries(ACTION_CARDS).map(([title, card]) => (
            <ActionCard
              key={title}
              title={title}
              icon={card.icon}
              value={actionValue(title, player.occupation)}
              cost={actionCost(title)}
              goal={card.points}
              busy={busy === title}
              // "view job" opens for free; everything else needs the ⌛ up front.
              label={card.opensCareers ? "view job" : undefined}
              disabled={busy !== null || (!card.opensCareers && card.points > player.points)}
              sendOnClick={take}
            />
          ))}
        </div>

        {flash && <div className="mt-3 text-center text-sm text-[#81B64C]">{flash}</div>}
        {error && <div className="mt-3 text-center text-sm text-red-400">{error}</div>}

        {player.points === 0 && !flash && !error && (
          <div className="mt-3 text-center text-xs text-gray-400">
            Out of ⌛ time. Next point in {formatCountdown(secondsToNextTick)}.
          </div>
        )}
      </div>

      {showJobs && (
        <JobPanel
          knowledge={player.knowledge}
          points={player.points}
          currentTitle={currentJob.title}
          busy={busy}
          onAccept={accept}
          onClose={() => setShowJobs(false)}
        />
      )}
    </div>
  );
}
