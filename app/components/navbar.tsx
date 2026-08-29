"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./navbar.module.css";
import { useGame } from "../context/GameProvider";

export default function NavBar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");
  const isHomePage = pathname == "/";

  const { player, formatLargeNumber, hasUnspentTick } = useGame();

  const navLinks = [
    { label: "Port", href: "/dashboard" },
    { label: "Invest", href: "/investment" },
    { label: "Expense", href: "/expense" },
    { label: "Bank", href: "/loan" },
    { label: "Action", href: "/action" },
  ];

  const bottomBar = (
    <div className={styles.bottomBar}>
      {navLinks.map(({ label, href }) => (
        <Link key={label} href={href} passHref>
          <span className={styles.buttonWrap}>
            <button className={styles.button}>{label}</button>
            {/* A year has passed and ⌛ points are waiting to be spent. */}
            {label === "Action" && hasUnspentTick && (
              <span className={styles.alertDot} aria-label="New year — actions available">
                !
              </span>
            )}
          </span>
        </Link>
      ))}
    </div>
  );

  if (isDashboard) {
    return (
      <div className={styles.container}>
        <div className={styles.inner}>
          <div className={styles.content}>{children}</div>
          {bottomBar}
        </div>
      </div>
    );
  } else if (isHomePage) {
    return (
      <div className={styles.container}>

        <div className={styles.inner}>
          
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {/* Top Bar */}
        <div className={styles.topBar}>
          <div className={styles.stat}>
            🎓 <span>{player.knowledge}</span>
          </div>
          <div className={styles.centerStatWrapper}>
            <div className={styles.centerStat}>
              {formatLargeNumber(player.money)}
            </div>
          </div>
          <div className={styles.stat}>
            😄 <span>{player.happiness}</span>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>{children}</div>

        {/* Bottom Bar */}
        {bottomBar}
      </div>
    </div>
  );
}
