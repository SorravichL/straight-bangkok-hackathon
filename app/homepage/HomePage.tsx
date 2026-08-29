"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Import your context
import { useGame } from "../context/GameProvider";
import { DEFAULT_SERVER } from "@/app/lib/game";

import "./HomePage.css";

export default function HomePage() {
  const router = useRouter();
  const { joinGame } = useGame();

  // State for user’s typed username + error messages
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  // Kept apart from `error` so a backend failure doesn't read as "bad username".
  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Called when the user clicks "PLAY"
  const handlePlay = async () => {
    // 1) Validate username format "yourname#XXXX"
    const pattern = /^[a-zA-Z0-9]+#\d{4}$/;
    if (!pattern.test(username)) {
      setError("Please enter a username in the format yourname#1234");
      return;
    }
    setError("");

    // 2) Create the player in Supabase (or resume an existing run for this
    //    name) and load it into context.
    setIsJoining(true);
    setJoinError("");
    try {
      await joinGame(username, DEFAULT_SERVER);
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Could not start the game");
      return;
    } finally {
      setIsJoining(false);
    }

    // 3) Go to the dashboard
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

      {/* PLAY Button */}
      <button
        className="play-button px-4 py-2 rounded-lg mt-3"
        onClick={handlePlay}
        disabled={isJoining}
      >
        {isJoining ? "LOADING..." : "PLAY"}
      </button>

      {/* Backend problems get their own line, below the button. */}
      {joinError && (
        <div className="error-message text-red-400 text-xs mt-3 px-4 text-center">
          {joinError}
        </div>
      )}
    </div>
  );
}
