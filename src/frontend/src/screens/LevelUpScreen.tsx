import { Button } from "@/components/ui/button";
import { t, useLanguage } from "@/game/i18n";
import { useTheme } from "@/game/themeContext";
import { getThemeConfig } from "@/game/themes";
import { Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface LevelUpScreenProps {
  level: number;
  score: number;
  onContinue: () => void;
}

// Celebration burst particles
const BURST_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  angle: (i / 20) * 360,
  distance: 60 + (i % 5) * 25,
  size: 4 + (i % 5),
  delay: (i % 4) * 0.04,
}));

// Background floating confetti
const CONFETTI = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: (i * 41 + 7) % 100,
  delay: (i % 6) * 0.4,
  duration: 2.5 + (i % 4) * 0.6,
  size: 5 + (i % 6),
  colorIdx: i % 3,
}));

export function LevelUpScreen({
  level,
  score,
  onContinue,
}: LevelUpScreenProps) {
  const { lang } = useLanguage();
  const { themeId } = useTheme();
  const theme = getThemeConfig(themeId);
  const [countdown, setCountdown] = useState(3);
  const [showBurst, setShowBurst] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const calledRef = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: level is intentional dep for reset
  useEffect(() => {
    calledRef.current = false;
    setCountdown(3);
    setShowBurst(false);

    const burstTimer = setTimeout(() => setShowBurst(true), 100);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          if (!calledRef.current) {
            calledRef.current = true;
            setTimeout(onContinue, 100);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(burstTimer);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [level, onContinue]);

  function handleStart() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!calledRef.current) {
      calledRef.current = true;
      onContinue();
    }
  }

  const levelSubtitle =
    t(`levelup.name.${level}`, lang) !== `levelup.name.${level}`
      ? t(`levelup.name.${level}`, lang)
      : t("levelup.name.default", lang);

  const countdownText = (() => {
    const autoStart = t("levelup.auto_start", lang);
    const starting = t("levelup.starting", lang);
    if (countdown <= 0) return starting;
    if (lang === "tr") return `${countdown} ${autoStart}`;
    if (lang === "zh") return `${countdown} ${autoStart}`;
    if (lang === "hi") return `${countdown} ${autoStart}`;
    if (lang === "ru") return `${autoStart} ${countdown}с`;
    return `${autoStart} ${countdown}s`;
  })();

  const confettiColors = [
    theme.primaryColor,
    theme.secondaryColor,
    theme.accentColor,
  ];

  return (
    <div
      className="absolute inset-0 flex items-start md:items-center justify-center z-50 overflow-y-auto"
      style={{
        background: `radial-gradient(ellipse at center top, ${theme.secondaryColor}20 0%, rgba(0,0,0,0.85) 65%)`,
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Animated glow blobs */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            `radial-gradient(ellipse at 50% 0%, ${theme.secondaryColor}18 0%, transparent 55%)`,
            `radial-gradient(ellipse at 50% 20%, ${theme.primaryColor}15 0%, transparent 55%)`,
            `radial-gradient(ellipse at 50% 0%, ${theme.secondaryColor}18 0%, transparent 55%)`,
          ],
        }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
      />

      {/* Confetti falling */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {CONFETTI.map((c) => (
          <motion.div
            key={c.id}
            className="absolute rounded-sm"
            style={{
              left: `${c.left}%`,
              top: "-30px",
              width: c.size,
              height: c.size * 1.5,
              background: confettiColors[c.colorIdx],
              opacity: 0,
            }}
            animate={{
              y: [0, "105vh"],
              rotate: [0, c.id % 2 === 0 ? 540 : -540],
              opacity: [0, 0.7, 0.7, 0],
            }}
            transition={{
              duration: c.duration + 2,
              delay: c.delay,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.3, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative text-center rounded-3xl max-w-sm w-full mx-4 my-4 overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${theme.secondaryColor}28 0%, ${theme.cardBg?.replace(/,.*/, "") ?? "oklch(0.16 0.08 265"} 40%, oklch(0.10 0.04 265 / 0.97) 100%)`,
          border: `2px solid ${theme.secondaryColor}55`,
          boxShadow: `0 0 60px ${theme.secondaryColor}35, 0 20px 60px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Rainbow top stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{
            background: `linear-gradient(90deg, ${theme.accentColor}, ${theme.primaryColor}, ${theme.secondaryColor}, ${theme.primaryColor}, ${theme.accentColor})`,
          }}
        />

        <div className="px-5 pt-5 pb-6">
          {/* Level badge with burst */}
          <div className="relative inline-flex items-center justify-center mb-3">
            {/* Burst particles */}
            <AnimatePresence>
              {showBurst &&
                BURST_PARTICLES.map((p) => (
                  <motion.div
                    key={p.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: p.size,
                      height: p.size,
                      background:
                        p.id % 3 === 0
                          ? theme.primaryColor
                          : p.id % 3 === 1
                            ? theme.secondaryColor
                            : theme.accentColor,
                    }}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                    animate={{
                      x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                      y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                      scale: [0, 1.2, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      delay: p.delay,
                      duration: 0.7,
                      ease: "easeOut",
                    }}
                  />
                ))}
            </AnimatePresence>

            {/* Ring glow animation */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: "96px",
                height: "96px",
                border: `3px solid ${theme.secondaryColor}`,
                top: "50%",
                left: "50%",
              }}
              animate={{
                scale: [1, 2.2],
                opacity: [0.8, 0],
              }}
              transition={{
                duration: 1.2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeOut",
                delay: 0.3,
              }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{
                width: "96px",
                height: "96px",
                border: `2px solid ${theme.primaryColor}80`,
                top: "50%",
                left: "50%",
              }}
              animate={{
                scale: [1, 1.8],
                opacity: [0.6, 0],
              }}
              transition={{
                duration: 1.2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeOut",
                delay: 0.6,
              }}
            />

            {/* Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.2,
                duration: 0.5,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className="relative w-24 h-24 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  theme.btnBg ??
                  `linear-gradient(135deg, ${theme.secondaryColor}, ${theme.primaryColor})`,
                boxShadow: `0 0 40px ${theme.secondaryColor}60, 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)`,
                border: `2px solid ${theme.secondaryColor}80`,
              }}
            >
              <span
                className="text-4xl font-black"
                style={{
                  fontFamily: "'Bricolage Grotesque', 'Sora', sans-serif",
                  color: "#fff",
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                {level}
              </span>
            </motion.div>
          </div>

          {/* Level title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p
              className="text-xs tracking-[0.3em] mb-1 font-bold"
              style={{
                color: `${theme.secondaryColor}90`,
                fontFamily: "'Sora', sans-serif",
                textTransform: "uppercase",
              }}
            >
              {t("levelup.label", lang)}
            </p>
            <h2
              className="text-3xl font-black mb-1"
              style={{
                fontFamily: "'Bricolage Grotesque', 'Sora', sans-serif",
                color: theme.secondaryColor,
                textShadow: `0 0 25px ${theme.secondaryColor}80, 0 2px 0 rgba(0,0,0,0.5)`,
                letterSpacing: "-0.02em",
              }}
            >
              {t("levelup.title", lang)} {level}
            </h2>
            <p
              className="text-sm tracking-widest font-semibold mb-6"
              style={{
                color: `${theme.secondaryColor}80`,
                fontFamily: "'Sora', sans-serif",
              }}
            >
              {levelSubtitle}
            </p>
          </motion.div>

          {/* Score */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-4 py-3 px-4 rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${theme.primaryColor}22, ${theme.primaryColor}08)`,
              border: `1.5px solid ${theme.primaryColor}40`,
              boxShadow: `0 4px 16px ${theme.primaryColor}15`,
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
              {t("levelup.current_score", lang)}
            </p>
            <p
              className="text-3xl font-black"
              style={{
                color: theme.primaryColor,
                textShadow: `0 0 20px ${theme.primaryColor}80`,
                fontFamily: "'Bricolage Grotesque', monospace",
              }}
            >
              {score.toLocaleString()}
            </p>
          </motion.div>

          {/* Countdown dots */}
          <motion.div
            key={countdown}
            initial={{ scale: 1.2, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <p
              className="text-xs font-semibold mb-2"
              style={{
                fontFamily: "'Sora', sans-serif",
                color: `${theme.secondaryColor}60`,
              }}
            >
              {countdownText}
            </p>
            <div className="flex justify-center gap-3">
              {[3, 2, 1].map((n) => (
                <motion.div
                  key={n}
                  animate={countdown >= n ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.5 }}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: countdown >= n ? "14px" : "10px",
                    height: countdown >= n ? "14px" : "10px",
                    background:
                      countdown >= n
                        ? theme.secondaryColor
                        : "oklch(0.22 0.03 265)",
                    boxShadow:
                      countdown >= n
                        ? `0 0 12px ${theme.secondaryColor}90`
                        : "none",
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Start button */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="relative"
          >
            <Button
              data-ocid="levelup.start_button"
              onClick={handleStart}
              className="w-full overflow-hidden"
              style={{
                height: "56px",
                fontSize: "16px",
                fontWeight: "900",
                letterSpacing: "0.06em",
                background:
                  theme.btnBg ??
                  `linear-gradient(135deg, ${theme.secondaryColor}, ${theme.primaryColor})`,
                border: `2px solid ${theme.secondaryColor}70`,
                color: "#fff",
                fontFamily: "'Bricolage Grotesque', 'Sora', sans-serif",
                boxShadow: `0 0 40px ${theme.secondaryColor}50, 0 6px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)`,
                borderRadius: "16px",
              }}
            >
              <span className="relative flex items-center justify-center gap-3">
                <Zap size={20} />
                {t("levelup.btn_start", lang)}
              </span>
            </Button>

            {/* Pulsing ring */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              animate={{
                boxShadow: [
                  `0 0 0 0 ${theme.secondaryColor}60`,
                  `0 0 0 10px ${theme.secondaryColor}00`,
                ],
              }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeOut",
                delay: 0.6,
              }}
            />
          </motion.div>
        </div>

        {/* Bottom gradient stripe */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1.5"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.primaryColor}, ${theme.secondaryColor}, transparent)`,
          }}
        />
      </motion.div>
    </div>
  );
}
