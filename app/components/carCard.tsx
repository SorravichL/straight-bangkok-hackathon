"use client";
import { useState } from "react";
import styles from "./carCard.module.css";
import { useGame } from "../context/GameProvider";

type CarCardProps = {
  imageUrl: string;
  name: string;
  price: string;
  rentPrice: string;
  specs: string[];
};

function parsePrice(price: string): number {
  // Remove the dollar sign, commas, and anything after a slash (like /yr)
  let value = price.replace(/\$|,/g, "").split("/")[0].trim();

  // Check for million (M) or thousand (K) notations.
  if (value.toLowerCase().endsWith("m")) {
    const numberPart = parseFloat(value.slice(0, -1));
    return numberPart * 1_000_000;
  } else if (value.toLowerCase().endsWith("k")) {
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
  rentPrice,
  specs,
}: CarCardProps) {
  const { player, setPlayer } = useGame();
  const [showDetail, setShowDetail] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmHeader, setConfirmHeader] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");

  // Calculate numeric prices to check affordability
  const numericBuyPrice = parsePrice(price);
  const numericRentPrice = parsePrice(rentPrice);

  const canBuy = player.money >= numericBuyPrice;
  const canRent = player.money >= numericRentPrice;

  // Function to update money
  function pay(amount: number) {
    setPlayer((prev) => ({
      ...prev,
      money: prev.money - amount,
    }));
  }

  const handleViewDetail = () => {
    setShowDetail(true);
  };

  const handleBuy = () => {
    setShowDetail(false);
    setConfirmHeader("Asset Bought");
    setConfirmMessage(`You've bought ${name} for ${price}`);
    setShowConfirmation(true);
    pay(numericBuyPrice);
  };

  const handleRent = () => {
    setShowDetail(false);
    setConfirmHeader("Asset Rented");
    setConfirmMessage(`You've rented ${name} for ${rentPrice}`);
    setShowConfirmation(true);
    pay(numericRentPrice);
  };

  return (
    <div className={styles.card} style={{ fontFamily: "var(--font-adlam)" }}>
      <img src={imageUrl} alt={name} className={styles.image} />

      <div className={styles.content}>
        <div className={styles.name}>{name}</div>

        <div className={styles.headerRow}>
          <div className="flex flex-col">
            <span className="text-red-600 font-bold text-[0.95rem]">Buy: {price}</span>
            <span className="text-blue-700 font-semibold text-[0.85rem]">Rent: {rentPrice}</span>
          </div>
          <button className={styles.button} onClick={handleViewDetail}>
            Detail
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

      {/* DETAIL POPUP */}
      {showDetail && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowDetail(false)}
          />
          <div className="fixed top-1/2 left-1/2 w-[300px] max-w-[90%] -translate-x-1/2 -translate-y-1/2 bg-white z-50 rounded-md p-4 shadow-md flex flex-col gap-3 border border-black">
            <h2 className="font-bold text-lg text-center">Car Options</h2>
            <p className="text-center font-medium">{name}</p>
            
            <div className="flex flex-col gap-1 items-center bg-gray-50 p-2 rounded-md border border-gray-200">
              <p className="text-sm">Buy Price: <span className="font-bold text-red-600">{price}</span></p>
              <p className="text-sm">Rent Term: <span className="font-bold text-blue-700">{rentPrice}</span></p>
            </div>

            <div className="flex justify-center gap-3 mt-2">
              {canBuy && (
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-4 rounded-md transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBuy();
                  }}
                >
                  Buy
                </button>
              )}
              {canRent && (
                <button
                  className="bg-amber-400 hover:bg-amber-500 text-black py-1 px-4 rounded-md transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRent();
                  }}
                >
                  Rent
                </button>
              )}
              {!canBuy && !canRent && (
                <span className="text-red-500 text-sm font-semibold">Not enough money</span>
              )}
            </div>

            <button
              className="mt-1 text-sm text-gray-500 hover:text-gray-800 underline"
              onClick={() => setShowDetail(false)}
            >
              Close
            </button>
          </div>
        </>
      )}

      {/* CONFIRMATION POPUP */}
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
              className="bg-gray-200 border border-gray-400 px-4 py-1 mt-2 rounded-md hover:bg-gray-300"
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