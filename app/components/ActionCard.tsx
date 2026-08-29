// components/ActionCard.tsx
import styles from "./actionCard.module.css";

type ActionProps = {
  icon: string; // emoji for the action (e.g. 📚)
  value: string; // stat value (e.g. 🎓 +2)
  cost: string; // cost from action (e.g. $ 10K)
  goal: number; // 🎯 value
  clicked: boolean; // 🎯 value
};

type ActionCardProps = {
  sendOnClick: (a: string) => void;
  icon: string; // emoji for the action (e.g. 📚)
  title: string; // action name (e.g. Study)
  value: string; // stat value (e.g. 🎓 +2)
  cost: string; // cost from action (e.g. $ 10K)
  goal: number; // 🎯 value
  cards: Record<string, ActionProps>;
};

export default function ActionCard({
  sendOnClick,
  icon,
  title,
  value,
  cost,
  goal,
  cards,
}: ActionCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.title}>{title}</div>
      {value && <p className={styles.value}>{value}</p>}
      {cost && <p className={styles.cost}>{cost}</p>}

      {goal && (
        <button
          className={cards[title].clicked ? styles.goalBox2 : styles.goalBox}
          onClick={(e) => {
            sendOnClick(title);
          }}
        >
          🎯 <span>{goal}</span>
        </button>
      )}
    </div>
  );
}
