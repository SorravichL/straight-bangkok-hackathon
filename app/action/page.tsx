"use client";
import styles from "./action.module.css";
import ActionCard from "./../components/ActionCard";
import Link from "next/link";
import { useState } from "react";

type ActionProps = {
  icon: string; // emoji for the action (e.g. 📚)
  value: string; // stat value (e.g. 🎓 +2)
  cost: string; // cost from action (e.g. $ 10K)
  goal: number; // 🎯 value
  clicked: boolean; // 🎯 value
};

const actionCards: Record<string, ActionProps> = {
  Study: {
    icon: "📚",
    value: "🎓 +2",
    cost: "",
    goal: 2,
    clicked: false,
  },
  Tutor: {
    icon: "👩‍🏫",
    value: "🎓 +1",
    cost: "$10K",
    goal: 1,
    clicked: false,
  },
  Working: {
    icon: "💼",
    value: "$150K",
    cost: "",
    goal: 2,
    clicked: false,
  },
  Overtime: {
    icon: "🕒",
    value: "$75K",
    cost: "😊 -40",
    goal: 1,
    clicked: false,
  },
  "Find Career": {
    icon: "🔎",
    value: "4 jobs offer",
    cost: "",
    goal: 1,
    clicked: false,
  },
  Travel: {
    icon: "✈️",
    value: "😊 +200",
    cost: "$20K",
    goal: 1,
    clicked: false,
  },
};

export default function Action() {
  const [sumAction, setSumAction] = useState<number>(0);

  function ReceiveOnClick(a: string) {
    actionCards[a].clicked = !actionCards[a].clicked;
    let sum = Object.values(actionCards).reduce(
      (count, card) => count + (card.clicked ? card.goal : 0),
      0
    );
    if (sum > 3) actionCards[a].clicked = !actionCards[a].clicked;
    setSumAction(
      Object.values(actionCards).reduce(
        (count, card) => count + (card.clicked ? card.goal : 0),
        0
      )
    );
  }

  return (
    <div>
      <div className={styles.head}>
        <div className={styles.topic}>Action</div>
        <div className={styles.topic}>⌛️4/9</div>
      </div>
      <div className={styles.middle_container}>
        <div className={styles.header}>
          <h2 className={styles.status_bar}>Age 32</h2>
          <span className={styles.status_bar}>🎯 {sumAction}/3</span>

          {Object.entries(actionCards).map(([key, value], index) => (
            <ActionCard
              key={key}
              sendOnClick={ReceiveOnClick}
              icon={value.icon}
              title={key}
              value={value.value}
              cost={value.cost}
              goal={value.goal}
              cards={actionCards}
            />
          ))}
        </div>
        <Link href="/event">
          <button className={styles.age_button}>AGE</button>
        </Link>
      </div>
    </div>
  );
}
