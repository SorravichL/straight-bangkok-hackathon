"use client";
import { useState } from "react";
import styles from "./clothingCard.module.css";

type ClothingCardProps = {
  imageUrl: string;
  name: string;
  price: string;
  happiness: string; // e.g. "+5 Style"
  isSelected?: boolean;
  onBuy?: () => void;
};

export default function ClothingCard({
  imageUrl,
  name,
  price,
  happiness,
  isSelected = false,
  onBuy,
}: ClothingCardProps) {
  const [selected, setSelected] = useState(isSelected);

  const handleBuy = () => {
    // Call onBuy if provided to add item to global inventory
    if (onBuy) {
      onBuy();
    }
    setSelected(true);
  };

  return (
    <div className={styles.card}>
      <img src={imageUrl} alt={name} className={styles.image} />
      <div className={styles.content}>
        <div className={styles.name}>{name}</div>
        <div className={styles.price}>{price}</div>
        {!selected ? (
          <button className={styles.buyButton} onClick={handleBuy}>
            BUY
          </button>
        ) : (
          <div className={styles.boughtMessage}>Purchased</div>
        )}
        <div className={styles.happiness}>😄 {happiness}</div>
      </div>
    </div>
  );
}
