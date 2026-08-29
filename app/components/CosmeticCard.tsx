"use client";
import { useState } from "react";
import styles from "./cosmeticCard.module.css";

type CosmeticCardProps = {
  imageUrl: string;
  name: string;
  price: string;
  happiness: string; // e.g. "+5 Royalty"
  isSelected: boolean;
};

export default function CosmeticCard({
  imageUrl,
  name,
  price,
  happiness,
  isSelected: initialSelected,
}: CosmeticCardProps) {
  const [selected, setSelected] = useState(initialSelected);

  const handleToggle = () => {
    setSelected((prev) => !prev);
  };

  return (
    <div className={styles.card}>
      <img src={imageUrl} alt={name} className={styles.image} />
      <div className={styles.content}>
        <div className={styles.name}>{name}</div>
        <div className={styles.price}>{price}</div>
        <button
          className={`${styles.button} ${
            selected ? styles.selected : styles.unselected
          }`}
          onClick={handleToggle}
        >
          {selected ? "UNSELECT" : "SELECT"}
        </button>
        <div className={styles.happiness}>😄 {happiness}</div>
      </div>
    </div>
  );
}
