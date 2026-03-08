import { LanguageSelector } from "@/components/LanguageSelector";
import { getAudioEngine } from "@/game/audioEngine";
import {
  INVINCIBILITY_DURATION,
  LEVELS,
  MAX_LIVES,
  POWERUP_BONUS_SCORE,
  POWERUP_HEART_CHANCE,
  SCORE_PER_METEOR,
  SMOOTHING_ALPHA,
  getLevelForScore,
  getPowerUpSpawnInterval,
} from "@/game/constants";
import { t, useLanguage } from "@/game/i18n";
import {
  checkCollision,
  checkPowerUpCollision,
  createMeteor,
  createPowerUp,
  drawHUD,
  drawMeteor,
  drawPlayerBadge,
  drawPowerUp,
  isMeteorOffScreen,
  isPowerUpOffScreen,
  updateMeteor,
  updatePowerUp,
} from "@/game/meteorUtils";
import { useTheme } from "@/game/themeContext";
import { getThemeConfig } from "@/game/themes";
import type {
  BodyCenter,
  MediaPipeCamera,
  MediaPipePose,
  Meteor,
  PoseResults,
  PowerUp,
} from "@/game/types";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { GameOverScreen } from "./GameOverScreen";
import { LegendScreen } from "./LegendScreen";
import { LevelUpScreen } from "./LevelUpScreen";

interface ScorePopup {
  id: number;
  x: number;
  y: number;
  value: number;
  type: "score" | "coin" | "heart";
  timestamp: number;
}

interface GameScreenProps {
  playerName: string;
  initialScore?: number;
  initialLevel?: number;
  initialLives?: number;
  onGameOver: (score: number, level: number) => void;
}

type CountdownValue = 3 | 2 | 1 | "go" | null;

export function GameScreen({
  playerName,
  initialScore = 0,
  initialLevel = 1,
  initialLives = MAX_LIVES,
  onGameOver,
}: GameScreenProps) {
  const { lang } = useLanguage();
  const { themeId } = useTheme();
  const theme = getThemeConfig(themeId);

  // Keep lang/theme accessible from canvas loop without re-creating callbacks
  const langRef = useRef(lang);
  langRef.current = lang;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const playerNameRef = useRef(playerName);
  playerNameRef.current = playerName;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ---- React state (UI only) ----
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState({
    level: initialLevel,
    score: initialScore,
  });
  const [showGameOver, setShowGameOver] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [mediaPipeReady, setMediaPipeReady] = useState(false);
  const [isMuted, setIsMuted] = useState(() => getAudioEngine().isMuted);
  const [volume, setVolumeState] = useState(() => getAudioEngine().volume);
  const [countdown, setCountdown] = useState<CountdownValue>(3);
  const [touchMode, setTouchMode] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    dodged: 0,
    hits: 0,
    powerUps: 0,
  });

  // Expose final score/level to GameOver/Legend buttons
  const finalScoreRef = useRef(initialScore);
  const finalLevelRef = useRef(initialLevel);

  // Pause state accessible from engine loop
  const isPausedRef = useRef(false);

  // Touch/pointer fallback
  const touchModeRef = useRef(false);
  const touchBodyRef = useRef<BodyCenter | null>(null);

  // Score popup setter ref -- so the effect can call it without being a dependency
  const setScorePopupsRef = useRef(setScorePopups);
  setScorePopupsRef.current = setScorePopups;

  // ===================== MAIN GAME ENGINE EFFECT =====================
  // Everything runs inside a single effect so closures are never stale.
  // We use a local `active` flag instead of a ref shared across renders.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional single-mount game engine
  useEffect(() => {
    // Score popups helper (defined inside effect so it's always fresh)
    function addScorePopup(
      x: number,
      y: number,
      value: number,
      type: "score" | "coin" | "heart" = "score",
    ) {
      const id = Date.now() + Math.random();
      setScorePopupsRef.current((prev) => [
        ...prev.slice(-8),
        { id, x, y, value, type, timestamp: Date.now() },
      ]);
      setTimeout(() => {
        setScorePopupsRef.current((prev) => prev.filter((p) => p.id !== id));
      }, 1200);
    }

    // --- Local mutable state (NOT React state) ---
    let active = true; // set false on cleanup
    let paused = false;
    let animFrame: number | null = null;
    let spawnTimer: ReturnType<typeof setTimeout> | null = null;
    let powerUpTimer: ReturnType<typeof setTimeout> | null = null;
    let invincibleTimer: ReturnType<typeof setTimeout> | null = null;
    let hitTimer: ReturnType<typeof setTimeout> | null = null;
    const countdownTimers: ReturnType<typeof setTimeout>[] = [];

    let score = initialScore;
    let lives = initialLives;
    let level = initialLevel;
    let meteors: Meteor[] = [];
    let powerUps: PowerUp[] = [];
    let isInvincible = false;
    let isHit = false;
    let bodyCenter: BodyCenter | null = null;
    let smoothedBody: BodyCenter | null = null;

    let statsDodged = 0;
    let statsHits = 0;
    let statsPowerUps = 0;

    // MediaPipe handles
    let poseHandle: MediaPipePose | null = null;
    let cameraHandle: MediaPipeCamera | null = null;
    let streamHandle: MediaStream | null = null;

    // --- Canvas / resize ---
    function resizeCanvas() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (!bodyCenter) {
        bodyCenter = {
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.55,
        };
      }
      if (!touchBodyRef.current) {
        touchBodyRef.current = {
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.5,
        };
      }
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // --- Spawn ---
    function scheduleSpawn() {
      if (spawnTimer) clearTimeout(spawnTimer);
      if (!active || paused) return;
      const cfg = getLevelForScore(score);
      spawnTimer = setTimeout(() => {
        if (!active || paused) return;
        const canvas = canvasRef.current;
        if (canvas && meteors.length < cfg.maxMeteors) {
          meteors = [
            ...meteors,
            createMeteor(canvas.width, cfg.speedMin, cfg.speedMax),
          ];
        }
        scheduleSpawn();
      }, cfg.spawnMs);
    }

    function schedulePowerUpSpawn() {
      if (powerUpTimer) clearTimeout(powerUpTimer);
      if (!active || paused) return;
      const interval = getPowerUpSpawnInterval(level);
      powerUpTimer = setTimeout(() => {
        if (!active || paused) return;
        const canvas = canvasRef.current;
        if (canvas) {
          const type: "heart" | "coin" =
            Math.random() < POWERUP_HEART_CHANCE ? "heart" : "coin";
          powerUps = [...powerUps, createPowerUp(canvas.width, type)];
        }
        schedulePowerUpSpawn();
      }, interval);
    }

    // --- End game helpers ---
    function triggerGameOver() {
      active = false;
      getAudioEngine().stopBackgroundMusic();
      getAudioEngine().playGameOverSound();
      finalScoreRef.current = score;
      finalLevelRef.current = level;
      setSessionStats({
        dodged: statsDodged,
        hits: statsHits,
        powerUps: statsPowerUps,
      });
      setShowGameOver(true);
    }

    function triggerLegend() {
      active = false;
      getAudioEngine().stopBackgroundMusic();
      getAudioEngine().playLevelUpSound();
      finalScoreRef.current = score;
      finalLevelRef.current = level;
      setShowLegend(true);
    }

    function triggerLevelUp(newLevel: number, newScore: number) {
      active = false;
      meteors = [];
      powerUps = [];
      getAudioEngine().playLevelUpSound();
      finalScoreRef.current = newScore;
      finalLevelRef.current = newLevel;
      setLevelUpData({ level: newLevel, score: newScore });
      setShowLevelUp(true);
    }

    // --- Game loop ---
    function gameLoop() {
      if (!active) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) {
        animFrame = requestAnimationFrame(gameLoop);
        return;
      }

      const center = touchModeRef.current
        ? (touchBodyRef.current ?? {
            x: canvas.width / 2,
            y: canvas.height * 0.55,
          })
        : (bodyCenter ?? {
            x: canvas.width / 2,
            y: canvas.height * 0.55,
          });

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (paused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        animFrame = requestAnimationFrame(gameLoop);
        return;
      }

      // Update meteors
      const nextMeteors: Meteor[] = [];
      let scoreGained = 0;
      let hitOccurred = false;

      for (const meteor of meteors) {
        const updated = updateMeteor(meteor);

        if (isMeteorOffScreen(updated, canvas.height)) {
          scoreGained += SCORE_PER_METEOR;
          statsDodged += 1;
          if (Math.random() < 0.4) getAudioEngine().playDodgeSound();
          addScorePopup(
            updated.x,
            canvas.height - 40,
            SCORE_PER_METEOR,
            "score",
          );
          continue;
        }

        if (!isInvincible && checkCollision(updated, center)) {
          hitOccurred = true;
          continue;
        }

        nextMeteors.push(updated);
      }
      meteors = nextMeteors;

      // Update power-ups
      const nextPowerUps: PowerUp[] = [];
      for (const pu of powerUps) {
        const updated = updatePowerUp(pu);
        if (isPowerUpOffScreen(updated, canvas.height)) continue;

        if (checkPowerUpCollision(updated, center)) {
          statsPowerUps += 1;
          if (updated.type === "heart") {
            lives = Math.min(lives + 1, MAX_LIVES);
            setSessionStats((s) => ({ ...s })); // trigger re-eval via state
            addScorePopup(updated.x, updated.y, 1, "heart");
          } else {
            scoreGained += POWERUP_BONUS_SCORE;
            addScorePopup(updated.x, updated.y, POWERUP_BONUS_SCORE, "coin");
          }
          getAudioEngine().playPickupSound(updated.type);
          continue;
        }

        nextPowerUps.push(updated);
      }
      powerUps = nextPowerUps;

      // Apply score gain
      if (scoreGained > 0) {
        score += scoreGained;
        finalScoreRef.current = score;
        // Sync HUD
        const newLevelCfg = getLevelForScore(score);
        if (newLevelCfg.level > level) {
          level = newLevelCfg.level;
          finalLevelRef.current = level;

          if (newLevelCfg.level >= LEVELS.length) {
            triggerLegend();
            return;
          }
          triggerLevelUp(newLevelCfg.level, score);
          return;
        }
      }

      // Apply hit
      if (hitOccurred && !isInvincible) {
        statsHits += 1;
        lives -= 1;
        isInvincible = true;
        isHit = true;
        getAudioEngine().playHitSound();

        if (hitTimer) clearTimeout(hitTimer);
        hitTimer = setTimeout(() => {
          isHit = false;
        }, 300);

        if (invincibleTimer) clearTimeout(invincibleTimer);
        invincibleTimer = setTimeout(() => {
          isInvincible = false;
          isHit = false;
        }, INVINCIBILITY_DURATION);

        if (lives <= 0) {
          triggerGameOver();
          return;
        }
      }

      // Render
      for (const m of meteors) drawMeteor(ctx, m);
      for (const pu of powerUps) drawPowerUp(ctx, pu);

      drawPlayerBadge(ctx, center, playerNameRef.current, isHit, isInvincible);
      drawHUD(
        ctx,
        lives,
        score,
        level,
        canvas.width,
        t("hud.score", langRef.current),
        t("hud.level", langRef.current),
        themeRef.current.primaryColor,
        themeRef.current.secondaryColor,
      );

      animFrame = requestAnimationFrame(gameLoop);
    }

    // --- Countdown then start ---
    function startCountdown() {
      setCountdown(3);
      const steps: { value: CountdownValue; delay: number }[] = [
        { value: 3, delay: 0 },
        { value: 2, delay: 1000 },
        { value: 1, delay: 2000 },
        { value: "go", delay: 3000 },
        { value: null, delay: 3700 },
      ];
      for (const step of steps) {
        const tid = setTimeout(() => {
          if (!active) return;
          setCountdown(step.value);
          if (step.value === null) {
            getAudioEngine().startBackgroundMusic();
            gameLoop();
            scheduleSpawn();
            schedulePowerUpSpawn();
          }
        }, step.delay);
        countdownTimers.push(tid);
      }
    }

    // --- MediaPipe init ---
    async function initMediaPipe() {
      if (!videoRef.current) return;

      let attempts = 0;
      while (!window.Pose && attempts < 30) {
        await new Promise((r) => setTimeout(r, 200));
        attempts++;
      }

      if (!active) return; // unmounted during wait

      if (!window.Pose) {
        touchModeRef.current = true;
        setTouchMode(true);
        setMediaPipeReady(true);
        return;
      }

      try {
        const pose = new window.Pose({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults((results: PoseResults) => {
          if (!results.poseLandmarks || !canvasRef.current) return;
          const canvas = canvasRef.current;
          const lm = results.poseLandmarks;
          const ls = lm[11];
          const rs = lm[12];
          const lh = lm[23];
          const rh = lm[24];
          if (!ls || !rs || !lh || !rh) return;

          const shoulderMidX = (1 - (ls.x + rs.x) / 2) * canvas.width;
          const shoulderMidY = ((ls.y + rs.y) / 2) * canvas.height;
          const hipMidX = (1 - (lh.x + rh.x) / 2) * canvas.width;
          const hipMidY = ((lh.y + rh.y) / 2) * canvas.height;

          const rawX = shoulderMidX * 0.7 + hipMidX * 0.3;
          const rawY = shoulderMidY * 0.7 + hipMidY * 0.3;

          if (!smoothedBody) {
            smoothedBody = { x: rawX, y: rawY };
          } else {
            smoothedBody = {
              x:
                SMOOTHING_ALPHA * rawX + (1 - SMOOTHING_ALPHA) * smoothedBody.x,
              y:
                SMOOTHING_ALPHA * rawY + (1 - SMOOTHING_ALPHA) * smoothedBody.y,
            };
          }
          bodyCenter = smoothedBody;
        });

        poseHandle = pose;

        try {
          if (window.Camera) {
            const mpCamera = new window.Camera(videoRef.current, {
              onFrame: async () => {
                if (poseHandle && videoRef.current && active) {
                  await poseHandle.send({ image: videoRef.current });
                }
              },
              width: 640,
              height: 480,
            });
            await mpCamera.start();
            if (!active) {
              mpCamera.stop();
              return;
            }
            cameraHandle = mpCamera;
          } else {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: "user",
                width: { ideal: 640 },
                height: { ideal: 480 },
              },
            });
            if (!active) {
              for (const t of stream.getTracks()) t.stop();
              return;
            }
            streamHandle = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              await videoRef.current.play();

              const processFrame = async () => {
                if (!active) return;
                if (
                  poseHandle &&
                  videoRef.current &&
                  videoRef.current.readyState >= 2
                ) {
                  await poseHandle.send({ image: videoRef.current });
                }
                if (active) requestAnimationFrame(processFrame);
              };
              processFrame();
            }
          }
        } catch {
          touchModeRef.current = true;
          setTouchMode(true);
        }

        if (active) setMediaPipeReady(true);
      } catch {
        touchModeRef.current = true;
        setTouchMode(true);
        if (active) setMediaPipeReady(true);
      }
    }

    // --- Boot sequence ---
    initMediaPipe().then(() => {
      if (active) startCountdown();
    });

    // ---- Expose resume/pause so event handlers can call them ----
    // We expose them via refs so the JSX event handlers below can use them.
    pauseResumeRef.current = {
      pause: () => {
        if (!paused) {
          paused = true;
          isPausedRef.current = true;
          setIsPaused(true);
          setShowPauseMenu(true);
          getAudioEngine().stopBackgroundMusic();
          if (spawnTimer) clearTimeout(spawnTimer);
          if (powerUpTimer) clearTimeout(powerUpTimer);
        }
      },
      resume: () => {
        if (paused) {
          paused = false;
          isPausedRef.current = false;
          setIsPaused(false);
          setShowPauseMenu(false);
          getAudioEngine().startBackgroundMusic();
          scheduleSpawn();
          schedulePowerUpSpawn();
        }
      },
      continueAfterLevel: () => {
        // Called from LevelUpScreen continue button
        active = true;
        paused = false;
        isPausedRef.current = false;
        meteors = [];
        powerUps = [];
        lives = MAX_LIVES;
        score = finalScoreRef.current;
        level = finalLevelRef.current;
        setShowLevelUp(false);
        startCountdown();
      },
    };

    // --- Cleanup ---
    return () => {
      active = false;

      for (const tid of countdownTimers) clearTimeout(tid);
      if (animFrame !== null) cancelAnimationFrame(animFrame);
      if (spawnTimer) clearTimeout(spawnTimer);
      if (powerUpTimer) clearTimeout(powerUpTimer);
      if (invincibleTimer) clearTimeout(invincibleTimer);
      if (hitTimer) clearTimeout(hitTimer);

      window.removeEventListener("resize", resizeCanvas);

      if (cameraHandle) {
        cameraHandle.stop();
        cameraHandle = null;
      }
      if (streamHandle) {
        for (const track of streamHandle.getTracks()) track.stop();
        streamHandle = null;
      }
      if (poseHandle) {
        poseHandle.close().catch(() => {});
        poseHandle = null;
      }

      getAudioEngine().stopBackgroundMusic();
    };
  }, []); // single mount, intentionally empty deps

  // Ref to bridge JSX event handlers -> engine functions defined inside effect
  const pauseResumeRef = useRef<{
    pause: () => void;
    resume: () => void;
    continueAfterLevel: () => void;
  }>({
    pause: () => {},
    resume: () => {},
    continueAfterLevel: () => {},
  });

  // ===================== TOUCH / MOUSE MOVE =====================
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!touchModeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    touchBodyRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  // ===================== PAUSE TOGGLE =====================
  function togglePause() {
    if (isPausedRef.current) {
      pauseResumeRef.current.resume();
    } else {
      pauseResumeRef.current.pause();
    }
  }

  function handleResume() {
    pauseResumeRef.current.resume();
  }

  function handleToggleMute() {
    const newMuted = getAudioEngine().toggleMute();
    setIsMuted(newMuted);
  }

  function handleVolumeChange(val: number) {
    getAudioEngine().setVolume(val);
    setVolumeState(val);
    if (val > 0 && isMuted) {
      getAudioEngine().setMute(false);
      setIsMuted(false);
    }
    if (val === 0 && !isMuted) {
      getAudioEngine().setMute(true);
      setIsMuted(true);
    }
  }

  function handleMainMenu() {
    getAudioEngine().stopBackgroundMusic();
    onGameOver(finalScoreRef.current, finalLevelRef.current);
  }

  function handleLevelUpContinue() {
    pauseResumeRef.current.continueAfterLevel();
  }

  function handleGameOver() {
    getAudioEngine().stopBackgroundMusic();
    onGameOver(finalScoreRef.current, finalLevelRef.current);
  }

  function getCountdownText(): string {
    if (countdown === null) return "";
    if (countdown === "go") return t("game.countdown.go", lang);
    return t(`game.countdown.${countdown}`, lang);
  }

  return (
    <div
      className="game-container"
      onPointerMove={handlePointerMove}
      style={{ cursor: touchMode ? "none" : undefined }}
    >
      {/* Camera video (mirrored) */}
      <video
        ref={videoRef}
        className="game-video"
        autoPlay
        playsInline
        muted
        style={{ display: touchMode ? "none" : undefined }}
      />

      {/* Touch mode background */}
      {touchMode && (
        <div
          className="absolute inset-0"
          style={{ background: theme.bgGradient }}
        />
      )}

      {/* Game canvas */}
      <canvas
        ref={canvasRef}
        data-ocid="game.canvas_target"
        className="game-canvas"
      />

      {/* Touch mode indicator */}
      {touchMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div
            className="px-3 py-1.5 rounded-full text-xs font-semibold tracking-widest"
            style={{
              background: "rgba(0,0,0,0.6)",
              border: `1px solid ${theme.primaryColor}60`,
              color: theme.primaryColor,
              fontFamily: "'Sora', sans-serif",
            }}
          >
            {t("game.touch_mode", lang)}
          </div>
        </div>
      )}

      {/* Score popups */}
      {scorePopups.map((popup) => (
        <div
          key={popup.id}
          className="score-popup"
          style={{
            left: popup.x,
            top: popup.y - 50,
            color:
              popup.type === "heart"
                ? "#FF4444"
                : popup.type === "coin"
                  ? theme.secondaryColor
                  : theme.primaryColor,
            fontSize: popup.type !== "score" ? "18px" : undefined,
            fontWeight: "bold",
            textShadow:
              popup.type === "heart"
                ? "0 0 10px #FF4444"
                : popup.type === "coin"
                  ? `0 0 10px ${theme.secondaryColor}`
                  : `0 0 10px ${theme.primaryColor}`,
          }}
        >
          {popup.type === "heart"
            ? "+1 ♥"
            : popup.type === "coin"
              ? `+${popup.value} BONUS`
              : `+${popup.value}`}
        </div>
      ))}

      {/* MediaPipe loading */}
      {!mediaPipeReady && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40">
          <div
            className="px-4 py-2 rounded-full text-sm"
            style={{
              background: "rgba(0,0,0,0.7)",
              color: theme.primaryColor,
              fontFamily: "'Sora', sans-serif",
              border: `1px solid ${theme.primaryColor}50`,
            }}
          >
            {t("game.camera_loading", lang)}
          </div>
        </div>
      )}

      {/* 3-2-1 Countdown overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            key={String(countdown)}
            initial={{ scale: 1.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div
              style={{
                fontFamily: "'Orbitron', 'Sora', sans-serif",
                fontSize: countdown === "go" ? "72px" : "120px",
                fontWeight: "900",
                color: countdown === "go" ? theme.secondaryColor : "#fff",
                textShadow:
                  countdown === "go"
                    ? `0 0 40px ${theme.secondaryColor}E6, 0 0 80px ${theme.secondaryColor}80`
                    : `0 0 40px ${theme.primaryColor}E6, 0 0 80px ${theme.primaryColor}80`,
                letterSpacing: countdown === "go" ? "0.1em" : "0",
              }}
            >
              {getCountdownText()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language + Pause (top right) */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
        <LanguageSelector />
        <button
          type="button"
          data-ocid="game.pause_button"
          onClick={togglePause}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
          style={{
            background: "rgba(0,0,0,0.6)",
            border: `1px solid ${theme.primaryColor}60`,
            color: theme.primaryColor,
          }}
          title={
            isPaused
              ? t("game.pause.resume", lang)
              : t("game.pause.title", lang)
          }
        >
          {isPaused ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="currentColor"
              role="img"
              aria-label="play"
            >
              <title>Play</title>
              <polygon points="2,1 13,7 2,13" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="currentColor"
              role="img"
              aria-label="pause"
            >
              <title>Pause</title>
              <rect x="1" y="1" width="4" height="12" rx="1" />
              <rect x="9" y="1" width="4" height="12" rx="1" />
            </svg>
          )}
        </button>
      </div>

      {/* Pause Menu */}
      <AnimatePresence>
        {showPauseMenu && (
          <motion.div
            key="pause-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center z-50"
            style={{
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(6px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
              className="rounded-3xl px-8 py-8 w-full max-w-xs mx-4 text-center"
              style={{
                background:
                  theme.cardBg ??
                  "linear-gradient(135deg, oklch(0.10 0.03 265 / 0.97), oklch(0.08 0.02 265 / 0.99))",
                border: `1px solid ${theme.primaryColor}60`,
                boxShadow: theme.glow ?? `0 0 40px ${theme.primaryColor}30`,
              }}
            >
              <h2
                className="text-2xl font-black tracking-widest mb-6"
                style={{
                  color: theme.primaryColor,
                  fontFamily: "'Orbitron', 'Sora', sans-serif",
                  textShadow: `0 0 20px ${theme.primaryColor}80`,
                }}
              >
                {t("game.pause.title", lang)}
              </h2>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  data-ocid="pause.resume_button"
                  onClick={handleResume}
                  className="w-full h-12 rounded-xl font-bold tracking-widest text-sm transition-all"
                  style={{
                    background:
                      theme.btnBg ??
                      `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                    border: `1px solid ${theme.primaryColor}90`,
                    color: "#fff",
                    fontFamily: "'Orbitron', 'Sora', sans-serif",
                    boxShadow: `0 0 15px ${theme.primaryColor}50`,
                  }}
                >
                  ▶ {t("game.pause.resume", lang)}
                </button>

                <div
                  className="rounded-xl px-3 py-2"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${theme.primaryColor}30`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      data-ocid="pause.sound_toggle"
                      onClick={handleToggleMute}
                      className="flex items-center gap-1.5 text-sm font-semibold transition-all"
                      style={{
                        color: isMuted
                          ? "oklch(0.45 0.03 265)"
                          : theme.secondaryColor,
                        fontFamily: "'Sora', sans-serif",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <span>{isMuted ? "🔇" : "🔊"}</span>
                      <span>
                        {isMuted
                          ? t("game.pause.sound_off", lang)
                          : t("game.pause.sound_on", lang)}
                      </span>
                    </button>
                    <span
                      className="text-xs opacity-50"
                      style={{
                        fontFamily: "'Orbitron', monospace",
                        color: theme.secondaryColor,
                      }}
                    >
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    data-ocid="pause.volume_slider"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) =>
                      handleVolumeChange(Number.parseFloat(e.target.value))
                    }
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                      accentColor: theme.secondaryColor,
                      background: `linear-gradient(to right, ${theme.secondaryColor} ${(isMuted ? 0 : volume) * 100}%, oklch(0.20 0.02 265) ${(isMuted ? 0 : volume) * 100}%)`,
                    }}
                  />
                </div>

                <button
                  type="button"
                  data-ocid="pause.mainmenu_button"
                  onClick={handleMainMenu}
                  className="w-full h-11 rounded-xl font-semibold tracking-wider text-sm transition-all"
                  style={{
                    background: "oklch(0.12 0.03 25 / 0.4)",
                    border: "1px solid oklch(0.60 0.22 25 / 0.4)",
                    color: "oklch(0.75 0.18 25)",
                    fontFamily: "'Sora', sans-serif",
                  }}
                >
                  ← {t("game.pause.mainmenu", lang)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Screen */}
      <AnimatePresence>
        {showLevelUp && (
          <LevelUpScreen
            level={levelUpData.level}
            score={levelUpData.score}
            onContinue={handleLevelUpContinue}
          />
        )}
      </AnimatePresence>

      {/* Game Over Screen */}
      <AnimatePresence>
        {showGameOver && (
          <GameOverScreen
            score={finalScoreRef.current}
            level={finalLevelRef.current}
            playerName={playerName}
            onRestart={handleGameOver}
            meteorsDodged={sessionStats.dodged}
            hits={sessionStats.hits}
            powerUpsCollected={sessionStats.powerUps}
          />
        )}
      </AnimatePresence>

      {/* Legend Screen */}
      <AnimatePresence>
        {showLegend && (
          <LegendScreen
            score={finalScoreRef.current}
            playerName={playerName}
            onRestart={handleGameOver}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
