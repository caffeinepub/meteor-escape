import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface LevelUpScreenProps {
  level: number;
  score: number;
  onContinue: () => void;
}

export function LevelUpScreen({
  level,
  score,
  onContinue,
}: LevelUpScreenProps) {
  const [countdown, setCountdown] = useState(3);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const calledRef = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: level is intentional dep for reset
  useEffect(() => {
    calledRef.current = false;
    setCountdown(3);

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

  const levelNames: Record<number, string> = {
    2: "SICAK BAŞLANGIÇ",
    3: "METEOR YAĞMURU",
    4: "FIRTINA KAPISI",
    5: "KARANLIk GÜÇ",
    6: "KIZIL ZEMIN",
    7: "ÖLÜM SARMALISI",
    8: "YILDIZ KABISI",
    9: "KAOS BOYUTU",
    10: "METEOR CENNETİ",
  };

  const levelSubtitle = levelNames[level] ?? "SONRAKI BÖLÜM";

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50"
      style={{ background: "rgba(0, 0, 0, 0.82)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.3, rotate: -5 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="text-center px-8 py-10 rounded-3xl max-w-sm w-full mx-4 relative"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.10 0.03 265 / 0.95), oklch(0.08 0.02 265 / 0.98))",
          border: "1px solid oklch(0.82 0.20 80 / 0.5)",
          boxShadow:
            "0 0 40px oklch(0.82 0.20 80 / 0.3), 0 0 80px oklch(0.82 0.20 80 / 0.15)",
        }}
      >
        {/* Decorative top line */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-0.5 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.82 0.20 80), transparent)",
          }}
        />

        {/* Level badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.2,
            duration: 0.4,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 mx-auto"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.65 0.22 80), oklch(0.45 0.18 60))",
            boxShadow: "0 0 30px oklch(0.82 0.20 80 / 0.5)",
          }}
        >
          <span
            className="text-3xl font-black text-black"
            style={{ fontFamily: "'Orbitron', 'Sora', sans-serif" }}
          >
            {level}
          </span>
        </motion.div>

        {/* Level title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p
            className="text-xs tracking-[0.3em] mb-1 opacity-60"
            style={{
              color: "oklch(0.82 0.20 80)",
              fontFamily: "'Sora', sans-serif",
            }}
          >
            BÖLÜM
          </p>
          <h2
            className="text-4xl font-black mb-1 neon-text-gold"
            style={{ fontFamily: "'Orbitron', 'Sora', sans-serif" }}
          >
            BÖLÜM {level}
          </h2>
          <p
            className="text-sm tracking-widest opacity-70 mb-6"
            style={{
              color: "oklch(0.82 0.20 80)",
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {levelSubtitle}
          </p>
        </motion.div>

        {/* Score */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-7 p-3 rounded-xl"
          style={{
            background: "oklch(0.12 0.025 265 / 0.5)",
            border: "1px solid oklch(0.78 0.22 195 / 0.3)",
          }}
        >
          <p
            className="text-xs opacity-50 mb-1 tracking-widest"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            MEVCUT PUAN
          </p>
          <p
            className="text-3xl font-black neon-text-cyan"
            style={{ fontFamily: "'Orbitron', 'Sora', monospace" }}
          >
            {score.toLocaleString()}
          </p>
        </motion.div>

        {/* Countdown */}
        <motion.div
          key={countdown}
          initial={{ scale: 1.3, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-5"
        >
          <p
            className="text-xs opacity-40 mb-1"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            {countdown > 0
              ? `${countdown} saniyede otomatik başlar`
              : "Başlıyor..."}
          </p>
          <div className="flex justify-center gap-2 mt-2">
            {[3, 2, 1].map((n) => (
              <div
                key={n}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  background:
                    countdown >= n
                      ? "oklch(0.82 0.20 80)"
                      : "oklch(0.25 0.02 265)",
                  boxShadow:
                    countdown >= n ? "0 0 6px oklch(0.82 0.20 80)" : "none",
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Start button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            data-ocid="levelup.start_button"
            onClick={handleStart}
            className="w-full h-12 text-base font-bold tracking-widest"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.55 0.22 195), oklch(0.45 0.18 220))",
              border: "1px solid oklch(0.78 0.22 195 / 0.6)",
              color: "#fff",
              fontFamily: "'Orbitron', 'Sora', sans-serif",
              boxShadow: "0 0 15px oklch(0.78 0.22 195 / 0.4)",
            }}
          >
            <span className="flex items-center gap-2">
              <Zap size={16} />
              HEMEN BAŞLA
            </span>
          </Button>
        </motion.div>

        {/* Decorative bottom line */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-0.5 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(0.78 0.22 195), transparent)",
          }}
        />
      </motion.div>
    </div>
  );
}
