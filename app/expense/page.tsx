"use client";
import { useState } from "react";
import TabBook from "../components/tabBook";
import HouseCard from "../components/HouseCard";
import CarCard from "../components/carCard";
import ClothingCard from "../components/clothingCard"; // This now acts as the cosmetic card in Expense
import FoodCard from "../components/FoodCard";
import InsuranceCard from "../components/InsuranceCard";
import { useGame } from "@/app/context/GameProvider";

export default function Expense() {
  type Category = "House" | "Car" | "Clothing" | "Food" | "Insurance";
  const [selectedTab, setSelectedTab] = useState<Category>("House");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Call useGame() only once:
  const { player, setPlayer, addCosmetic } = useGame();

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

  const handleSelect = (index: number) => {
    if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      setSelectedIndex(index);
    }
  };

  function Buy(m: number) {
    setPlayer((prev) => ({
      ...prev,
      money: prev.money - m,
    }));
  }

  const assets: Record<Category, any[]> = {
    House: [
      {
        imageUrl: "pic/willow.png",
        title: "Willow Creek Cottage",
        price: "$1.8M",
        beds: 3,
        baths: 2,
        size: "2,100",
        address: "14 Lavender Lane, Cotswolds, UK",
      },
      {
        imageUrl: "pic/sunset.png",
        title: "Sunset Palm Villa",
        price: "$3.4M",
        beds: 5,
        baths: 1,
        size: "3,000",
        address: "718 Ocean Breeze Rd, Malibu, CA",
      },
      {
        imageUrl: "pic/skyfloat.png",
        title: "Sky Float Home",
        price: "$2.5M",
        beds: 2,
        baths: 1,
        size: "1,000",
        address: "Balloon District, Paradise Heights",
      },
      {
        imageUrl: "pic/rustwood.png",
        title: "Rustwood Tiny Cabin",
        price: "$320K",
        beds: 1,
        baths: 1,
        size: "450",
        address: "73 Pinecone Trail, Aspen, CO",
      },
      {
        imageUrl: "pic/baroque.png",
        title: "Baroque Manor Estate",
        price: "$8.7M",
        beds: 6,
        baths: 4,
        size: "10,000",
        address: "Hidden Hills, CA",
      },
    ],

    Car: [
      {
        imageUrl: "pic/byd.png",
        name: "BYD Yangwang U9",
        price: "$236,000",
        specs: ["V12 Hybrid"],
      },
      {
        imageUrl: "pic/mg.png",
        name: "MG Cyberster",
        price: "$45,100",
        specs: ["V6 Plug-in Hybrid"],
      },
      {
        imageUrl: "pic/renault.png",
        name: "Renault Clio",
        price: "$11,000",
        specs: ["Electric"],
      },
      {
        imageUrl: "pic/tesla.png",
        name: "Tesla Model 3",
        price: "$44,130",
        specs: ["Electric"],
      },
      {
        imageUrl: "pic/bmw.png",
        name: "BMW i5",
        price: "$67,795",
        specs: ["Electric Luxury"],
      },
    ],

    // For Clothing, treat these as cosmetics. They start unselected.
    Clothing: [
      {
        imageUrl: "pic/hat.png",
        name: "Red Top Hat",
        price: "$140",
        happiness: "+5 Style",
        isSelected: false,
      },
      {
        imageUrl: "pic/glasses.png",
        name: "Summer Glasses",
        price: "$90",
        happiness: "+3 Sunshine",
        isSelected: false,
      },
      {
        imageUrl: "pic/shirt.png",
        name: "Formal Green Shirt",
        price: "$200",
        happiness: "+2 Formality",
        isSelected: false,
      },
    ],

    Food: [
      {
        imageUrl: "pic/1.png",
        title: "Fast Food",
        costPerYear: "$3,400",
        happiness: 10,
        description: "Convenient, cheap, but not always healthy",
      },
      {
        imageUrl: "pic/2.png",
        title: "Home Meals",
        costPerYear: "$5,200",
        happiness: 25,
        description: "Fresh, balanced, and cooked with love",
      },
      {
        imageUrl: "pic/3.png",
        title: "Healthy Cuisine",
        costPerYear: "$7,800",
        happiness: 35,
        description: "Nutrient-rich meals that fuel your body and mind",
      },
      {
        imageUrl: "pic/4.png",
        title: "Premium Food",
        costPerYear: "$10,000",
        happiness: 50,
        description: "Luxury meals with top-tier ingredients",
      },
    ],

    Insurance: [
      {
        imageUrl: "pic/7.png",
        title: "Home Insurance",
        isSelected: false,
        description: "Covers your house in case of theft or natural disaster",
      },
      {
        imageUrl: "pic/6.png",
        title: "Car Insurance",
        isSelected: false,
        description: "Protects your vehicle from accidents and damage",
      },
      {
        imageUrl: "pic/5.png",
        title: "Life Insurance",
        isSelected: true,
        description: "Financial security for your loved ones",
      },
    ],
  };

  return (
    <div className="w-full h-full px-6 p-4 flex flex-col items-center">
      <div className="bg-white text-black text-center rounded-lg mb-4 w-[179px] h-[49px] flex items-center justify-center">
        <h2 className="text-[32px]">EXPENSE</h2>
      </div>

      <TabBook>
        {/* "book" section */}
        <div className="book p-4 bg-white rounded-l-xl w-full overflow-y-auto flex flex-col gap-3 scrollbar-hidden">
          {assets[selectedTab].length > 0 ? (
            assets[selectedTab].map((item, index) => (
              <div key={index}>
                {selectedTab === "House" && <HouseCard {...item} />}
                {selectedTab === "Car" && <CarCard {...item} />}
                {selectedTab === "Clothing" && (
                  <ClothingCard
                    {...item}
                    onBuy={() => {
                      // Parse happiness (assumes format like "+5 Style")
                      const parsed = parseInt(item.happiness);
                      const happinessValue = isNaN(parsed) ? 0 : parsed;
                      // Add cosmetic to the global inventory
                      addCosmetic({
                        name: item.name,
                        price: item.price,
                        imageUrl: item.imageUrl,
                        happiness: happinessValue,
                      });
                      // Deduct money from player using Buy function
                      Buy(parsePrice(item.price));
                    }}
                  />
                )}
                {selectedTab === "Food" && <FoodCard {...item} />}
                {selectedTab === "Insurance" && (
                  <InsuranceCard
                    imageUrl={item.imageUrl}
                    title={item.title}
                    isSelected={item.isSelected}
                    description={item.description}
                  />
                )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 mt-8">
              No {selectedTab} items available.
            </p>
          )}
        </div>

        {/* Tabs section */}
        <div className="tabs flex flex-col w-[37px]">
          {(Object.keys(assets) as Category[]).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedTab(category)}
              className={`p-2 border-1 ${
                selectedTab === category ? "bg-[#B6B885]" : "bg-white"
              }`}
            >
              <p>{category}</p>
            </button>
          ))}
        </div>
      </TabBook>
    </div>
  );
}
