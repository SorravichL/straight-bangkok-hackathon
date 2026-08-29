"use client";
import { useState } from "react";
import { useGame } from "../context/GameProvider";

type HouseCardProps = {
  imageUrl: string;
  title: string;
  price: string;  // e.g. "$1.8M", "$320K", "$400"
  beds: number;
  baths: number;
  size: string;
  address: string;
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


export default function HouseCard({
  imageUrl,
  title,
  price,
  beds,
  baths,
  size,
  address,
}: HouseCardProps) {
  // State to show/hide the detail popup
  const [showDetail, setShowDetail] = useState(false);

  // State to show/hide the final confirmation popup
  const [showConfirmation, setShowConfirmation] = useState(false);

  // The text for confirmation header and sub-header
  const [confirmHeader, setConfirmHeader] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const { player, setPlayer } = useGame();
  function Buy(m: number) {
    setPlayer((prev) => ({
      ...prev,
      money: prev.money - m,
    }));
  }

  // Handler for opening detail popup
  const handleViewDetail = () => {
    setShowDetail(true);
  };

  // Handler for user clicking Buy
  const handleBuy = () => {
    // Close detail popup
    setShowDetail(false);
    // Set up confirmation messages
    setConfirmHeader("Asset Bought");
    setConfirmMessage(`You've bought ${title}`);
    // Show confirmation popup
    setShowConfirmation(true);
    Buy(parsePrice(price));
  };

  // Handler for user clicking Rent
  const handleRent = () => {
    setShowDetail(false);
    setConfirmHeader("Asset Rent");
    setConfirmMessage(`You've rent ${title}`);
    setShowConfirmation(true);
  };

  return (
    <div className="flex bg-[#e7e9c5] rounded-xl border-[1.5px] border-black p-2 w-[280px] max-w-md items-center gap-2">
      <img
        src={imageUrl}
        alt={title}
        className="w-[100px] h-[100px] object-cover rounded-lg"
      />
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex justify-between items-start">
          <h3 className="text-[14px] text-black">{title}</h3>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-red-600 font-bold text-[1rem]">{price}</span>
          <button
            className="bg-green-300 text-black px-3 py-[2px] rounded-md shadow-sm text-sm"
            onClick={handleViewDetail}
          >
            View Detail
          </button>
        </div>

        <div className="text-gray-500 text-sm">
          {beds} beds | {baths} baths | {size}
        </div>
        <div className="text-[#6b8e9e] text-sm">{address}</div>
      </div>

      {/* DETAIL POPUP */}
      {showDetail && (
        <>
          {/* Overlay (clicking it also closes the popup) */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowDetail(false)}
          />
          {/* Modal Content */}
          <div className="fixed top-1/2 left-1/2 w-[300px] max-w-[90%] -translate-x-1/2 -translate-y-1/2 bg-white z-50 rounded-md p-4 shadow-md flex flex-col gap-3">
            <h2 className="font-bold text-lg text-center">House Options</h2>
            <p className="text-center">{title}</p>
            <p className="text-center">Price: {price}</p>

            <div className="flex justify-center gap-3">
              <button
                className="bg-blue-500 text-white py-1 px-3 rounded-md"
                onClick={(e) => {
                  e.stopPropagation(); // so clicking doesn't close overlay
                  handleBuy();
                }}
              >
                Buy
              </button>
              <button
                className="bg-amber-400 text-black py-1 px-3 rounded-md"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRent();
                }}
              >
                Rent
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

      {/* CONFIRMATION POPUP */}
      {showConfirmation && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowConfirmation(false)}
          />
          {/* Confirm Box */}
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
