"use client";
import { useState } from "react";
import styles from "./loan.module.css";
import { useGame } from "../context/GameProvider";

export default function Loan() {
  const [loan, setLoan] = useState(1000);
  const maxLoan = 6000000;
  const { player, setPlayer } = useGame();
  function addMoney(m: number) {
    setPlayer((prev) => ({
      ...prev,
      // Increase money by `amount`
      money: prev.money + m,
    }));
  }

  return (
    <div className={styles.loan_container}>
      <div className={styles.loan_card}>
        <h2 className={styles.loan_title}>Loan</h2>
        <h2>
          <div className="flex flex-col items-center">
            <span>Credit</span>
            <input
              type="number"
              id="amount"
              className="bg-[#ffffff] px-2 py-1 rounded border-1 text-skin w-[120px] mx-1 text-center"
              value={loan}
              onChange={(e) => {
                if (e.target.value == "") setLoan(0);
                if (
                  parseInt(e.target.value) >= 0 &&
                  parseInt(e.target.value) <= maxLoan
                )
                  setLoan(parseInt(e.target.value));
              }}
              min="0"
              max={maxLoan}
              required
            />
          </div>
        </h2>
        <div className={styles.loan_info}>
          <div className={styles.credit}>
            <span>Credit</span>
            <strong>${maxLoan}</strong>
          </div>
          <div className={styles.payment}>
            <span>Payment</span>
            <strong>${Math.ceil((loan * 1.06) / 30)} per year</strong>
          </div>
        </div>
        <div className={styles.loan_description}>
          You are able to loan within your credit with an interest rate of 6%
          for 10 years. Would you accept that?
        </div>
        <div className={styles.loan_buttons}>
          <button className={styles.accept_btn} onClick={() => addMoney(loan)}>
            Yeahhh
          </button>
          <button className={styles.decline_btn}>Maybe later</button>
        </div>
      </div>
    </div>
  );
}
