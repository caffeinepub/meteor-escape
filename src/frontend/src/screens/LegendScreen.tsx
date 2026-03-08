import { Button } from "@/components/ui/button";
import { t, useLanguage } from "@/game/i18n";
import { updateBestLevel } from "@/game/storage";
import { useTheme } from "@/game/themeContext";
import { getThemeConfig } from "@/game/themes";
import { RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";

// Multi-layer particles for maximum celebration
const PARTICLES_LAYER1 = Array.from({ length: 22 }, (_, i) => ({
  id: i,
  left: (i * 37 + 13) % 100,
  top: (i * 53 + 7) % 100,
  duration: 2.5 + (i % 5) * 0.4,
  delay: (i % 7) * 0.3,
  size: 3 + (i % 5),
  colorIdx: i % 3,
}));

const PARTICLES_LAYER2 = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: (i * 71 + 29) % 100,
  delay: (i % 5) * 0.5,
  duration: 3 + (i % 4) * 0.7,
  size: 6 + (i % 7),
  colorIdx: i % 3,
}));

const BURST_RAYS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  angle: (i / 12) * 360,
}));

interface LegendScreenProps {
  score: number;
  playerName: string;
  onRestart: () => void;
}

export function LegendScreen({
  score,
  playerName,
  onRestart,
}: LegendScreenProps) {
  const { lang } = useLanguage();
  const { themeId } = useTheme();
  const theme = getThemeConfig(themeId);

  const particleColors = [
    theme.primaryColor,
    theme.secondaryColor,
    theme.accentColor,
  ];

  useEffect(() => {
    updateBestLevel(50);
  }, []);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50 overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at center, ${theme.secondaryColor}25 0%, ${theme.primaryColor}12 35%, rgba(0,0,0,0.94) 75%)`,
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Animated glow pulse */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            `radial-gradient(ellipse at 50% 50%, ${theme.secondaryColor}20 0%, transparent 60%)`,
            `radial-gradient(ellipse at 50% 40%, ${theme.primaryColor}18 0%, transparent 60%)`,
            `radial-gradient(ellipse at 50% 60%, ${theme.accentColor}15 0%, transparent 60%)`,
            `radial-gradient(ellipse at 50% 50%, ${theme.secondaryColor}20 0%, transparent 60%)`,
          ],
        }}
        transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
      />

      {/* Layer 1: Small particle burst */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES_LAYER1.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              background: particleColors[p.colorIdx],
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
            }}
            animate={{
              scale: [0, 1.8, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: p.duration,
              repeat: Number.POSITIVE_INFINITY,
              delay: p.delay,
            }}
          />
        ))}
      </div>

      {/* Layer 2: Confetti falling */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES_LAYER2.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-sm"
            style={{
              background: particleColors[p.colorIdx],
              left: `${p.left}%`,
              top: "-20px",
              width: p.size,
              height: p.size * 1.8,
              opacity: 0,
            }}
            animate={{
              y: [0, "110vh"],
              rotate: [0, p.id % 2 === 0 ? 720 : -720],
              opacity: [0, 0.7, 0.7, 0],
            }}
            transition={{
              duration: p.duration + 2,
              delay: p.delay,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 80, scale: 0.7, rotate: -5 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative text-center rounded-3xl max-w-sm w-full mx-4 overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${theme.secondaryColor}30 0%, ${theme.primaryColor}18 30%, oklch(0.12 0.06 265 / 0.97) 70%, oklch(0.08 0.04 265 / 0.98) 100%)`,
          border: `2px solid ${theme.secondaryColor}60`,
          boxShadow: `0 0 80px ${theme.secondaryColor}40, 0 0 160px ${theme.secondaryColor}15, 0 24px 80px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Top rainbow stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{
            background: `linear-gradient(90deg, ${theme.accentColor}, ${theme.primaryColor}, ${theme.secondaryColor}, ${theme.primaryColor}, ${theme.accentColor})`,
          }}
        />

        <div className="px-7 pt-8 pb-8">
          {/* Starburst rays behind trophy */}
          <div className="relative inline-block mb-2">
            {/* Rotating burst rays */}
            <motion.div
              className="absolute"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
              animate={{ rotate: [0, 360] }}
              transition={{
                duration: 12,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            >
              {BURST_RAYS.map((ray) => (
                <div
                  key={ray.id}
                  className="absolute"
                  style={{
                    width: "2px",
                    height: "50px",
                    background: `linear-gradient(to bottom, ${theme.secondaryColor}70, transparent)`,
                    transformOrigin: "bottom center",
                    transform: `rotate(${ray.angle}deg) translateY(-38px)`,
                    left: "50%",
                    bottom: "50%",
                    marginLeft: "-1px",
                  }}
                />
              ))}
            </motion.div>

            {/* Trophy emoji */}
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.25,
                duration: 0.7,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className="relative text-7xl"
              style={{
                filter: `drop-shadow(0 0 20px ${theme.secondaryColor})`,
              }}
            >
              🏆
            </motion.div>
          </div>

          {/* Stars */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center gap-2 mb-4"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: -16, rotate: -30 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{
                  delay: 0.45 + i * 0.15,
                  type: "spring",
                  bounce: 0.7,
                }}
                className="text-2xl"
                style={{
                  filter: `drop-shadow(0 0 8px ${theme.secondaryColor})`,
                }}
              >
                ⭐
              </motion.span>
            ))}
          </motion.div>

          {/* Player name banner */}
          {playerName && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.38 }}
              className="inline-block px-5 py-2 rounded-full mb-4"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryColor}28, ${theme.accentColor}18)`,
                border: `1.5px solid ${theme.primaryColor}45`,
                boxShadow: `0 0 16px ${theme.primaryColor}25`,
              }}
            >
              <span
                className="text-sm font-black tracking-widest"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  color: theme.primaryColor,
                  textShadow: `0 0 10px ${theme.primaryColor}70`,
                }}
              >
                {playerName}
              </span>
            </motion.div>
          )}

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
          >
            <h2
              className="text-4xl font-black mb-1"
              style={{
                fontFamily: "'Bricolage Grotesque', 'Sora', sans-serif",
                color: theme.secondaryColor,
                textShadow: `0 0 30px ${theme.secondaryColor}90, 0 2px 0 rgba(0,0,0,0.5)`,
                letterSpacing: "-0.02em",
              }}
            >
              {t("legend.title", lang)}
            </h2>
            <p
              className="text-xs tracking-[0.2em] mb-4 font-bold"
              style={{
                color: `${theme.secondaryColor}80`,
                fontFamily: "'Sora', sans-serif",
                textTransform: "uppercase",
              }}
            >
              {t("legend.subtitle", lang)}
            </p>
          </motion.div>

          {/* Legend badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: "spring", bounce: 0.6 }}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full mb-5"
            style={{
              background: `linear-gradient(135deg, ${theme.secondaryColor}28, ${theme.primaryColor}18)`,
              border: `2px solid ${theme.secondaryColor}55`,
              boxShadow: `0 0 24px ${theme.secondaryColor}35`,
            }}
          >
            <motion.span
              animate={{ rotate: [0, 15, -10, 5, 0] }}
              transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY }}
              className="text-lg"
            >
              🛡️
            </motion.span>
            <span
              className="text-sm font-black tracking-widest"
              style={{
                color: theme.secondaryColor,
                fontFamily: "'Sora', sans-serif",
                textShadow: `0 0 12px ${theme.secondaryColor}80`,
              }}
            >
              {t("legend.badge", lang)}
            </span>
          </motion.div>

          {/* Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mb-6 py-4 px-5 rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${theme.primaryColor}25, ${theme.primaryColor}08)`,
              border: `1.5px solid ${theme.primaryColor}45`,
              boxShadow: `0 4px 20px ${theme.primaryColor}20`,
            }}
          >
            <p
              className="text-xs font-bold tracking-widest mb-1"
              style={{
                fontFamily: "'Sora', sans-serif",
                color: `${theme.primaryColor}80`,
                textTransform: "uppercase",
              }}
            >
              {t("legend.score_label", lang)}
            </p>
            <p
              className="text-4xl font-black"
              style={{
                color: theme.primaryColor,
                textShadow: `0 0 24px ${theme.primaryColor}90`,
                fontFamily: "'Bricolage Grotesque', monospace",
              }}
            >
              {score.toLocaleString()}
            </p>
          </motion.div>

          {/* Restart button */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="relative"
          >
            <Button
              data-ocid="legend.restart_button"
              onClick={onRestart}
              className="w-full overflow-hidden"
              style={{
                height: "68px",
                fontSize: "18px",
                fontWeight: "900",
                letterSpacing: "0.06em",
                background:
                  theme.btnBg ??
                  `linear-gradient(135deg, ${theme.secondaryColor}, ${theme.primaryColor})`,
                border: `2px solid ${theme.secondaryColor}70`,
                color: "#fff",
                fontFamily: "'Bricolage Grotesque', 'Sora', sans-serif",
                boxShadow: `0 0 50px ${theme.secondaryColor}55, 0 8px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)`,
                borderRadius: "18px",
              }}
            >
              <span className="relative flex items-center justify-center gap-3">
                <RotateCcw size={22} />
                {t("legend.btn_restart", lang)}
              </span>
            </Button>

            {/* Mega pulsing glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              animate={{
                boxShadow: [
                  `0 0 0 0 ${theme.secondaryColor}70`,
                  `0 0 0 12px ${theme.secondaryColor}00`,
                ],
              }}
              transition={{
                duration: 1.4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeOut",
                delay: 0.8,
              }}
            />
          </motion.div>
        </div>

        {/* Bottom gradient stripe */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2"
          style={{
            background: `linear-gradient(90deg, ${theme.accentColor}, ${theme.primaryColor}, ${theme.secondaryColor}, ${theme.primaryColor}, ${theme.accentColor})`,
          }}
        />
      </motion.div>
    </div>
  );
}
