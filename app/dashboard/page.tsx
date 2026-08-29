"use client"
import styles from "./dashboard.module.css"
import DonutChart from "@/app/components/DonutChart"
import Link from "next/link";
import { useGame } from "../context/GameProvider";

export default function Dashboard() {
     const { player, formatLargeNumber } = useGame();
    return (
    <div className="w-full">
        <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.ite}><img src="logo/setting.png" className="w-full h-full object-cover"/></div>
        <div className={styles.item}>Portfolio</div>
        <div className={styles.item}>{player.age}</div>
      </div>
    </div>


        <div className={styles.container}>
      <img src="profile/profile1.png" className={styles.avatar} />

      <div className={styles.username}>{player.name}</div>

      <div className={styles.stats}>
        <div className={styles['stats-row']}>
          <span>Net Worth</span>
          <span>{formatLargeNumber(player.money)}</span>
        </div>
        <div className={styles['stats-row']}>
          <span>Knowledge</span>
          <span>{player.knowledge}</span>
        </div>
        <div className={styles['stats-row']}>
          <span>Happiness</span>
          <span>{player.happiness}</span>
        </div>
        <div className={styles['stats-row']}>
          <span>Occupation</span>
          <span>{player.occupation}</span>
        </div>
      </div>

      <div className="flex flex-col items-center">
      <DonutChart cash={20} debt={10} assets={70} />
        </div>

    
      <div className={styles.legend}>
        <div className={styles['legend-item']}>
          <span className={`${styles['legend-dot']} ${styles.cash}`}></span> Cash
        </div>
        <div className={styles['legend-item']}>
          <span className={`${styles['legend-dot']} ${styles.debt}`}></span> Debt
        </div>
        <div className={styles['legend-item']}>
          <span className={`${styles['legend-dot']} ${styles.assets}`}></span> Assets
        </div>
      </div>

      <Link href="/assets"><button className={styles.button}>View my assets</button></Link>
    </div>
    </div>
      
    );
  }