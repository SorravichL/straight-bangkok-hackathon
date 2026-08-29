"use client";
import { useRouter } from "next/navigation";
import styles from "./leaderboard.module.css";

const data = [
  { rank: 1, name: "Skibidi", money: "$102M" },
  { rank: 2, name: "BrainRot", money: "$20M" },
  { rank: 3, name: "SIER#8724", money: "$10.2M" },
  { rank: 4, name: "Boom", money: "$4M" },
  { rank: 5, name: "Sake", money: "$3.9M" },
  { rank: 6, name: "Paimee", money: "$3.8M" },
  { rank: 7, name: "Sun", money: "$3.7M" },
  { rank: 8, name: "Friend", money: "$3.6M" },
  { rank: 9, name: "XXX", money: "$2.5K" },
  { rank: 10, name: "YYY", money: "$2.3K" },
  { rank: 11, name: "ZZZ", money: "$540" },
  { rank: 12, name: "Rizzler", money: "$345" },
  { rank: 13, name: ".", money: "$25" },
  { rank: 14, name: "Zapper", money: "$22" },
  { rank: 15, name: "KoolAid", money: "$18" },
  { rank: 16, name: "NovaKid", money: "$9" },
  { rank: 17, name: "ByteStorm", money: "$7.5" },
  { rank: 18, name: "Trinity", money: "$6" },
  { rank: 19, name: "Omega", money: "$5.4" },
  { rank: 20, name: "Flare", money: "$4.1" },
  { rank: 21, name: "Duckling", money: "$3.3" },
  { rank: 22, name: "Choco", money: "$2.1" },
  { rank: 23, name: "Tiny", money: "$1.2" },
  { rank: 24, name: "Chad", money: "$1" },
  { rank: 25, name: "Loopy", money: "$0.7" },
  { rank: 26, name: "QuietKid", money: "$0.5" },
];

export default function LeaderboardPage() {
  const router = useRouter();
  return (
    <div className={styles.container}>
      <div className={styles.title}>Leader board</div>

      <div className={styles.tabRow}>
        <button className={styles.tab}>🎓</button>
        <button className={`${styles.tab} ${styles.active}`}>💵</button>
        <button className={styles.tab}>😄</button>
      </div>

      <div className={styles.table}>
        {data.map((item, i) => (
          <div
            key={item.rank}
            className={`${styles.row} ${
              item.rank === 3 ? styles.highlight : ""
            }`}
          >
            <div className={styles.rank}>{item.rank}</div>
            <div className={styles.name}>{item.name}</div>
            <div className={styles.money}>{item.money}</div>
          </div>
        ))}
      </div>
      <button
        className="mt-4 w-full  bg-[#81B64C] text-white py-2 rounded-lg"
        onClick={() => router.push("/dashboard")}
      >
        Continue
      </button>
    </div>
  );
}
