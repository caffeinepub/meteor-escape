import { StarField } from "@/components/StarField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAudioEngine } from "@/game/audioEngine";
import { getHighScore, getPlayerName, setPlayerName } from "@/game/storage";
import { Camera, RefreshCw, Star, Trophy, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface StartScreenProps {
  onStart: (playerName: string) => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [playerName, setPlayerNameState] = useState(() => getPlayerName());
  const [highScore] = useState(() => getHighScore());
  const [cameraStatus, setCameraStatus] = useState<
    "checking" | "ok" | "denied" | "error"
  >("checking");
  const [isStarting, setIsStarting] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    checkCamera();
    return () => {
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
      }
    };
  }, []);

  async function checkCamera() {
    setCameraStatus("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      // Stop it immediately after permission check
      for (const track of stream.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
      setCameraStatus("ok");
    } catch (err: unknown) {
      const errorName = err instanceof Error ? err.name : "unknown";
      if (errorName === "NotAllowedError") {
        setCameraStatus("denied");
      } else {
        setCameraStatus("error");
      }
    }
  }

  function handleStart() {
    if (!playerName.trim() || cameraStatus !== "ok") return;
    setIsStarting(true);
    const name = playerName.trim();
    setPlayerName(name);

    // Initialize audio engine on first user interaction
    try {
      getAudioEngine();
    } catch {
      // silent
    }

    setTimeout(() => {
      onStart(name);
    }, 300);
  }

  const cameraOk = cameraStatus === "ok";
  const canStart = playerName.trim().length > 0 && cameraOk;

  return (
    <div
      className="relative w-full h-full min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.04 0.02 265) 0%, oklch(0.08 0.025 250) 100%)",
      }}
    >
      <StarField />
      <div className="scanline-overlay" />

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center mb-10"
      >
        {/* Decorative meteor icon */}
        <motion.div
          animate={{ rotate: [0, 10, -5, 0], y: [0, -6, 0] }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
          className="text-6xl mb-4 block"
        >
          ☄️
        </motion.div>

        <h1
          className="text-5xl md:text-7xl font-black tracking-tight neon-text-cyan"
          style={{
            fontFamily: "'Orbitron', 'Sora', sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          METEOR
        </h1>
        <h1
          className="text-5xl md:text-7xl font-black tracking-tight neon-text-gold"
          style={{
            fontFamily: "'Orbitron', 'Sora', sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          ESCAPE
        </h1>

        <p
          className="text-sm mt-3 opacity-60 tracking-widest text-foreground"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          GÖVDE HAREKETİYLE METEORları DODGE ET
        </p>
      </motion.div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div
          className="rounded-2xl p-6 md:p-8 neon-border-cyan"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.10 0.025 265 / 0.9), oklch(0.08 0.02 265 / 0.95))",
            backdropFilter: "blur(20px)",
          }}
        >
          {/* High score */}
          {highScore > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 mb-5 p-3 rounded-xl"
              style={{
                background: "oklch(0.12 0.03 80 / 0.3)",
                border: "1px solid oklch(0.82 0.20 80 / 0.3)",
              }}
            >
              <Trophy size={18} className="neon-text-gold flex-shrink-0" />
              <div>
                <span
                  className="text-xs opacity-50 block"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  EN YÜKSEK SKOR
                </span>
                <span
                  className="text-2xl font-bold neon-text-gold"
                  style={{ fontFamily: "'Orbitron', 'Sora', monospace" }}
                >
                  {highScore.toLocaleString()}
                </span>
              </div>
            </motion.div>
          )}

          {/* Player name input */}
          <div className="mb-5">
            <label
              htmlFor="player-name"
              className="block text-xs font-semibold tracking-widest mb-2 opacity-70"
              style={{
                color: "oklch(0.78 0.22 195)",
                fontFamily: "'Sora', sans-serif",
              }}
            >
              OYUNCU İSMİ
            </label>
            <Input
              id="player-name"
              data-ocid="start.name_input"
              value={playerName}
              onChange={(e) => setPlayerNameState(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canStart) handleStart();
              }}
              placeholder="İsminizi girin..."
              maxLength={20}
              className="text-center text-lg font-bold tracking-wide"
              style={{
                background: "oklch(0.08 0.02 265 / 0.8)",
                border: "1px solid oklch(0.78 0.22 195 / 0.4)",
                color: "oklch(0.95 0.02 200)",
                fontFamily: "'Sora', sans-serif",
                fontSize: "18px",
              }}
            />
          </div>

          {/* Camera status */}
          <div className="mb-6">
            <AnimatePresence mode="wait">
              {cameraStatus === "checking" && (
                <motion.div
                  key="checking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-sm p-3 rounded-xl"
                  style={{ background: "oklch(0.12 0.025 265 / 0.5)" }}
                >
                  <RefreshCw size={16} className="animate-spin opacity-60" />
                  <span
                    className="opacity-60"
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    Kamera kontrol ediliyor...
                  </span>
                </motion.div>
              )}

              {cameraStatus === "ok" && (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-sm p-3 rounded-xl"
                  style={{
                    background: "oklch(0.15 0.06 160 / 0.3)",
                    border: "1px solid oklch(0.65 0.20 160 / 0.4)",
                    color: "oklch(0.85 0.15 160)",
                  }}
                >
                  <Camera size={16} />
                  <span style={{ fontFamily: "'Sora', sans-serif" }}>
                    Kamera hazır ✓
                  </span>
                </motion.div>
              )}

              {(cameraStatus === "denied" || cameraStatus === "error") && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl p-3"
                  style={{
                    background: "oklch(0.15 0.05 25 / 0.3)",
                    border: "1px solid oklch(0.60 0.22 25 / 0.4)",
                  }}
                >
                  <p
                    className="text-sm mb-3"
                    style={{
                      color: "oklch(0.85 0.15 25)",
                      fontFamily: "'Sora', sans-serif",
                    }}
                  >
                    Meteor Escape requires camera access to play. Please enable
                    camera permission.
                  </p>
                  <Button
                    data-ocid="start.retry_camera_button"
                    onClick={checkCamera}
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    style={{
                      borderColor: "oklch(0.60 0.22 25 / 0.6)",
                      color: "oklch(0.85 0.15 25)",
                      fontFamily: "'Sora', sans-serif",
                    }}
                  >
                    <RefreshCw size={14} />
                    Retry Camera
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Start button */}
          <motion.div
            whileHover={canStart ? { scale: 1.02 } : {}}
            whileTap={canStart ? { scale: 0.98 } : {}}
          >
            <Button
              data-ocid="start.start_button"
              onClick={handleStart}
              disabled={!canStart || isStarting}
              className="w-full h-14 text-xl font-black tracking-widest neon-btn relative overflow-hidden"
              style={{
                background: canStart
                  ? "linear-gradient(135deg, oklch(0.55 0.22 195), oklch(0.45 0.18 220))"
                  : "oklch(0.2 0.02 265)",
                border: canStart
                  ? "1px solid oklch(0.78 0.22 195 / 0.6)"
                  : "1px solid oklch(0.3 0.02 265)",
                color: canStart ? "#fff" : "oklch(0.4 0.02 265)",
                fontFamily: "'Orbitron', 'Sora', sans-serif",
                boxShadow: canStart
                  ? "0 0 20px oklch(0.78 0.22 195 / 0.4)"
                  : "none",
                transition: "all 0.3s ease",
              }}
            >
              {isStarting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw size={20} className="animate-spin" />
                  BAŞLATILIYOR...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap size={20} />
                  OYUNA BAŞLA
                </span>
              )}
            </Button>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-5 text-center"
          >
            <p
              className="text-xs opacity-40 leading-relaxed"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Kameranın önünde dur ve gövdeni hareket ettirerek
              <br />
              düşen meteorlardan kaç! 3 canın var.
            </p>
          </motion.div>
        </div>

        {/* Level preview pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex justify-center gap-3 mt-5 flex-wrap"
        >
          {[1, 2, 3].map((l) => (
            <div
              key={l}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs opacity-50"
              style={{
                background: "oklch(0.12 0.025 265 / 0.5)",
                border: "1px solid oklch(0.22 0.04 250)",
                fontFamily: "'Sora', sans-serif",
              }}
            >
              <Star size={10} />
              BÖLÜM {l}
            </div>
          ))}
          <div
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs opacity-30"
            style={{
              background: "oklch(0.12 0.025 265 / 0.5)",
              border: "1px solid oklch(0.22 0.04 250)",
              fontFamily: "'Sora', sans-serif",
            }}
          >
            ... BÖLÜM 10
          </div>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-4 text-center text-xs opacity-30 z-10"
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:opacity-80"
        >
          caffeine.ai
        </a>
      </motion.footer>
    </div>
  );
}
