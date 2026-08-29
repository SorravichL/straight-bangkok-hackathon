"use client";
import { useEffect } from "react";
import styles from "./jobPanel.module.css";
import { canTake, JOBS, money } from "@/app/lib/jobs";

type JobPanelProps = {
  knowledge: number;
  points: number;
  currentTitle: string;
  busy: string | null;
  onAccept: (title: string) => void;
  onClose: () => void;
};

export default function JobPanel({
  knowledge,
  points,
  currentTitle,
  busy,
  onAccept,
  onClose,
}: JobPanelProps) {
  // Escape closes, like the leaderboard window.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      {/* Clicks inside the window shouldn't dismiss it. */}
      <div className={styles.window} onClick={(event) => event.stopPropagation()}>
        <div className={styles.titleBar}>
          <span style={{ width: 26 }} />
          <span>Find Jobs</span>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className={styles.hint}>
          🎓 {knowledge} · taking a job costs ⌛️ 1
        </div>

        {/* One flat list, easiest job first. */}
        <div className={styles.list}>
          {JOBS.map((job) => {
            const isCurrent = job.title === currentTitle;
            const eligible = canTake(job, knowledge);
            return (
              <button
                key={job.title}
                onClick={() => onAccept(job.title)}
                disabled={!eligible || isCurrent || busy !== null || points < 1}
                className={`${styles.jobRow} ${
                  isCurrent ? styles.jobRowCurrent : eligible ? "" : styles.jobRowLocked
                }`}
              >
                <span>{job.title}</span>
                <span className={styles.jobMeta}>
                  🎓 {job.minKnowledge} · {money(job.salary)}
                  {isCurrent ? " ✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
