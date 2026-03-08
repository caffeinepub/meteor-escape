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
import { useCallback, useEffect, useRef, useState } from "react";
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
  const langRef = useRef(lang);
  langRef.current = lang;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const poseRef = useRef<MediaPipePose | null>(null);
  const cameraRef = useRef<MediaPipeCamera | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Game state (mutable refs for game loop performance)
  const scoreRef = useRef(initialScore);
  const livesRef = useRef(initialLives);
  const levelRef = useRef(initialLevel);
  const meteorsRef = useRef<Meteor[]>([]);
  const bodyCenterRef = useRef<BodyCenter | null>(null);
  const smoothedBodyRef = useRef<BodyCenter | null>(null);
  const isInvincibleRef = useRef(false);
  const invincibleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHitRef = useRef(false);
  const hitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const powerUpSpawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isPausedRef = useRef(false);
  const gameActiveRef = useRef(true);
  const powerUpsRef = useRef<PowerUp[]>([]);
  // Touch/mouse fallback mode
  const touchModeRef = useRef(false);
  const touchBodyRef = useRef<BodyCenter | null>(null);
  // Session stats
  const statsMeteorsDodgedRef = useRef(0);
  const statsHitsRef = useRef(0);
  const statsPowerUpsRef = useRef(0);

  // React state (for UI rendering)
  const [_score, setScore] = useState(initialScore);
  const [_lives, setLives] = useState(initialLives);
  const [_currentLevel, setCurrentLevel] = useState(initialLevel);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    dodged: 0,
    hits: 0,
    powerUps: 0,
  });
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

  // Score popup helper
  const addScorePopup = useCallback(
    (
      x: number,
      y: number,
      value: number,
      type: "score" | "coin" | "heart" = "score",
    ) => {
      const id = Date.now() + Math.random();
      setScorePopups((prev) => [
        ...prev.slice(-8),
        { id, x, y, value, type, timestamp: Date.now() },
      ]);
      setTimeout(() => {
        setScorePopups((prev) => prev.filter((p) => p.id !== id));
      }, 1200);
    },
    [],
  );

  // ===================== MEDIAPIPE SETUP =====================
  const initMediaPipe = useCallback(async () => {
    if (!videoRef.current) return;

    // Wait for MediaPipe to be available
    let attempts = 0;
    while (!window.Pose && attempts < 30) {
      await new Promise((r) => setTimeout(r, 200));
      attempts++;
    }

    if (!window.Pose) {
      console.warn("MediaPipe Pose not available -- enabling touch mode");
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

        // Landmarks: 11=left shoulder, 12=right shoulder, 23=left hip, 24=right hip
        const ls = lm[11];
        const rs = lm[12];
        const lh = lm[23];
        const rh = lm[24];

        if (!ls || !rs || !lh || !rh) return;

        // Mirror X: MediaPipe gives 0-1 relative coords; video is mirrored so flip X
        const shoulderMidX = (1 - (ls.x + rs.x) / 2) * canvas.width;
        const shoulderMidY = ((ls.y + rs.y) / 2) * canvas.height;
        const hipMidX = (1 - (lh.x + rh.x) / 2) * canvas.width;
        const hipMidY = ((lh.y + rh.y) / 2) * canvas.height;

        // Chest area: 70% shoulder + 30% hip (upper torso)
        const rawX = shoulderMidX * 0.7 + hipMidX * 0.3;
        const rawY = shoulderMidY * 0.7 + hipMidY * 0.3;

        // Exponential moving average smoothing (alpha = 0.4)
        if (!smoothedBodyRef.current) {
          smoothedBodyRef.current = { x: rawX, y: rawY };
        } else {
          smoothedBodyRef.current = {
            x:
              SMOOTHING_ALPHA * rawX +
              (1 - SMOOTHING_ALPHA) * smoothedBodyRef.current.x,
            y:
              SMOOTHING_ALPHA * rawY +
              (1 - SMOOTHING_ALPHA) * smoothedBodyRef.current.y,
          };
        }

        bodyCenterRef.current = smoothedBodyRef.current;
      });

      poseRef.current = pose;

      // Try camera via getUserMedia
      try {
        if (window.Camera) {
          const mpCamera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (
                poseRef.current &&
                videoRef.current &&
                gameActiveRef.current
              ) {
                await poseRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480,
          });
          await mpCamera.start();
          cameraRef.current = mpCamera;
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();

            const processFrame = async () => {
              if (!gameActiveRef.current) return;
              if (
                poseRef.current &&
                videoRef.current &&
                videoRef.current.readyState >= 2
              ) {
                await poseRef.current.send({ image: videoRef.current });
              }
              if (gameActiveRef.current) {
                requestAnimationFrame(processFrame);
              }
            };
            processFrame();
          }
        }
      } catch (cameraErr) {
        console.warn("Camera failed, enabling touch mode:", cameraErr);
        touchModeRef.current = true;
        setTouchMode(true);
      }

      setMediaPipeReady(true);
    } catch (err) {
      console.error("MediaPipe init error:", err);
      touchModeRef.current = true;
      setTouchMode(true);
      setMediaPipeReady(true); // continue without pose
    }
  }, []);

  // ===================== SPAWN LOGIC =====================
  const scheduleSpawn = useCallback(() => {
    if (spawnTimerRef.current) {
      clearTimeout(spawnTimerRef.current);
    }
    if (!gameActiveRef.current || isPausedRef.current) return;

    const levelCfg = getLevelForScore(scoreRef.current);

    spawnTimerRef.current = setTimeout(() => {
      if (!gameActiveRef.current || isPausedRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (meteorsRef.current.length < levelCfg.maxMeteors) {
        const newMeteor = createMeteor(
          canvas.width,
          levelCfg.speedMin,
          levelCfg.speedMax,
        );
        meteorsRef.current = [...meteorsRef.current, newMeteor];
      }
      scheduleSpawn();
    }, levelCfg.spawnMs);
  }, []);

  // ===================== POWER-UP SPAWN =====================
  const schedulePowerUpSpawn = useCallback(() => {
    if (powerUpSpawnTimerRef.current) {
      clearTimeout(powerUpSpawnTimerRef.current);
    }
    if (!gameActiveRef.current || isPausedRef.current) return;

    const interval = getPowerUpSpawnInterval(levelRef.current);

    powerUpSpawnTimerRef.current = setTimeout(() => {
      if (!gameActiveRef.current || isPausedRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const type: "heart" | "coin" =
        Math.random() < POWERUP_HEART_CHANCE ? "heart" : "coin";
      const newPowerUp = createPowerUp(canvas.width, type);
      powerUpsRef.current = [...powerUpsRef.current, newPowerUp];

      schedulePowerUpSpawn();
    }, interval);
  }, []);

  // ===================== GAME LOOP =====================
  const gameLoop = useCallback(() => {
    if (!gameActiveRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      animFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // In touch mode, use touch body position
    const bodyCenter = touchModeRef.current
      ? touchBodyRef.current
      : bodyCenterRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isPausedRef.current) {
      // Draw pause overlay (semi-transparent, actual menu is in DOM)
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      animFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // --- Update meteors ---
    const updatedMeteors: Meteor[] = [];
    let scoreGained = 0;
    let hitOccurred = false;

    for (const meteor of meteorsRef.current) {
      const updated = updateMeteor(meteor);

      // Check if passed through (dodge)
      if (isMeteorOffScreen(updated, canvas.height)) {
        scoreGained += SCORE_PER_METEOR;
        statsMeteorsDodgedRef.current += 1;

        // Dodge sound at lower frequency
        if (Math.random() < 0.4) {
          getAudioEngine().playDodgeSound();
        }

        // Score popup at bottom of screen
        addScorePopup(updated.x, canvas.height - 40, SCORE_PER_METEOR, "score");
        continue; // remove meteor
      }

      // Collision check
      if (bodyCenter && !isInvincibleRef.current) {
        if (checkCollision(updated, bodyCenter)) {
          hitOccurred = true;
          continue; // remove meteor that hit
        }
      }

      updatedMeteors.push(updated);
    }

    meteorsRef.current = updatedMeteors;

    // --- Update power-ups ---
    const updatedPowerUps: PowerUp[] = [];
    for (const pu of powerUpsRef.current) {
      const updated = updatePowerUp(pu);

      // Off screen -- just remove
      if (isPowerUpOffScreen(updated, canvas.height)) {
        continue;
      }

      // Player collision -- pick up
      if (bodyCenter && checkPowerUpCollision(updated, bodyCenter)) {
        statsPowerUpsRef.current += 1;
        if (updated.type === "heart") {
          const newLives = Math.min(livesRef.current + 1, MAX_LIVES);
          livesRef.current = newLives;
          setLives(newLives);
          addScorePopup(updated.x, updated.y, 1, "heart");
        } else {
          const bonus = POWERUP_BONUS_SCORE;
          scoreGained += bonus;
          addScorePopup(updated.x, updated.y, bonus, "coin");
        }
        getAudioEngine().playPickupSound(updated.type);
        continue; // remove collected power-up
      }

      updatedPowerUps.push(updated);
    }
    powerUpsRef.current = updatedPowerUps;

    // Handle score gain
    if (scoreGained > 0) {
      const newScore = scoreRef.current + scoreGained;
      scoreRef.current = newScore;
      setScore(newScore);

      // Check level up
      const newLevel = getLevelForScore(newScore);
      if (newLevel.level > levelRef.current) {
        levelRef.current = newLevel.level;
        setCurrentLevel(newLevel.level);

        // Trigger level up screen
        gameActiveRef.current = false;
        meteorsRef.current = [];

        // Bölüm 50 tamamlandı -- Efsane ekranı
        if (newLevel.level >= LEVELS.length) {
          getAudioEngine().stopBackgroundMusic();
          getAudioEngine().playLevelUpSound();
          setShowLegend(true);
          return;
        }

        setLevelUpData({ level: newLevel.level, score: newScore });
        setShowLevelUp(true);
        getAudioEngine().playLevelUpSound();
        return;
      }
    }

    // Handle hit
    if (hitOccurred && !isInvincibleRef.current) {
      statsHitsRef.current += 1;
      const newLives = livesRef.current - 1;
      livesRef.current = newLives;
      setLives(newLives);

      // Invincibility
      isInvincibleRef.current = true;
      isHitRef.current = true;
      getAudioEngine().playHitSound();

      if (hitTimerRef.current) clearTimeout(hitTimerRef.current);
      hitTimerRef.current = setTimeout(() => {
        isHitRef.current = false;
      }, 300);

      if (invincibleTimerRef.current) clearTimeout(invincibleTimerRef.current);
      invincibleTimerRef.current = setTimeout(() => {
        isInvincibleRef.current = false;
        isHitRef.current = false;
      }, INVINCIBILITY_DURATION);

      if (newLives <= 0) {
        // Game over
        gameActiveRef.current = false;
        getAudioEngine().stopBackgroundMusic();
        getAudioEngine().playGameOverSound();
        setSessionStats({
          dodged: statsMeteorsDodgedRef.current,
          hits: statsHitsRef.current,
          powerUps: statsPowerUpsRef.current,
        });
        setShowGameOver(true);
        return;
      }
    }

    // --- Render ---
    // Draw meteors
    for (const meteor of meteorsRef.current) {
      drawMeteor(ctx, meteor);
    }

    // Draw power-ups
    for (const pu of powerUpsRef.current) {
      drawPowerUp(ctx, pu);
    }

    // Draw player badge
    if (bodyCenter) {
      drawPlayerBadge(
        ctx,
        bodyCenter,
        playerName,
        isHitRef.current,
        isInvincibleRef.current,
      );
    }

    // Draw HUD
    drawHUD(
      ctx,
      livesRef.current,
      scoreRef.current,
      levelRef.current,
      canvas.width,
      t("hud.score", langRef.current),
      t("hud.level", langRef.current),
      themeRef.current.primaryColor,
      themeRef.current.secondaryColor,
    );

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [playerName, addScorePopup]);

  // ===================== RESIZE HANDLER =====================
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (video) {
      video.style.width = "100%";
      video.style.height = "100%";
    }
    // Initialize touch position to center if in touch mode
    if (touchModeRef.current && !touchBodyRef.current) {
      touchBodyRef.current = {
        x: window.innerWidth / 2,
        y: window.innerHeight * 0.5,
      };
    }
  }, []);

  // ===================== COUNTDOWN LOGIC =====================
  const startCountdownAndGame = useCallback(() => {
    setCountdown(3);

    const steps: { value: CountdownValue; delay: number }[] = [
      { value: 3, delay: 0 },
      { value: 2, delay: 1000 },
      { value: 1, delay: 2000 },
      { value: "go", delay: 3000 },
      { value: null, delay: 3700 },
    ];

    for (const step of steps) {
      setTimeout(() => {
        setCountdown(step.value);
        if (step.value === null && gameActiveRef.current) {
          getAudioEngine().startBackgroundMusic();
          gameLoop();
          scheduleSpawn();
          schedulePowerUpSpawn();
        }
      }, step.delay);
    }
  }, [gameLoop, scheduleSpawn, schedulePowerUpSpawn]);

  // ===================== MOUNT / CLEANUP =====================
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
  useEffect(() => {
    gameActiveRef.current = true;
    isPausedRef.current = false;
    scoreRef.current = initialScore;
    livesRef.current = initialLives;
    levelRef.current = initialLevel;
    meteorsRef.current = [];
    powerUpsRef.current = [];

    // Set canvas size
    handleResize();
    window.addEventListener("resize", handleResize);

    // Init MediaPipe then start countdown
    initMediaPipe().then(() => {
      if (gameActiveRef.current) {
        startCountdownAndGame();
      }
    });

    return () => {
      gameActiveRef.current = false;
      window.removeEventListener("resize", handleResize);

      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (spawnTimerRef.current) {
        clearTimeout(spawnTimerRef.current);
        spawnTimerRef.current = null;
      }
      if (powerUpSpawnTimerRef.current) {
        clearTimeout(powerUpSpawnTimerRef.current);
        powerUpSpawnTimerRef.current = null;
      }
      if (invincibleTimerRef.current) {
        clearTimeout(invincibleTimerRef.current);
      }
      if (hitTimerRef.current) {
        clearTimeout(hitTimerRef.current);
      }

      // Stop camera
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }

      // Stop stream tracks
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
      }

      // Close pose
      if (poseRef.current) {
        poseRef.current.close().catch(() => {});
        poseRef.current = null;
      }

      getAudioEngine().stopBackgroundMusic();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ===================== TOUCH / MOUSE MOVE =====================
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!touchModeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    touchBodyRef.current = { x, y };
    bodyCenterRef.current = { x, y };
  }

  // ===================== PAUSE TOGGLE =====================
  function togglePause() {
    const newPaused = !isPausedRef.current;
    isPausedRef.current = newPaused;
    setIsPaused(newPaused);
    setShowPauseMenu(newPaused);

    if (newPaused) {
      getAudioEngine().stopBackgroundMusic();
      if (spawnTimerRef.current) {
        clearTimeout(spawnTimerRef.current);
      }
      if (powerUpSpawnTimerRef.current) {
        clearTimeout(powerUpSpawnTimerRef.current);
      }
    } else {
      getAudioEngine().startBackgroundMusic();
      scheduleSpawn();
      schedulePowerUpSpawn();
    }
  }

  function handleResume() {
    togglePause();
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
    gameActiveRef.current = false;
    getAudioEngine().stopBackgroundMusic();
    onGameOver(scoreRef.current, levelRef.current);
  }

  // ===================== LEVEL UP CONTINUE =====================
  function handleLevelUpContinue() {
    setShowLevelUp(false);
    gameActiveRef.current = true;
    meteorsRef.current = [];
    powerUpsRef.current = [];

    // Reset lives to full on each new level
    livesRef.current = MAX_LIVES;
    setLives(MAX_LIVES);

    // Countdown before resuming
    setCountdown(3);
    const steps: { value: CountdownValue; delay: number }[] = [
      { value: 3, delay: 0 },
      { value: 2, delay: 1000 },
      { value: 1, delay: 2000 },
      { value: "go", delay: 3000 },
      { value: null, delay: 3700 },
    ];

    for (const step of steps) {
      setTimeout(() => {
        setCountdown(step.value);
        if (step.value === null && gameActiveRef.current) {
          if (animFrameRef.current !== null) {
            cancelAnimationFrame(animFrameRef.current);
          }
          getAudioEngine().startBackgroundMusic();
          gameLoop();
          scheduleSpawn();
          schedulePowerUpSpawn();
        }
      }, step.delay);
    }
  }

  // ===================== GAME OVER =====================
  function handleGameOver() {
    getAudioEngine().stopBackgroundMusic();
    onGameOver(scoreRef.current, levelRef.current);
  }

  // Countdown display text
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
      {/* Camera video (mirrored) - hidden in touch mode */}
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

      {/* Touch mode cursor indicator */}
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

      {/* Score popups (DOM layer) */}
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

      {/* MediaPipe loading indicator */}
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

      {/* Language selector + Pause button (top right) */}
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

      {/* Pause Menu Overlay */}
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
              {/* Title */}
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

              {/* Buttons */}
              <div className="flex flex-col gap-3">
                {/* Resume */}
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

                {/* Sound toggle + volume slider */}
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

                {/* Main menu */}
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

      {/* Level Up Screen overlay */}
      <AnimatePresence>
        {showLevelUp && (
          <LevelUpScreen
            level={levelUpData.level}
            score={levelUpData.score}
            onContinue={handleLevelUpContinue}
          />
        )}
      </AnimatePresence>

      {/* Game Over Screen overlay */}
      <AnimatePresence>
        {showGameOver && (
          <GameOverScreen
            score={scoreRef.current}
            level={levelRef.current}
            playerName={playerName}
            onRestart={handleGameOver}
            meteorsDodged={sessionStats.dodged}
            hits={sessionStats.hits}
            powerUpsCollected={sessionStats.powerUps}
          />
        )}
      </AnimatePresence>

      {/* Legend Screen (bölüm 50 tamamlama) */}
      <AnimatePresence>
        {showLegend && (
          <LegendScreen
            score={scoreRef.current}
            playerName={playerName}
            onRestart={handleGameOver}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
