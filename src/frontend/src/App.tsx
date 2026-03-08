import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { LanguageProvider } from "./game/i18n";
import { getStoredTheme, saveTheme } from "./game/storage";
import { ThemeContext } from "./game/themeContext";
import type { ThemeId } from "./game/themes";
import type { GameScreen as GameScreenType } from "./game/types";
import { GameScreen } from "./screens/GameScreen";
import { StartScreen } from "./screens/StartScreen";

type AppScreen = GameScreenType;

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("start");
  const [playerName, setPlayerName] = useState("");
  const [gameKey, setGameKey] = useState(0);
  const [themeId, setThemeId] = useState<ThemeId>(getStoredTheme);

  function handleSetTheme(id: ThemeId) {
    saveTheme(id);
    setThemeId(id);
  }

  function handleStart(name: string) {
    setPlayerName(name);
    setScreen("game");
  }

  function handleGameOver(_score: number, _level: number) {
    setScreen("start");
    setGameKey((k) => k + 1);
  }

  const themeClass = `theme-${themeId}`;

  return (
    <ThemeContext.Provider value={{ themeId, setTheme: handleSetTheme }}>
      <LanguageProvider>
        <div
          className={`w-full min-h-full ${themeClass}`}
          style={{
            background: "oklch(0.06 0.02 265)",
            height: screen === "game" ? "100%" : "auto",
          }}
        >
          <AnimatePresence mode="wait">
            {screen === "start" && (
              <motion.div
                key="start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full min-h-full"
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
                className="w-full h-screen"
              >
                <GameScreen
                  playerName={playerName}
                  onGameOver={handleGameOver}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </LanguageProvider>
    </ThemeContext.Provider>
  );
}
