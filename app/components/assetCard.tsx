// components/AssetCard.tsx
import styles from "./assetCard.module.css";

type AssetCardProps = {
  name: string;
  price: string;
  change: string;
  imageUrl: string;
};

export default function AssetCard({ name, price, change, imageUrl }: AssetCardProps) {
  return (
    <div className={styles.card} style={{ fontFamily: 'var(--font-adlam)' }}>
      <img src={imageUrl} alt={name} className={styles.image} />
      <div className={styles.name}>{name}</div>
      <div className="flex flex-row justify-center gap-2">
      <div className={styles.price}>{price}</div>
      <div className={styles.change}>{change}</div>
      </div>
    </div>
  );
}
