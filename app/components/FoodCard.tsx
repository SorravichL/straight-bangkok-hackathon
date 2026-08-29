// components/FoodCard.tsx
import styles from "./foodCard.module.css";

type FoodCardProps = {
  imageUrl: string;
  title: string;
  costPerYear: string;
  happiness: number;
  description: string;
};

export default function FoodCard({
  imageUrl,
  title,
  costPerYear,
  happiness,
  description,
}: FoodCardProps) {
  return (
    <div className={styles.card}>
      <img src={imageUrl} alt={title} className={styles.image} />

      <div className={styles.content}>
        <div className={styles.headerRow}>
          <div className={styles.title}>{title}</div>
          <div className={styles.cost}>{costPerYear} / yr</div>
          <button className={styles.selectBtn}>SELECT</button>
        </div>

        <div className={styles.happiness}>😄 {happiness}</div>
        <div className={styles.description}>{description}</div>
      </div>
    </div>
  );
}
