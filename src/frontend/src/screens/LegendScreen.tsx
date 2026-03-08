import { Button } from "@/components/ui/button";
import { t, useLanguage } from "@/game/i18n";
import { updateBestLevel } from "@/game/storage";
import { RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";

const PARTICLE_COLORS = ["oklch(0.82 0.20 80)", "oklch(0.78 0.22 195)", "#fff"];
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  color: PARTICLE_COLORS[i % 3],
  left: (i * 37 + 13) % 100,
  top: (i * 53 + 7) % 100,
  duration: 2 + (i % 5) * 0.4,
  delay: (i % 7) * 0.3,
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

  useEffect(() => {
    updateBestLevel(50);
  }, []);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{
        background: "rgba(0, 0, 0, 0.92)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Particle burst background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: p.color,
              left: `${p.left}%`,
              top: `${p.top}%`,
            }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: p.duration,
              repeat: Number.POSITIVE_INFINITY,
              delay: p.delay,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="text-center px-8 py-10 rounded-3xl max-w-sm w-full mx-4 relative"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.12 0.04 80 / 0.95), oklch(0.08 0.02 265 / 0.98))",
          border: "1px solid oklch(0.82 0.20 80 / 0.6)",
          boxShadow:
            "0 0 60px oklch(0.82 0.20 80 / 0.35), 0 0 120px oklch(0.82 0.20 80 / 0.15)",
        }}
      >
        {/* Top glow line */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-0.5 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.82 0.20 80), transparent)",
          }}
        />

        {/* Trophy icon */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.6,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          className="text-6xl mb-3"
        >
          🏆
        </motion.div>

        {/* Stars */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 }}
          className="flex justify-center gap-1 mb-3"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.12 }}
              className="text-xl"
            >
              ⭐
            </motion.span>
          ))}
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2
            className="text-4xl font-black mb-1 neon-text-gold"
            style={{ fontFamily: "'Orbitron', 'Sora', sans-serif" }}
          >
            {t("legend.title", lang)}
          </h2>
          <p
            className="text-xs tracking-widest mb-1 opacity-70"
            style={{
              color: "oklch(0.82 0.20 80)",
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {t("legend.subtitle", lang)}
          </p>
          {playerName && (
            <p
              className="text-sm opacity-50 mb-4"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {playerName}
            </p>
          )}
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
          style={{
            background: "oklch(0.65 0.22 80 / 0.25)",
            border: "1px solid oklch(0.82 0.20 80 / 0.5)",
          }}
        >
          <span className="text-base">🛡️</span>
          <span
            className="text-xs font-bold tracking-widest neon-text-gold"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {t("legend.badge", lang)}
          </span>
        </motion.div>

        {/* Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mb-6 p-3 rounded-xl"
          style={{
            background: "oklch(0.12 0.025 265 / 0.5)",
            border: "1px solid oklch(0.78 0.22 195 / 0.3)",
          }}
        >
          <p
            className="text-xs opacity-50 mb-1 tracking-widest"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {t("legend.score_label", lang)}
          </p>
          <p
            className="text-3xl font-black neon-text-cyan"
            style={{ fontFamily: "'Orbitron', 'Sora', monospace" }}
          >
            {score.toLocaleString()}
          </p>
        </motion.div>

        {/* Restart button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            data-ocid="legend.restart_button"
            onClick={onRestart}
            className="w-full h-12 text-base font-bold tracking-widest"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.55 0.22 80), oklch(0.40 0.18 60))",
              border: "1px solid oklch(0.82 0.20 80 / 0.6)",
              color: "#000",
              fontFamily: "'Orbitron', 'Sora', sans-serif",
              boxShadow: "0 0 20px oklch(0.82 0.20 80 / 0.4)",
            }}
          >
            <span className="flex items-center gap-2">
              <RotateCcw size={16} />
              {t("legend.btn_restart", lang)}
            </span>
          </Button>
        </motion.div>

        {/* Bottom glow line */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-0.5 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.78 0.22 195), transparent)",
          }}
        />
      </motion.div>
    </div>
  );
}
