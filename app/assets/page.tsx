"use client";
import { useState } from "react";
import TabBook from "../components/tabBook";
import AssetCard from "@/app/components/assetCard";
import CosmeticCard from "@/app/components/CosmeticCard"; // separate component for cosmetics
import { useGame } from "@/app/context/GameProvider";

export default function Assets() {
  type TabCategory = "Assets" | "Cosmetics";
  const [selectedTab, setSelectedTab] = useState<TabCategory>("Assets");

  // Hard-coded data for non-cosmetic items
  const assets = [
    {
      name: "Willow Creek Cottage",
      price: "$2M",
      change: "(+11.11%)",
      imageUrl: "pic/willow.png",
    },
    {
      name: "BYD Yangwang U9",
      price: "$130,000",
      change: "(+4.75%)",
      imageUrl: "pic/byd.png",
    },
  ];

  // Get cosmetics from the player's global state
  const { player } = useGame();
  const cosmetics = player.cosmetics || [];

  // Data object: Assets from hard-coded data, Cosmetics from global state.
  const data: Record<TabCategory, any[]> = {
    Assets: assets,
    Cosmetics: cosmetics,
  };

  // Layout: 2-column grid for Assets, single-column flex for Cosmetics.
  const gridClasses =
    selectedTab === "Assets" ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4";

  return (
    <div className="w-full h-full px-6 p-4 flex flex-col items-center">
      {/* Page Header */}
      <div className="bg-white text-black text-center py-2 rounded-lg mb-4 w-[179px] h-[49px] flex items-center justify-center">
        <h2 className="text-[32px]">ASSETS</h2>
      </div>

      <TabBook>
        {/* .book content */}
        <div className="book p-4 bg-white rounded-l-xl w-full overflow-y-auto">
          {data[selectedTab] && data[selectedTab].length > 0 ? (
            <div className={gridClasses}>
              {data[selectedTab].map((item, index) => (
                <div key={index}>
                  {selectedTab === "Assets" ? (
                    <AssetCard
                      name={item.name}
                      price={item.price}
                      change={item.change}
                      imageUrl={item.imageUrl}
                    />
                  ) : (
                    <CosmeticCard
                      name={item.name}
                      price={item.price}
                      happiness={item.happiness}
                      imageUrl={item.imageUrl}
                      isSelected={item.isSelected || false}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 mt-8">
              No {selectedTab} items available.
            </p>
          )}
        </div>

        {/* Tabs section */}
        <div className="tabs flex flex-col w-[37px]">
          {(["Assets", "Cosmetics"] as TabCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedTab(cat)}
              className={`p-2 border-1 ${
                selectedTab === cat ? "bg-[#B6B885]" : "bg-white"
              }`}
            >
              <p>{cat}</p>
            </button>
          ))}
        </div>
      </TabBook>
    </div>
  );
}
