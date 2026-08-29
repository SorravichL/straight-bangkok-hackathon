"use client";
import { useState } from "react";
import styles from "./insuranceCard.module.css";

type InsuranceCardProps = {
  imageUrl: string;
  title: string;
  isSelected: boolean;
  description: string;
};

export default function InsuranceCard({
  imageUrl,
  title,
  isSelected: initialSelected,
  description,
}: InsuranceCardProps) {
  const [selected, setSelected] = useState(initialSelected);

  const handleToggle = () => {
    setSelected((prev) => !prev);
  };

  return (
    <div className={styles.card}>
      <img src={imageUrl} alt={title} className={styles.image} />

      <div className={styles.content}>
        <div className={styles.title}>{title}</div>

        <button
          className={`${styles.button} ${
            selected ? styles.selected : styles.unselected
          }`}
          onClick={handleToggle}
        >
          {selected ? "UNSELECT" : "SELECT"}
        </button>

        <div className={styles.description}>{description}</div>
      </div>
    </div>
  );
}
