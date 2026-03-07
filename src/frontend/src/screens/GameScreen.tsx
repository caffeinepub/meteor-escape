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
import type {
  BodyCenter,
  MediaPipeCamera,
  MediaPipePose,
  Meteor,
  PoseResults,
  PowerUp,
} from "@/game/types";
import { Pause, Play } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameOverScreen } from "./GameOverScreen";
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

export function GameScreen({
  playerName,
  initialScore = 0,
  initialLevel = 1,
  initialLives = MAX_LIVES,
  onGameOver,
}: GameScreenProps) {
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

  // React state (for UI rendering)
  const [_score, setScore] = useState(initialScore);
  const [_lives, setLives] = useState(initialLives);
  const [currentLevel, setCurrentLevel] = useState(initialLevel);
  const [isPaused, setIsPaused] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState({
    level: initialLevel,
    score: initialScore,
  });
  const [showGameOver, setShowGameOver] = useState(false);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [mediaPipeReady, setMediaPipeReady] = useState(false);

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
      console.warn("MediaPipe Pose not available");
      // Fallback: use mouse/touch position
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

      // Try to start camera via MediaPipe Camera helper
      if (window.Camera) {
        const mpCamera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (poseRef.current && videoRef.current && gameActiveRef.current) {
              await poseRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });
        await mpCamera.start();
        cameraRef.current = mpCamera;
      } else {
        // Fallback: getUserMedia directly
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

          // Process frames manually
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

      setMediaPipeReady(true);
    } catch (err) {
      console.error("MediaPipe init error:", err);
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

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isPausedRef.current) {
      // Draw pause overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = "center";
      ctx.font = 'bold 36px "Orbitron", "Sora", monospace';
      ctx.fillStyle = "#00ffcc";
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#00ffcc";
      ctx.fillText("DURAKLATILDI", canvas.width / 2, canvas.height / 2);
      ctx.shadowBlur = 0;
      animFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // --- Update meteors ---
    const updatedMeteors: Meteor[] = [];
    const bodyCenter = bodyCenterRef.current;
    let scoreGained = 0;
    let hitOccurred = false;

    for (const meteor of meteorsRef.current) {
      const updated = updateMeteor(meteor);

      // Check if passed through (dodge)
      if (isMeteorOffScreen(updated, canvas.height)) {
        scoreGained += SCORE_PER_METEOR;

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
        getAudioEngine().playLevelUpSound(); // reuse for pickup feedback
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
        setLevelUpData({ level: newLevel.level, score: newScore });
        setShowLevelUp(true);
        getAudioEngine().playLevelUpSound();
        return;
      }
    }

    // Handle hit
    if (hitOccurred && !isInvincibleRef.current) {
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
  }, []);

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

    // Init MediaPipe
    initMediaPipe();

    // Start game loop after short delay
    const startDelay = setTimeout(() => {
      if (gameActiveRef.current) {
        getAudioEngine().startBackgroundMusic();
        gameLoop();
        scheduleSpawn();
        schedulePowerUpSpawn();
      }
    }, 500);

    return () => {
      gameActiveRef.current = false;
      clearTimeout(startDelay);
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

  // ===================== PAUSE TOGGLE =====================
  function togglePause() {
    const newPaused = !isPausedRef.current;
    isPausedRef.current = newPaused;
    setIsPaused(newPaused);

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

  // ===================== LEVEL UP CONTINUE =====================
  function handleLevelUpContinue() {
    setShowLevelUp(false);
    gameActiveRef.current = true;
    meteorsRef.current = [];
    powerUpsRef.current = [];

    // Reset lives to full on each new level
    livesRef.current = MAX_LIVES;
    setLives(MAX_LIVES);

    // Resume game loop
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
    }
    gameLoop();
    scheduleSpawn();
    schedulePowerUpSpawn();
    getAudioEngine().startBackgroundMusic();
  }

  // ===================== GAME OVER =====================
  function handleGameOver() {
    getAudioEngine().stopBackgroundMusic();
    onGameOver(scoreRef.current, levelRef.current);
  }

  const levelConfig = LEVELS.find((l) => l.level === currentLevel) ?? LEVELS[0];

  return (
    <div className="game-container">
      {/* Camera video (mirrored) */}
      <video ref={videoRef} className="game-video" autoPlay playsInline muted />

      {/* Game canvas */}
      <canvas
        ref={canvasRef}
        data-ocid="game.canvas_target"
        className="game-canvas"
      />

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
                  ? "#FFD700"
                  : "oklch(0.78 0.22 195)",
            fontSize: popup.type !== "score" ? "18px" : undefined,
            fontWeight: "bold",
            textShadow:
              popup.type === "heart"
                ? "0 0 10px #FF4444"
                : popup.type === "coin"
                  ? "0 0 10px #FFD700"
                  : undefined,
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
              color: "oklch(0.78 0.22 195)",
              fontFamily: "'Sora', sans-serif",
              border: "1px solid oklch(0.78 0.22 195 / 0.3)",
            }}
          >
            Kamera başlatılıyor...
          </div>
        </div>
      )}

      {/* Level indicator (top center, shown briefly) */}
      <div
        className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        style={{ fontFamily: "'Sora', sans-serif" }}
      >
        <div className="text-center">
          <span
            className="text-xs opacity-40 tracking-widest"
            style={{ color: "oklch(0.82 0.20 80)" }}
          >
            BÖLÜM {currentLevel} — {levelConfig.spawnMs}ms spawn
          </span>
        </div>
      </div>

      {/* Pause button */}
      <motion.button
        data-ocid="game.pause_button"
        onClick={togglePause}
        className="absolute top-4 right-4 z-40 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
        style={{
          background: "rgba(0,0,0,0.6)",
          border: "1px solid oklch(0.78 0.22 195 / 0.4)",
          color: "oklch(0.78 0.22 195)",
          marginTop: "4px",
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isPaused ? <Play size={16} /> : <Pause size={16} />}
      </motion.button>

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
          />
        )}
      </AnimatePresence>
    </div>
  );
}
