// components/ActionCard.tsx
import styles from "./actionCard.module.css";

type ActionCardProps = {
  sendOnClick: (a: string) => void;
  icon: string; // emoji for the action (e.g. 📚)
  title: string; // action name (e.g. Study)
  value: string; // what you get (e.g. 🎓 +2)
  cost: string; // what it costs on top of time (e.g. $10K)
  goal: number; // ⌛️ points this action costs
  busy: boolean; // this action is mid-request
  disabled: boolean; // unaffordable, or another action is in flight
  label?: string; // overrides the "⌛️ n" button text (e.g. "view job")
};

export default function ActionCard({
  sendOnClick,
  icon,
  title,
  value,
  cost,
  goal,
  busy,
  disabled,
  label,
}: ActionCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.title}>{title}</div>
      {value && <p className={styles.value}>{value}</p>}
      {cost && <p className={styles.cost}>{cost}</p>}

      {goal > 0 && (
        <button
          className={styles.goalBox}
          style={disabled && !busy ? { opacity: 0.4 } : undefined}
          disabled={disabled}
          onClick={() => sendOnClick(title)}
        >
          {busy ? "…" : label ? label : <>⌛️ <span>{goal}</span></>}
        </button>
      )}
    </div>
  );
}
