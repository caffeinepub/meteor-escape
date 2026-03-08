import { Button } from "@/components/ui/button";
import { t, useLanguage } from "@/game/i18n";
import { updateBestLevel, updateHighScore } from "@/game/storage";
import { RotateCcw, Shield, Star, Target, Trophy, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface GameOverScreenProps {
  score: number;
  level: number;
  playerName: string;
  onRestart: () => void;
  meteorsDodged?: number;
  hits?: number;
  powerUpsCollected?: number;
}

export function GameOverScreen({
  score,
  level,
  playerName,
  onRestart,
  meteorsDodged = 0,
  hits = 0,
  powerUpsCollected = 0,
}: GameOverScreenProps) {
  const { lang } = useLanguage();
  const [highScore, setHighScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  useEffect(() => {
    const newHighScore = updateHighScore(score);
    setHighScore(newHighScore);
    setIsNewRecord(score >= newHighScore && score > 0);
    updateBestLevel(level);
  }, [score, level]);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{
        background: "rgba(0, 0, 0, 0.88)",
        backdropFilter: "blur(12px)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="text-center px-8 py-10 rounded-3xl max-w-sm w-full mx-4 relative"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.10 0.03 265 / 0.95), oklch(0.08 0.02 265 / 0.98))",
          border: "1px solid oklch(0.65 0.25 25 / 0.5)",
          boxShadow:
            "0 0 40px oklch(0.65 0.25 25 / 0.25), 0 0 80px oklch(0.65 0.25 25 / 0.1)",
        }}
      >
        {/* Decorative top */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-0.5 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.65 0.25 25), transparent)",
          }}
        />

        {/* Game over icon */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.5,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          className="text-5xl mb-3"
        >
          💥
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2
            className="text-4xl font-black mb-1"
            style={{
              fontFamily: "'Orbitron', 'Sora', sans-serif",
              color: "oklch(0.80 0.22 25)",
              textShadow: "0 0 20px oklch(0.65 0.25 25 / 0.7)",
            }}
          >
            {t("gameover.title", lang)}
          </h2>
          {playerName && (
            <p
              className="text-sm opacity-50 mb-5"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {playerName}
            </p>
          )}
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-3 mb-5"
        >
          {/* Final score */}
          <div
            className="p-3 rounded-xl text-center"
            style={{
              background: "oklch(0.12 0.025 265 / 0.6)",
              border: "1px solid oklch(0.78 0.22 195 / 0.3)",
            }}
          >
            <Target
              size={14}
              className="mx-auto mb-1 opacity-60"
              style={{ color: "oklch(0.78 0.22 195)" }}
            />
            <p
              className="text-xs opacity-50 mb-1 tracking-wider"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {t("gameover.score_label", lang)}
            </p>
            <p
              className="text-2xl font-black neon-text-cyan"
              style={{ fontFamily: "'Orbitron', 'Sora', monospace" }}
            >
              {score.toLocaleString()}
            </p>
          </div>

          {/* Level reached */}
          <div
            className="p-3 rounded-xl text-center"
            style={{
              background: "oklch(0.12 0.025 265 / 0.6)",
              border: "1px solid oklch(0.82 0.20 80 / 0.3)",
            }}
          >
            <Star
              size={14}
              className="mx-auto mb-1 opacity-60"
              style={{ color: "oklch(0.82 0.20 80)" }}
            />
            <p
              className="text-xs opacity-50 mb-1 tracking-wider"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {t("gameover.level_label", lang)}
            </p>
            <p
              className="text-2xl font-black neon-text-gold"
              style={{ fontFamily: "'Orbitron', 'Sora', monospace" }}
            >
              {level}
            </p>
          </div>
        </motion.div>

        {/* High score */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6 p-3 rounded-xl"
          style={{
            background: isNewRecord
              ? "oklch(0.15 0.06 80 / 0.4)"
              : "oklch(0.12 0.025 265 / 0.5)",
            border: isNewRecord
              ? "1px solid oklch(0.82 0.20 80 / 0.6)"
              : "1px solid oklch(0.22 0.04 250)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={16} style={{ color: "oklch(0.82 0.20 80)" }} />
              <span
                className="text-sm opacity-60"
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                {t("gameover.highscore_label", lang)}
              </span>
            </div>
            <span
              className="text-xl font-black neon-text-gold"
              style={{ fontFamily: "'Orbitron', 'Sora', monospace" }}
            >
              {highScore.toLocaleString()}
            </span>
          </div>

          {isNewRecord && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, type: "spring" }}
              className="mt-2 text-center"
            >
              <span
                className="text-xs font-bold tracking-widest px-3 py-1 rounded-full"
                style={{
                  background: "oklch(0.65 0.22 80 / 0.3)",
                  color: "oklch(0.90 0.20 80)",
                  border: "1px solid oklch(0.82 0.20 80 / 0.4)",
                  fontFamily: "'Sora', sans-serif",
                }}
              >
                {t("gameover.new_record", lang)}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Session stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="grid grid-cols-3 gap-2 mb-5"
        >
          <div
            className="p-2 rounded-xl text-center"
            style={{
              background: "oklch(0.10 0.025 265 / 0.5)",
              border: "1px solid oklch(0.55 0.20 160 / 0.3)",
            }}
          >
            <Target
              size={12}
              className="mx-auto mb-1 opacity-60"
              style={{ color: "oklch(0.72 0.18 160)" }}
            />
            <p
              className="text-xs opacity-40 mb-0.5"
              style={{ fontFamily: "'Sora', sans-serif", fontSize: "9px" }}
            >
              DODGE
            </p>
            <p
              className="text-base font-black"
              style={{
                color: "oklch(0.72 0.18 160)",
                fontFamily: "'Orbitron', monospace",
              }}
            >
              {meteorsDodged}
            </p>
          </div>
          <div
            className="p-2 rounded-xl text-center"
            style={{
              background: "oklch(0.10 0.025 265 / 0.5)",
              border: "1px solid oklch(0.60 0.22 25 / 0.3)",
            }}
          >
            <Shield
              size={12}
              className="mx-auto mb-1 opacity-60"
              style={{ color: "oklch(0.72 0.20 25)" }}
            />
            <p
              className="text-xs opacity-40 mb-0.5"
              style={{ fontFamily: "'Sora', sans-serif", fontSize: "9px" }}
            >
              HIT
            </p>
            <p
              className="text-base font-black"
              style={{
                color: "oklch(0.72 0.20 25)",
                fontFamily: "'Orbitron', monospace",
              }}
            >
              {hits}
            </p>
          </div>
          <div
            className="p-2 rounded-xl text-center"
            style={{
              background: "oklch(0.10 0.025 265 / 0.5)",
              border: "1px solid oklch(0.82 0.20 80 / 0.3)",
            }}
          >
            <Zap
              size={12}
              className="mx-auto mb-1 opacity-60"
              style={{ color: "oklch(0.82 0.20 80)" }}
            />
            <p
              className="text-xs opacity-40 mb-0.5"
              style={{ fontFamily: "'Sora', sans-serif", fontSize: "9px" }}
            >
              BONUS
            </p>
            <p
              className="text-base font-black"
              style={{
                color: "oklch(0.82 0.20 80)",
                fontFamily: "'Orbitron', monospace",
              }}
            >
              {powerUpsCollected}
            </p>
          </div>
        </motion.div>

        {/* Restart button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            data-ocid="gameover.restart_button"
            onClick={onRestart}
            className="w-full h-12 text-base font-bold tracking-widest"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.50 0.22 25), oklch(0.38 0.18 15))",
              border: "1px solid oklch(0.65 0.25 25 / 0.6)",
              color: "#fff",
              fontFamily: "'Orbitron', 'Sora', sans-serif",
              boxShadow: "0 0 15px oklch(0.65 0.25 25 / 0.4)",
            }}
          >
            <span className="flex items-center gap-2">
              <RotateCcw size={16} />
              {t("gameover.btn_restart", lang)}
            </span>
          </Button>
        </motion.div>

        {/* Decorative bottom */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-0.5 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.78 0.22 195), transparent)",
          }}
        />
      </motion.div>
    </div>
  );
}
