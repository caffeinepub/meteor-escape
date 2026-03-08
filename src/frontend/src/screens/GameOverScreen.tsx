import { Button } from "@/components/ui/button";
import { t, useLanguage } from "@/game/i18n";
import { updateBestLevel, updateHighScore } from "@/game/storage";
import { useTheme } from "@/game/themeContext";
import { getThemeConfig } from "@/game/themes";
import { RotateCcw, Shield, Target, Trophy, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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

const EXPLOSION_PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  angle: (i / 16) * 360,
  distance: 80 + (i % 4) * 30,
  size: 4 + (i % 4),
  delay: (i % 5) * 0.05,
}));

const BG_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: (i * 37 + 13) % 100,
  top: (i * 53 + 7) % 100,
  duration: 3 + (i % 4) * 0.5,
  delay: (i % 6) * 0.4,
  size: 2 + (i % 4),
}));

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
  const { themeId } = useTheme();
  const theme = getThemeConfig(themeId);
  const [highScore, setHighScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const newHighScore = updateHighScore(score);
    setHighScore(newHighScore);
    setIsNewRecord(score >= newHighScore && score > 0);
    updateBestLevel(level);
    const t = setTimeout(() => setShowContent(true), 150);
    return () => clearTimeout(t);
  }, [score, level]);

  return (
    <div
      className="absolute inset-0 flex items-start md:items-center justify-center z-50 overflow-y-auto"
      style={{
        background: `radial-gradient(ellipse at center, ${theme.accentColor}18 0%, rgba(0,0,0,0.92) 70%)`,
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Animated mesh glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            `radial-gradient(ellipse at 30% 40%, ${theme.accentColor}12 0%, transparent 60%)`,
            `radial-gradient(ellipse at 70% 60%, ${theme.primaryColor}10 0%, transparent 60%)`,
            `radial-gradient(ellipse at 30% 40%, ${theme.accentColor}12 0%, transparent 60%)`,
          ],
        }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
      />

      {/* Floating background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {BG_PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              background:
                p.id % 3 === 0
                  ? theme.accentColor
                  : p.id % 3 === 1
                    ? theme.primaryColor
                    : theme.secondaryColor,
            }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: p.duration,
              repeat: Number.POSITIVE_INFINITY,
              delay: p.delay,
            }}
          />
        ))}
      </div>

      {/* NEW RECORD starburst (behind card) */}
      <AnimatePresence>
        {isNewRecord && showContent && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring", bounce: 0.5 }}
            className="absolute pointer-events-none"
            style={{ top: "15%", right: "10%" }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
              className="text-5xl"
            >
              ⭐
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 70, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative text-center rounded-3xl max-w-sm w-full mx-4 my-4 overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${theme.accentColor}22 0%, ${theme.cardBg?.replace(/,.*/, "") ?? "oklch(0.14 0.06 265"} 40%, oklch(0.10 0.04 265 / 0.97) 100%)`,
          border: `2px solid ${theme.accentColor}55`,
          boxShadow: `0 0 60px ${theme.accentColor}30, 0 20px 60px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Top gradient stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.accentColor}, ${theme.primaryColor}, transparent)`,
          }}
        />

        {/* Content padding */}
        <div className="px-5 pt-5 pb-6">
          {/* Explosion icon */}
          <div className="relative inline-block mb-4">
            {/* Explosion particle burst */}
            {EXPLOSION_PARTICLES.slice(0, 8).map((p) => (
              <motion.div
                key={p.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: p.size * 0.6,
                  height: p.size * 0.6,
                  background:
                    p.id % 2 === 0 ? theme.accentColor : theme.secondaryColor,
                  top: "50%",
                  left: "50%",
                }}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{
                  x: Math.cos((p.angle * Math.PI) / 180) * p.distance * 0.4,
                  y: Math.sin((p.angle * Math.PI) / 180) * p.distance * 0.4,
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  delay: 0.2 + p.delay,
                  duration: 0.8,
                  ease: "easeOut",
                }}
              />
            ))}

            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.2,
                duration: 0.5,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className="text-5xl"
            >
              💥
            </motion.div>
          </div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2
              className="text-3xl font-black mb-1"
              style={{
                fontFamily: "'Bricolage Grotesque', 'Sora', sans-serif",
                color: theme.accentColor,
                textShadow: `0 0 30px ${theme.accentColor}80, 0 2px 0 rgba(0,0,0,0.5)`,
                letterSpacing: "-0.02em",
              }}
            >
              {t("gameover.title", lang)}
            </h2>
            {playerName && (
              <p
                className="text-sm mb-4 font-semibold"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  color: `${theme.primaryColor}80`,
                }}
              >
                {playerName}
              </p>
            )}
          </motion.div>

          {/* Main stats: Score + Level */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="grid grid-cols-2 gap-3 mb-4"
          >
            <div
              className="p-4 rounded-2xl text-center"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryColor}22, ${theme.primaryColor}08)`,
                border: `1.5px solid ${theme.primaryColor}40`,
                boxShadow: `0 4px 16px ${theme.primaryColor}15`,
              }}
            >
              <Target
                size={16}
                className="mx-auto mb-1.5"
                style={{
                  color: theme.primaryColor,
                  filter: `drop-shadow(0 0 6px ${theme.primaryColor})`,
                }}
              />
              <p
                className="text-xs font-bold tracking-widest mb-1"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  color: `${theme.primaryColor}80`,
                  textTransform: "uppercase",
                }}
              >
                {t("gameover.score_label", lang)}
              </p>
              <p
                className="text-3xl font-black leading-none"
                style={{
                  color: theme.primaryColor,
                  textShadow: `0 0 15px ${theme.primaryColor}70`,
                  fontFamily: "'Bricolage Grotesque', monospace",
                }}
              >
                {score.toLocaleString()}
              </p>
            </div>

            <div
              className="p-4 rounded-2xl text-center"
              style={{
                background: `linear-gradient(135deg, ${theme.secondaryColor}22, ${theme.secondaryColor}08)`,
                border: `1.5px solid ${theme.secondaryColor}40`,
                boxShadow: `0 4px 16px ${theme.secondaryColor}15`,
              }}
            >
              <Zap
                size={16}
                className="mx-auto mb-1.5"
                style={{
                  color: theme.secondaryColor,
                  filter: `drop-shadow(0 0 6px ${theme.secondaryColor})`,
                }}
              />
              <p
                className="text-xs font-bold tracking-widest mb-1"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  color: `${theme.secondaryColor}80`,
                  textTransform: "uppercase",
                }}
              >
                {t("gameover.level_label", lang)}
              </p>
              <p
                className="text-3xl font-black leading-none"
                style={{
                  color: theme.secondaryColor,
                  textShadow: `0 0 15px ${theme.secondaryColor}70`,
                  fontFamily: "'Bricolage Grotesque', monospace",
                }}
              >
                {level}
              </p>
            </div>
          </motion.div>

          {/* High score row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.46 }}
            className="mb-4 px-4 py-3 rounded-2xl"
            style={{
              background: isNewRecord
                ? `linear-gradient(135deg, ${theme.secondaryColor}22, ${theme.secondaryColor}08)`
                : `${theme.primaryColor}0a`,
              border: isNewRecord
                ? `1.5px solid ${theme.secondaryColor}55`
                : `1px solid ${theme.primaryColor}18`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy
                  size={16}
                  style={{
                    color: theme.secondaryColor,
                    filter: `drop-shadow(0 0 6px ${theme.secondaryColor})`,
                  }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    color: `${theme.secondaryColor}80`,
                  }}
                >
                  {t("gameover.highscore_label", lang)}
                </span>
              </div>
              <span
                className="text-2xl font-black"
                style={{
                  color: theme.secondaryColor,
                  textShadow: `0 0 10px ${theme.secondaryColor}70`,
                  fontFamily: "'Bricolage Grotesque', monospace",
                }}
              >
                {highScore.toLocaleString()}
              </span>
            </div>

            <AnimatePresence>
              {isNewRecord && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.7, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.7, type: "spring", bounce: 0.6 }}
                  className="mt-2 flex justify-center"
                >
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{
                      duration: 1.2,
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                    className="text-xs font-black tracking-widest px-4 py-1.5 rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${theme.secondaryColor}35, ${theme.secondaryColor}15)`,
                      color: theme.secondaryColor,
                      border: `1.5px solid ${theme.secondaryColor}55`,
                      fontFamily: "'Sora', sans-serif",
                      textShadow: `0 0 8px ${theme.secondaryColor}80`,
                    }}
                  >
                    🏆 {t("gameover.new_record", lang)} 🏆
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Session stats chips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52 }}
            className="grid grid-cols-3 gap-2 mb-5"
          >
            <div
              className="p-3 rounded-xl text-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.18 0.10 160 / 0.5), oklch(0.12 0.06 160 / 0.3))",
                border: "1.5px solid oklch(0.58 0.22 160 / 0.4)",
              }}
            >
              <Target
                size={14}
                className="mx-auto mb-1"
                style={{ color: "oklch(0.75 0.20 160)" }}
              />
              <p
                className="text-xs font-bold mb-0.5"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: "9px",
                  letterSpacing: "0.08em",
                  color: "oklch(0.65 0.15 160)",
                  textTransform: "uppercase",
                }}
              >
                DODGE
              </p>
              <p
                className="text-xl font-black"
                style={{
                  color: "oklch(0.82 0.20 160)",
                  fontFamily: "'Bricolage Grotesque', monospace",
                }}
              >
                {meteorsDodged}
              </p>
            </div>
            <div
              className="p-3 rounded-xl text-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.18 0.08 25 / 0.5), oklch(0.12 0.05 25 / 0.3))",
                border: "1.5px solid oklch(0.58 0.24 25 / 0.4)",
              }}
            >
              <Shield
                size={14}
                className="mx-auto mb-1"
                style={{ color: "oklch(0.75 0.22 25)" }}
              />
              <p
                className="text-xs font-bold mb-0.5"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: "9px",
                  letterSpacing: "0.08em",
                  color: "oklch(0.65 0.18 25)",
                  textTransform: "uppercase",
                }}
              >
                HIT
              </p>
              <p
                className="text-xl font-black"
                style={{
                  color: "oklch(0.82 0.22 25)",
                  fontFamily: "'Bricolage Grotesque', monospace",
                }}
              >
                {hits}
              </p>
            </div>
            <div
              className="p-3 rounded-xl text-center"
              style={{
                background: `linear-gradient(135deg, ${theme.secondaryColor}25, ${theme.secondaryColor}0a)`,
                border: `1.5px solid ${theme.secondaryColor}35`,
              }}
            >
              <Zap
                size={14}
                className="mx-auto mb-1"
                style={{ color: theme.secondaryColor }}
              />
              <p
                className="text-xs font-bold mb-0.5"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: "9px",
                  letterSpacing: "0.08em",
                  color: `${theme.secondaryColor}80`,
                  textTransform: "uppercase",
                }}
              >
                BONUS
              </p>
              <p
                className="text-xl font-black"
                style={{
                  color: theme.secondaryColor,
                  fontFamily: "'Bricolage Grotesque', monospace",
                }}
              >
                {powerUpsCollected}
              </p>
            </div>
          </motion.div>

          {/* Restart button */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.58 }}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="relative"
          >
            <Button
              data-ocid="gameover.restart_button"
              onClick={onRestart}
              className="w-full overflow-hidden"
              style={{
                height: "56px",
                fontSize: "16px",
                fontWeight: "900",
                letterSpacing: "0.06em",
                background:
                  theme.btnBg ??
                  `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                border: `2px solid ${theme.primaryColor}70`,
                color: "#fff",
                fontFamily: "'Bricolage Grotesque', 'Sora', sans-serif",
                boxShadow: `0 0 40px ${theme.primaryColor}50, 0 6px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)`,
                borderRadius: "16px",
              }}
            >
              <span className="relative flex items-center justify-center gap-3">
                <RotateCcw size={20} />
                {t("gameover.btn_restart", lang)}
              </span>
            </Button>

            {/* Pulsing glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              animate={{
                boxShadow: [
                  `0 0 0 0 ${theme.primaryColor}60`,
                  `0 0 0 8px ${theme.primaryColor}00`,
                ],
              }}
              transition={{
                duration: 1.8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeOut",
                delay: 0.8,
              }}
            />
          </motion.div>
        </div>

        {/* Bottom gradient stripe */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.primaryColor}, ${theme.secondaryColor}, transparent)`,
          }}
        />
      </motion.div>
    </div>
  );
}
