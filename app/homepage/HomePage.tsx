"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Import your JSON file
import startData from "../data/startData.json";
// Import your context
import { useGame } from "../context/GameProvider";

import "./HomePage.css";

export default function HomePage() {
  const router = useRouter();
  const { player, setPlayer } = useGame();

  // State for user’s typed username + server + error messages
  const [username, setUsername] = useState("");
  const [server, setServer] = useState("Please Select Server");
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");

  // Called when the user clicks "PLAY"
  const handlePlay = () => {
    // We use a flag to check if everything is valid before continuing
    let isValid = true;

    // 1) Validate username format "yourname#XXXX"
    const pattern = /^[a-zA-Z0-9]+#\d{4}$/;
    if (!pattern.test(username)) {
      setError("Please enter a username in the format yourname#1234");
      isValid = false;
    } else {
      setError("");
    }

    // 2) Validate server selection
    if (server === "Please Select Server") {
      setServerError("Please select a server before proceeding");
      isValid = false;
    } else {
      setServerError("");
    }

    // If either check failed, do not continue
    if (!isValid) return;

    // 3) Everything is valid -> initialize context with the user’s name + start data
    setPlayer({
      name: username,
      money: startData.money,
      happiness: startData.happiness,
      knowledge: startData.knowledge,
      occupation: startData.occupation,
      age: startData.age,
      cosmetics: startData.cosmetics
    });

    // 4) Go to the dashboard
    router.push("/dashboard");
  };

  return (
    <div className="container">
      <img
        src="logo/logo.png" // Make sure this image is in /public folder
        alt="FinAge Logo"
        width={100}
        height={100}
        className="logo"
      />

      <h1 className="title">FinAge</h1>
      <p className="subtitle">Financial planning game</p>

      {/* Username Input */}
      <input
        type="text"
        className="username-input text-white border p-2 text-center rounded-lg"
        placeholder="Enter your name#1234"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      {error && <div className="error-message text-red-400">{error}</div>}

      {/* Server Select */}
      <select
        className="server-select mt-2 p-2 rounded-lg"
        value={server}
        onChange={(e) => setServer(e.target.value)}
      >
        <option>Please Select Server</option>
        <option>Server 1</option>
        <option>Server 2</option>
        <option>Server 3</option>
      </select>
      {serverError && <div className="error-message text-red-400">{serverError}</div>}

      {/* PLAY Button */}
      <button
        className="play-button px-4 py-2 rounded-lg mt-3"
        onClick={handlePlay}
      >
        PLAY
      </button>
    </div>
  );
}
