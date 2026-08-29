"use client";
import { useState } from "react";
import styles from "./carCard.module.css";
import { useGame } from "../context/GameProvider";

type CarCardProps = {
  imageUrl: string;
  name: string;
  price: string;
  specs: string[];
};

function parsePrice(price: string): number {
  // Remove the dollar sign and trim any whitespace.
  let value = price.replace("$", "").trim();

  // Check for million (M) or thousand (K) notations.
  if (value.endsWith("M") || value.endsWith("m")) {
    const numberPart = parseFloat(value.slice(0, -1));
    return numberPart * 1_000_000;
  } else if (value.endsWith("K") || value.endsWith("k")) {
    const numberPart = parseFloat(value.slice(0, -1));
    return numberPart * 1_000;
  } else {
    return parseFloat(value);
  }
}

export default function CarCard({
  imageUrl,
  name,
  price,
  specs,
}: CarCardProps) {
  // Call useGame() inside the component
  const { player, setPlayer } = useGame();
  const [showDetail, setShowDetail] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmHeader, setConfirmHeader] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");

  // Function to update money when buying a car
  function Buy(m: number) {
    setPlayer((prev) => ({
      ...prev,
      money: prev.money - m,
    }));
  }

  const handleViewDetail = () => {
    setShowDetail(true);
  };

  const handleBuy = () => {
    setShowDetail(false);
    setConfirmHeader("Asset Bought");
    setConfirmMessage(`You've bought ${name}`);
    setShowConfirmation(true);
    Buy(parsePrice(price));
  };

  return (
    <div className={styles.card} style={{ fontFamily: "var(--font-adlam)" }}>
      <img src={imageUrl} alt={name} className={styles.image} />

      <div className={styles.content}>
        <div className={styles.name}>{name}</div>

        <div className={styles.headerRow}>
          <div className={styles.price}>{price}</div>
          <button className={styles.button} onClick={handleViewDetail}>
            View Detail
          </button>
        </div>

        <div className={styles.specs}>
          {specs.map((spec, i) => (
            <span key={i} className={styles.spec}>
              {spec}
              {i < specs.length - 1 && " | "}
            </span>
          ))}
        </div>
      </div>

      {showDetail && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowDetail(false)}
          />
          <div className="fixed top-1/2 left-1/2 w-[280px] max-w-[90%] -translate-x-1/2 -translate-y-1/2 bg-white z-50 rounded-md p-4 shadow-md flex flex-col gap-3 border border-black">
            <h2 className="font-bold text-lg text-center">Car Options</h2>
            <p className="text-center">{name}</p>
            <p className="text-center">Price: {price}</p>
            <div className="flex justify-center mt-2">
              <button
                className="bg-blue-500 text-white py-1 px-3 rounded-md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBuy();
                }}
              >
                Buy
              </button>
            </div>
            <button
              className="mt-2 text-sm text-gray-600 underline"
              onClick={() => setShowDetail(false)}
            >
              Close
            </button>
          </div>
        </>
      )}

      {showConfirmation && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowConfirmation(false)}
          />
          <div className="fixed top-1/2 left-1/2 w-[280px] max-w-[90%] -translate-x-1/2 -translate-y-1/2 bg-[#f0f0d0] z-50 rounded-md p-4 shadow-md flex flex-col items-center gap-2 border border-black">
            <h2 className="font-bold text-xl">{confirmHeader}</h2>
            <p className="text-center text-sm">{confirmMessage}</p>
            <button
              className="bg-gray-200 border border-gray-400 px-3 py-1 rounded-md"
              onClick={() => setShowConfirmation(false)}
            >
              Ok
            </button>
          </div>
        </>
      )}
    </div>
  );
}
