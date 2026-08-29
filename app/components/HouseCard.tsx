"use client";
import { useState } from "react";
import { useGame } from "../context/GameProvider";

type HouseCardProps = {
  imageUrl: string;
  title: string;
  price: string;      // e.g. "$125,000" or "$125K"
  rentPrice: string;  // e.g. "$6,250/yr"
  beds: number;
  baths: number;
  size: string;
  address: string;
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

export default function HouseCard({
  imageUrl,
  title,
  price,
  rentPrice,
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

  function pay(amount: number) {
    setPlayer((prev) => ({
      ...prev,
      money: prev.money - amount,
    }));
  }

  // Handler for opening detail popup
  const handleViewDetail = () => {
    setShowDetail(true);
  };

  // Handler for user clicking Buy
  const handleBuy = () => {
    setShowDetail(false);
    setConfirmHeader("Asset Bought");
    setConfirmMessage(`You've bought ${title} for ${price}`);
    setShowConfirmation(true);
    pay(parsePrice(price));
  };

  // Handler for user clicking Rent
  const handleRent = () => {
    setShowDetail(false);
    setConfirmHeader("Asset Rented");
    setConfirmMessage(`You've rented ${title} for ${rentPrice}`);
    setShowConfirmation(true);
    pay(parsePrice(rentPrice));
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
          <h3 className="text-[14px] text-black font-semibold">{title}</h3>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-red-600 font-bold text-[0.95rem]">Buy: {price}</span>
            <span className="text-blue-700 font-semibold text-[0.85rem]">Rent: {rentPrice}</span>
          </div>
          <button
            className="bg-green-300 text-black px-3 py-[2px] rounded-md shadow-sm text-sm"
            onClick={handleViewDetail}
          >
            Detail
          </button>
        </div>

        <div className="text-gray-500 text-xs mt-1">
          {beds} beds | {baths} baths | {size}
        </div>
        <div className="text-[#6b8e9e] text-xs">{address}</div>
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
            <p className="text-center font-medium">{title}</p>
            
            <div className="flex flex-col gap-1 items-center bg-gray-50 p-2 rounded-md border border-gray-200">
              <p className="text-sm">Buy Price: <span className="font-bold text-red-600">{price}</span></p>
              <p className="text-sm">Rent Term: <span className="font-bold text-blue-700">{rentPrice}</span></p>
            </div>

            <div className="flex justify-center gap-3 mt-2">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-4 rounded-md transition-colors"
                onClick={(e) => {
                  e.stopPropagation(); // so clicking doesn't close overlay
                  handleBuy();
                }}
              >
                Buy
              </button>
              <button
                className="bg-amber-400 hover:bg-amber-500 text-black py-1 px-4 rounded-md transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRent();
                }}
              >
                Rent
              </button>
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