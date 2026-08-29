"use client";
import React, { createContext, useState, useContext, ReactNode } from "react";

export type CosmeticItem = {
  id?: string;
  name: string;
  price: string;
  imageUrl: string;
  happiness: number;
};

interface PlayerState {
  name: string;
  money: number;
  happiness: number;
  knowledge: number;
  occupation: string;
  age: number;
  cosmetics: CosmeticItem[];
}

interface GameContextType {
  player: PlayerState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  formatLargeNumber: (amount: number) => string;
  addCosmetic: (item: CosmeticItem) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PlayerState>({
    name: "",
    money: 0,
    happiness: 0,
    knowledge: 0,
    occupation: "",
    age: 0,
    cosmetics: [],
  });

  function formatLargeNumber(amount: number): string {
    if (amount >= 1000000||amount <= -1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000||amount <= -1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    } else {
      return `$${amount}`;
    }
  }

  function addCosmetic(item: CosmeticItem) {
    setPlayer((prev) => ({
      ...prev,
      cosmetics: [...prev.cosmetics, item],
    }));
  }

  return (
    <GameContext.Provider value={{ player, setPlayer, formatLargeNumber, addCosmetic }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
