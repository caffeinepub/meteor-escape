import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { GameScreen as GameScreenType } from "./game/types";
import { GameScreen } from "./screens/GameScreen";
import { StartScreen } from "./screens/StartScreen";

type AppScreen = GameScreenType;

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("start");
  const [playerName, setPlayerName] = useState("");
  const [gameKey, setGameKey] = useState(0); // force re-mount on restart

  function handleStart(name: string) {
    setPlayerName(name);
    setScreen("game");
  }

  function handleGameOver(_score: number, _level: number) {
    // Return to start screen
    setScreen("start");
    setGameKey((k) => k + 1);
  }

  return (
    <div
      className="w-full h-full"
      style={{ background: "oklch(0.06 0.02 265)" }}
    >
      <AnimatePresence mode="wait">
        {screen === "start" && (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <StartScreen onStart={handleStart} />
          </motion.div>
        )}

        {screen === "game" && (
          <motion.div
            key={`game-${gameKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            <GameScreen playerName={playerName} onGameOver={handleGameOver} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
