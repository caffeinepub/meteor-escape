import { LanguageSelector } from "@/components/LanguageSelector";
import { StarField } from "@/components/StarField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAudioEngine } from "@/game/audioEngine";
import { LEVELS } from "@/game/constants";
import { t, useLanguage } from "@/game/i18n";
import {
  getBestLevel,
  getHighScore,
  getPlayerName,
  setPlayerName,
} from "@/game/storage";
import { useTheme } from "@/game/themeContext";
import { THEMES, getThemeConfig } from "@/game/themes";
import {
  BookOpen,
  Camera,
  Gamepad2,
  Grid3X3,
  Heart,
  RefreshCw,
  Shield,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface StartScreenProps {
  onStart: (playerName: string) => void;
}

// Floating particle data (deterministic)
const FLOAT_PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: (i * 31 + 17) % 100,
  top: (i * 47 + 11) % 90,
  size: 3 + (i % 6),
  duration: 5 + (i % 6) * 0.8,
  delay: (i % 7) * 0.5,
  useSecondary: i % 3 === 0,
  useAccent: i % 5 === 0,
}));

// Confetti particles
const CONFETTI = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: (i * 41 + 7) % 100,
  delay: (i % 5) * 0.3,
  duration: 3 + (i % 4) * 0.5,
  size: 4 + (i % 5),
}));

const HOW_TO_PLAY = [
  { icon: Camera, key: "how1" },
  { icon: Shield, key: "how2" },
  { icon: Heart, key: "how3" },
  { icon: Star, key: "how4" },
];

const HOW_TO_PLAY_TEXT: Record<string, Record<string, string>> = {
  tr: {
    how1: "Kameranın önünde dur -- gövden görünsün",
    how2: "Meteorlar düşerken sağa-sola hareket et",
    how3: "Kalp topla, can kazan -- coin topla, puan kazan",
    how4: "50 bölüm, her bölümde meteorlar hızlanır",
  },
  en: {
    how1: "Stand in front of the camera -- show your body",
    how2: "Move left and right to dodge falling meteors",
    how3: "Collect hearts for lives -- coins for bonus points",
    how4: "50 levels -- meteors speed up every level",
  },
  de: {
    how1: "Stell dich vor die Kamera -- zeig deinen Körper",
    how2: "Bewege dich links und rechts um auszuweichen",
    how3: "Herzen für Leben -- Münzen für Bonuspunkte",
    how4: "50 Level -- Meteore werden schneller",
  },
  es: {
    how1: "Párate frente a la cámara -- muestra tu cuerpo",
    how2: "Muévete para esquivar los meteoros",
    how3: "Corazones dan vidas -- monedas dan puntos extra",
    how4: "50 niveles -- los meteoros se aceleran",
  },
  fr: {
    how1: "Placez-vous devant la caméra -- montrez votre corps",
    how2: "Bougez pour esquiver les météores",
    how3: "Cœurs pour des vies -- pièces pour des points bonus",
    how4: "50 niveaux -- les météores s'accélèrent",
  },
  hi: {
    how1: "कैमरे के सामने खड़े हों -- शरीर दिखाएं",
    how2: "उल्काओं से बचने के लिए बाएं-दाएं हिलें",
    how3: "दिल से जीवन -- सिक्कों से अंक मिलते हैं",
    how4: "50 स्तर -- हर स्तर में उल्काएं तेज होती हैं",
  },
  zh: {
    how1: "站在摄像头前 -- 展示你的身体",
    how2: "左右移动躲避陨石",
    how3: "收集爱心获得生命 -- 硬币获得积分",
    how4: "50关 -- 每关陨石速度加快",
  },
  ru: {
    how1: "Встаньте перед камерой -- покажите тело",
    how2: "Двигайтесь чтобы уклоняться от метеоров",
    how3: "Сердца дают жизни -- монеты дают очки",
    how4: "50 уровней -- метеоры ускоряются",
  },
  pt: {
    how1: "Fique na frente da câmera -- mostre seu corpo",
    how2: "Mova-se para desviar dos meteoros",
    how3: "Corações para vidas -- moedas para pontos",
    how4: "50 níveis -- meteoros ficam mais rápidos",
  },
};

function getDifficultyColor(level: number): string {
  if (level <= 5) return "oklch(0.70 0.20 160)";
  if (level <= 12) return "oklch(0.80 0.22 90)";
  if (level <= 22) return "oklch(0.80 0.22 60)";
  if (level <= 34) return "oklch(0.75 0.25 40)";
  if (level <= 44) return "oklch(0.70 0.28 20)";
  return "oklch(0.70 0.28 330)";
}

function getDifficultyLabel(level: number, lang: string): string {
  const labels: Record<string, string[]> = {
    tr: ["Başlangıç", "Kolay", "Orta", "Zor", "Uzman", "Kabus"],
    en: ["Starter", "Easy", "Medium", "Hard", "Expert", "Nightmare"],
    de: ["Anfänger", "Leicht", "Mittel", "Schwer", "Experte", "Albtraum"],
    es: ["Inicio", "Fácil", "Medio", "Difícil", "Experto", "Pesadilla"],
    fr: ["Débutant", "Facile", "Moyen", "Difficile", "Expert", "Cauchemar"],
    hi: ["शुरुआत", "आसान", "मध्यम", "कठिन", "विशेषज्ञ", "दुःस्वप्न"],
    zh: ["入门", "简单", "中等", "困难", "专家", "噩梦"],
    ru: ["Начало", "Легко", "Средне", "Сложно", "Эксперт", "Кошмар"],
    pt: ["Início", "Fácil", "Médio", "Difícil", "Perito", "Pesadelo"],
  };
  const arr = labels[lang] ?? labels.en;
  if (level <= 5) return arr[0];
  if (level <= 12) return arr[1];
  if (level <= 22) return arr[2];
  if (level <= 34) return arr[3];
  if (level <= 44) return arr[4];
  return arr[5];
}

export function StartScreen({ onStart }: StartScreenProps) {
  const { lang } = useLanguage();
  const { themeId, setTheme } = useTheme();
  const theme = getThemeConfig(themeId);
  const [playerName, setPlayerNameState] = useState(() => getPlayerName());
  const [highScore] = useState(() => getHighScore());
  const [bestLevel] = useState(() => getBestLevel());
  const [cameraStatus, setCameraStatus] = useState<
    "checking" | "ok" | "denied" | "error"
  >("checking");
  const [isStarting, setIsStarting] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem("meteorescape_muted") === "1";
    } catch {
      return false;
    }
  });
  const [activeTab, setActiveTab] = useState<"play" | "levels" | "howto">(
    "play",
  );
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    checkCamera();
    return () => {
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) track.stop();
        streamRef.current = null;
      }
    };
  }, []);

  async function checkCamera() {
    setCameraStatus("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      for (const track of stream.getTracks()) track.stop();
      streamRef.current = null;
      setCameraStatus("ok");
    } catch (err: unknown) {
      const errorName = err instanceof Error ? err.name : "unknown";
      setCameraStatus(errorName === "NotAllowedError" ? "denied" : "error");
    }
  }

  function handleStart() {
    if (!playerName.trim() || cameraStatus !== "ok") return;
    setIsStarting(true);
    const name = playerName.trim();
    setPlayerName(name);
    try {
      getAudioEngine();
    } catch {
      // silent
    }
    setTimeout(() => onStart(name), 300);
  }

  function handleToggleMute() {
    try {
      const engine = getAudioEngine();
      const newMuted = engine.toggleMute();
      setIsMuted(newMuted);
    } catch {
      const next = !isMuted;
      setIsMuted(next);
      try {
        localStorage.setItem("meteorescape_muted", next ? "1" : "0");
      } catch {
        // ignore
      }
    }
  }

  const cameraOk = cameraStatus === "ok";
  const canStart = playerName.trim().length > 0 && cameraOk;
  const howToTexts = HOW_TO_PLAY_TEXT[lang] ?? HOW_TO_PLAY_TEXT.en;

  const tabLabels: Record<string, Record<string, string>> = {
    tr: { play: "OYUN", levels: "BÖLÜMLER", howto: "NASIL OYNANIR" },
    en: { play: "PLAY", levels: "LEVELS", howto: "HOW TO PLAY" },
    de: { play: "SPIELEN", levels: "LEVEL", howto: "ANLEITUNG" },
    es: { play: "JUGAR", levels: "NIVELES", howto: "CÓMO JUGAR" },
    fr: { play: "JOUER", levels: "NIVEAUX", howto: "COMMENT JOUER" },
    hi: { play: "खेलें", levels: "स्तर", howto: "कैसे खेलें" },
    zh: { play: "玩", levels: "关卡", howto: "如何玩" },
    ru: { play: "ИГРАТЬ", levels: "УРОВНИ", howto: "КАК ИГРАТЬ" },
    pt: { play: "JOGAR", levels: "NÍVEIS", howto: "COMO JOGAR" },
  };
  const tabs = tabLabels[lang] ?? tabLabels.en;

  const tabIcons = { play: Gamepad2, levels: Grid3X3, howto: BookOpen };

  return (
    <div
      className="start-screen-scroll relative w-full flex flex-col"
      style={{ background: theme.bgGradient }}
    >
      <StarField />

      {/* Scanline overlay - subtle */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.015) 3px, rgba(0,0,0,0.015) 6px)",
        }}
      />

      {/* Mesh glow blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-25"
          style={{
            background: theme.primaryColor,
            top: "-10%",
            left: "15%",
            transform: "translate(-50%, 0)",
          }}
        />
        <div
          className="absolute w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{
            background: theme.secondaryColor,
            bottom: "10%",
            right: "10%",
          }}
        />
        <div
          className="absolute w-56 h-56 rounded-full blur-2xl opacity-15"
          style={{
            background: theme.accentColor,
            top: "50%",
            left: "80%",
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {FLOAT_PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              background: p.useAccent
                ? theme.accentColor
                : p.useSecondary
                  ? theme.secondaryColor
                  : theme.primaryColor,
              opacity: 0.4,
            }}
            animate={{
              y: [0, -28, -12, 0],
              x: [0, 14, -8, 0],
              opacity: [0.2, 0.7, 0.35, 0.2],
              scale: [1, 1.6, 0.85, 1],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Confetti-style larger particles */}
        {CONFETTI.map((c) => (
          <motion.div
            key={`conf-${c.id}`}
            className="absolute rounded-sm"
            style={{
              left: `${c.left}%`,
              top: "-20px",
              width: c.size,
              height: c.size * 1.6,
              background:
                c.id % 3 === 0
                  ? theme.primaryColor
                  : c.id % 3 === 1
                    ? theme.secondaryColor
                    : theme.accentColor,
              opacity: 0,
            }}
            animate={{
              y: [0, "120vh"],
              rotate: [0, 720],
              opacity: [0, 0.5, 0.5, 0],
            }}
            transition={{
              duration: c.duration + 4,
              delay: c.delay + 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-4 pt-4 pb-2">
        {/* Mute toggle */}
        <motion.button
          type="button"
          data-ocid="start.mute_toggle"
          onClick={handleToggleMute}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: `${theme.primaryColor}18`,
            border: `1px solid ${theme.primaryColor}35`,
            backdropFilter: "blur(12px)",
            cursor: "pointer",
          }}
        >
          {isMuted ? (
            <VolumeX size={16} style={{ color: `${theme.primaryColor}70` }} />
          ) : (
            <Volume2 size={16} style={{ color: theme.primaryColor }} />
          )}
          <span
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "0.08em",
              color: isMuted ? "oklch(0.45 0.04 200)" : theme.primaryColor,
            }}
          >
            {isMuted
              ? t("game.pause.sound_off", lang)
              : t("game.pause.sound_on", lang)}
          </span>
        </motion.button>

        <LanguageSelector />
      </div>

      {/* ========================= HERO BANNER ========================= */}
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10 text-center pt-2 pb-2"
      >
        {/* Meteor emojis */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <motion.span
            animate={{
              rotate: [0, 25, -15, 10, 0],
              y: [0, -12, -5, -9, 0],
              scale: [1, 1.2, 0.9, 1.1, 1],
            }}
            transition={{
              duration: 3.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="hero-emoji-compact text-3xl md:text-5xl"
            style={{ filter: `drop-shadow(0 0 12px ${theme.accentColor})` }}
          >
            ☄️
          </motion.span>

          <div className="relative">
            {/* Glow behind title */}
            <div
              className="absolute inset-0 blur-2xl opacity-30 rounded-full"
              style={{
                background: theme.primaryColor,
                transform: "scale(1.5)",
              }}
            />

            <h1
              className="hero-title-compact relative text-4xl md:text-6xl font-black tracking-tight leading-none title-pulse"
              style={{
                fontFamily: "'Bricolage Grotesque', 'Sora', sans-serif",
                color: theme.primaryColor,
                letterSpacing: "-0.03em",
                textShadow: `0 0 30px ${theme.primaryColor}80, 0 2px 0 rgba(0,0,0,0.5)`,
              }}
            >
              {t("start.title1", lang)}
            </h1>
            <h1
              className="hero-title-compact relative text-4xl md:text-6xl font-black tracking-tight leading-none"
              style={{
                fontFamily: "'Bricolage Grotesque', 'Sora', sans-serif",
                color: theme.secondaryColor,
                letterSpacing: "-0.03em",
                textShadow: `0 0 30px ${theme.secondaryColor}90, 0 2px 0 rgba(0,0,0,0.5)`,
              }}
            >
              {t("start.title2", lang)}
            </h1>
          </div>

          <motion.span
            animate={{
              rotate: [0, -20, 12, -8, 0],
              y: [0, -8, -3, -6, 0],
              scale: [1, 1.15, 0.9, 1.05, 1],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 0.7,
            }}
            className="hero-emoji-compact text-3xl md:text-5xl"
            style={{ filter: `drop-shadow(0 0 12px ${theme.secondaryColor})` }}
          >
            ☄️
          </motion.span>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-sm tracking-[0.2em] font-bold"
          style={{
            fontFamily: "'Sora', sans-serif",
            color: theme.secondaryColor,
            opacity: 0.85,
            textShadow: `0 0 15px ${theme.secondaryColor}60`,
          }}
        >
          {t("start.subtitle", lang)}
        </motion.p>
      </motion.div>

      {/* ========================= STATS RIBBON ========================= */}
      {(highScore > 0 || bestLevel > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10, scaleX: 0.9 }}
          animate={{ opacity: 1, y: 0, scaleX: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="relative z-10 flex justify-center gap-2 px-3 pb-2"
        >
          {highScore > 0 && (
            <motion.div
              whileHover={{ scale: 1.04, y: -2 }}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${theme.secondaryColor}25, ${theme.secondaryColor}10)`,
                border: `1.5px solid ${theme.secondaryColor}45`,
                boxShadow: `0 4px 20px ${theme.secondaryColor}20`,
              }}
            >
              <Trophy
                size={16}
                style={{
                  color: theme.secondaryColor,
                  filter: `drop-shadow(0 0 6px ${theme.secondaryColor})`,
                }}
              />
              <div>
                <div
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontSize: "9px",
                    fontWeight: "700",
                    letterSpacing: "0.10em",
                    color: `${theme.secondaryColor}90`,
                    textTransform: "uppercase",
                  }}
                >
                  {t("start.highscore_label", lang)}
                </div>
                <div
                  className="text-xl font-black leading-none"
                  style={{
                    color: theme.secondaryColor,
                    textShadow: `0 0 16px ${theme.secondaryColor}80`,
                    fontFamily: "'Bricolage Grotesque', monospace",
                  }}
                >
                  {highScore.toLocaleString()}
                </div>
              </div>
            </motion.div>
          )}
          {bestLevel > 0 && (
            <motion.div
              whileHover={{ scale: 1.04, y: -2 }}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryColor}25, ${theme.primaryColor}10)`,
                border: `1.5px solid ${theme.primaryColor}45`,
                boxShadow: `0 4px 20px ${theme.primaryColor}20`,
              }}
            >
              <Gamepad2
                size={16}
                style={{
                  color: theme.primaryColor,
                  filter: `drop-shadow(0 0 6px ${theme.primaryColor})`,
                }}
              />
              <div>
                <div
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontSize: "9px",
                    fontWeight: "700",
                    letterSpacing: "0.10em",
                    color: `${theme.primaryColor}90`,
                    textTransform: "uppercase",
                  }}
                >
                  {t("start.bestlevel_label", lang)}
                </div>
                <div
                  className="text-xl font-black leading-none"
                  style={{
                    color: theme.primaryColor,
                    textShadow: `0 0 16px ${theme.primaryColor}80`,
                    fontFamily: "'Bricolage Grotesque', monospace",
                  }}
                >
                  {t("start.level_label", lang)} {bestLevel}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* ========================= MAIN CONTENT ========================= */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="relative z-10 flex-1 px-3 pb-6"
        style={{ maxWidth: "960px", margin: "0 auto", width: "100%" }}
      >
        {/* ---- Tab Nav ---- */}
        <div
          className="flex rounded-2xl p-1 mb-3"
          style={{
            background: `${theme.primaryColor}12`,
            border: `1.5px solid ${theme.primaryColor}25`,
            backdropFilter: "blur(16px)",
          }}
        >
          {(["play", "levels", "howto"] as const).map((tab) => {
            const Icon = tabIcons[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                data-ocid={`start.${tab}_tab`}
                onClick={() => setActiveTab(tab)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200"
                style={{
                  fontFamily: "'Sora', sans-serif",
                  background: isActive
                    ? `linear-gradient(135deg, ${theme.primaryColor}35, ${theme.primaryColor}20)`
                    : "transparent",
                  color: isActive ? theme.primaryColor : "oklch(0.55 0.05 200)",
                  border: isActive
                    ? `1.5px solid ${theme.primaryColor}50`
                    : "1.5px solid transparent",
                  boxShadow: isActive
                    ? `0 0 16px ${theme.primaryColor}30, inset 0 1px 0 ${theme.primaryColor}20`
                    : "none",
                  cursor: "pointer",
                }}
              >
                <Icon size={14} />
                {tabs[tab]}
              </button>
            );
          })}
        </div>

        {/* ---- Tab Content ---- */}
        <AnimatePresence mode="wait">
          {/* ============== PLAY TAB ============== */}
          {activeTab === "play" && (
            <motion.div
              key="play"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col md:flex-row gap-3"
            >
              {/* Theme selector -- horizontal scrollable row on mobile, vertical column on md+ */}
              <div
                className="md:w-52 rounded-2xl p-3"
                style={{
                  background: theme.cardBg ?? "rgba(0,0,0,0.5)",
                  border: `1.5px solid ${theme.primaryColor}25`,
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}
              >
                <p
                  className="text-center text-xs font-bold tracking-widest mb-3"
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    color: theme.primaryColor,
                    opacity: 0.8,
                  }}
                >
                  {t("theme.label", lang)}
                </p>
                <div className="flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0 md:overflow-x-visible">
                  {THEMES.map((th, i) => {
                    const isActive = themeId === th.id;
                    return (
                      <motion.button
                        key={th.id}
                        type="button"
                        data-ocid={`theme.option.${i + 1}`}
                        onClick={() => setTheme(th.id)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 flex-shrink-0 md:flex-shrink md:w-full px-3 py-2 rounded-xl text-left"
                        style={{
                          background: isActive
                            ? `linear-gradient(135deg, ${th.primaryColor}28, ${th.primaryColor}10)`
                            : "rgba(255,255,255,0.04)",
                          border: isActive
                            ? `1.5px solid ${th.primaryColor}60`
                            : "1.5px solid rgba(255,255,255,0.07)",
                          boxShadow: isActive
                            ? `0 0 20px ${th.primaryColor}35, inset 0 1px 0 ${th.primaryColor}20`
                            : "none",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <span
                          className="text-xl flex-shrink-0"
                          style={{
                            filter: isActive
                              ? `drop-shadow(0 0 8px ${th.primaryColor})`
                              : "none",
                            transition: "filter 0.2s ease",
                          }}
                        >
                          {th.emoji}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-xs font-bold leading-tight truncate"
                            style={{
                              fontFamily: "'Sora', sans-serif",
                              color: isActive
                                ? th.primaryColor
                                : "oklch(0.65 0.05 200)",
                            }}
                          >
                            {t(th.nameKey, lang)}
                          </div>
                        </div>
                        {isActive && (
                          <motion.div
                            layoutId="theme-check"
                            className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                            style={{
                              background: `linear-gradient(135deg, ${th.primaryColor}, ${th.accentColor})`,
                              boxShadow: `0 0 8px ${th.primaryColor}80`,
                            }}
                          >
                            <svg
                              role="img"
                              aria-label="selected"
                              width="8"
                              height="8"
                              viewBox="0 0 8 8"
                              fill="none"
                            >
                              <path
                                d="M1.5 4L3.5 6L6.5 2"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT: Player setup + camera + start */}
              <div className="flex-1 flex flex-col gap-2">
                {/* Player name card */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: theme.cardBg ?? "rgba(0,0,0,0.5)",
                    border: `1.5px solid ${theme.primaryColor}25`,
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                  }}
                >
                  <label
                    htmlFor="player-name"
                    className="block text-xs font-bold tracking-widest mb-3"
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      color: theme.primaryColor,
                      opacity: 0.8,
                      textTransform: "uppercase",
                    }}
                  >
                    {t("start.name_label", lang)}
                  </label>
                  <Input
                    id="player-name"
                    data-ocid="start.name_input"
                    value={playerName}
                    onChange={(e) => setPlayerNameState(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canStart) handleStart();
                    }}
                    placeholder={t("start.name_placeholder", lang)}
                    maxLength={20}
                    className="text-center text-lg font-bold h-13"
                    style={{
                      background: `${theme.primaryColor}10`,
                      border: `1.5px solid ${theme.primaryColor}40`,
                      color: "oklch(0.96 0.02 200)",
                      fontFamily: "'Sora', sans-serif",
                      borderRadius: "14px",
                      height: "52px",
                      fontSize: "16px",
                    }}
                  />
                </div>

                {/* Camera status card */}
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{
                    background: theme.cardBg ?? "rgba(0,0,0,0.5)",
                    border: `1.5px solid ${theme.primaryColor}18`,
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <AnimatePresence mode="wait">
                    {cameraStatus === "checking" && (
                      <motion.div
                        key="checking"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <RefreshCw
                          size={16}
                          className="animate-spin"
                          style={{
                            color: theme.primaryColor,
                            opacity: 0.6,
                          }}
                        />
                        <span
                          style={{
                            fontFamily: "'Sora', sans-serif",
                            color: "oklch(0.65 0.05 200)",
                            fontSize: "13px",
                          }}
                        >
                          {t("start.camera_checking", lang)}
                        </span>
                      </motion.div>
                    )}
                    {cameraStatus === "ok" && (
                      <motion.div
                        key="ok"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                        style={{
                          background: "oklch(0.18 0.08 160 / 0.35)",
                          border: "1px solid oklch(0.65 0.20 160 / 0.5)",
                          borderRadius: "12px",
                          padding: "8px 14px",
                        }}
                      >
                        <Camera
                          size={16}
                          style={{ color: "oklch(0.78 0.20 160)" }}
                        />
                        <span
                          style={{
                            fontFamily: "'Sora', sans-serif",
                            color: "oklch(0.82 0.18 160)",
                            fontSize: "13px",
                            fontWeight: "600",
                          }}
                        >
                          {t("start.camera_ok", lang)}
                        </span>
                      </motion.div>
                    )}
                    {(cameraStatus === "denied" ||
                      cameraStatus === "error") && (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-xl p-3"
                        style={{
                          background: "oklch(0.16 0.06 25 / 0.4)",
                          border: "1px solid oklch(0.60 0.22 25 / 0.5)",
                        }}
                      >
                        <p
                          className="text-xs mb-2"
                          style={{
                            color: "oklch(0.82 0.18 25)",
                            fontFamily: "'Sora', sans-serif",
                          }}
                        >
                          {t("start.camera_error", lang)}
                        </p>
                        <Button
                          data-ocid="start.retry_camera_button"
                          onClick={checkCamera}
                          variant="outline"
                          size="sm"
                          className="w-full gap-2"
                          style={{
                            borderColor: "oklch(0.60 0.22 25 / 0.7)",
                            color: "oklch(0.82 0.18 25)",
                            fontFamily: "'Sora', sans-serif",
                            fontSize: "12px",
                          }}
                        >
                          <RefreshCw size={12} />
                          {t("start.retry_camera", lang)}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* BIG START BUTTON */}
                <motion.div
                  whileHover={canStart ? { scale: 1.04, y: -3 } : {}}
                  whileTap={canStart ? { scale: 0.96 } : {}}
                  className="relative"
                >
                  <Button
                    data-ocid="start.start_button"
                    onClick={handleStart}
                    disabled={!canStart || isStarting}
                    className="w-full relative overflow-hidden"
                    style={{
                      height: "60px",
                      fontSize: "18px",
                      fontWeight: "900",
                      letterSpacing: "0.08em",
                      background: canStart
                        ? (theme.btnBg ??
                          `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`)
                        : "oklch(0.18 0.03 265)",
                      border: canStart
                        ? `2px solid ${theme.primaryColor}80`
                        : "2px solid oklch(0.25 0.02 265)",
                      color: canStart ? "#fff" : "oklch(0.35 0.02 265)",
                      fontFamily: "'Bricolage Grotesque', 'Sora', sans-serif",
                      boxShadow: canStart
                        ? `0 0 40px ${theme.primaryColor}55, 0 6px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)`
                        : "none",
                      borderRadius: "18px",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {/* Shimmer overlay */}
                    {canStart && (
                      <div
                        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background:
                            "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                          backgroundSize: "200% auto",
                        }}
                      />
                    )}

                    {isStarting ? (
                      <span className="relative flex items-center justify-center gap-3">
                        <RefreshCw size={22} className="animate-spin" />
                        {t("start.btn_starting", lang)}
                      </span>
                    ) : (
                      <span className="relative flex items-center justify-center gap-3">
                        <Zap size={22} />
                        {t("start.btn_start", lang)}
                      </span>
                    )}
                  </Button>

                  {/* Pulsing glow ring when ready */}
                  {canStart && !isStarting && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      animate={{
                        boxShadow: [
                          `0 0 0 0 ${theme.primaryColor}60`,
                          `0 0 0 8px ${theme.primaryColor}00`,
                        ],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeOut",
                      }}
                    />
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ============== LEVELS TAB ============== */}
          {activeTab === "levels" && (
            <motion.div
              key="levels"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="rounded-2xl p-4"
                style={{
                  background: theme.cardBg ?? "rgba(0,0,0,0.5)",
                  border: `1.5px solid ${theme.primaryColor}25`,
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}
              >
                {/* Difficulty legend */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  {[
                    { label: "1-5", color: "oklch(0.70 0.20 160)" },
                    { label: "6-12", color: "oklch(0.80 0.22 90)" },
                    { label: "13-22", color: "oklch(0.80 0.22 60)" },
                    { label: "23-34", color: "oklch(0.75 0.25 40)" },
                    { label: "35-44", color: "oklch(0.70 0.28 20)" },
                    { label: "45-50", color: "oklch(0.72 0.28 330)" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          background: item.color,
                          boxShadow: `0 0 6px ${item.color}80`,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'Sora', sans-serif",
                          fontSize: "11px",
                          color: "oklch(0.60 0.06 200)",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Level grid */}
                <div className="grid grid-cols-10 gap-1">
                  {LEVELS.map((lvl) => {
                    const isReached = bestLevel >= lvl.level;
                    const isCurrent = bestLevel + 1 === lvl.level;
                    const color = getDifficultyColor(lvl.level);
                    const diffLabel = getDifficultyLabel(lvl.level, lang);
                    return (
                      <motion.div
                        key={lvl.level}
                        whileHover={{ scale: 1.2, zIndex: 10 }}
                        className="relative"
                        title={`${t("start.level_label", lang)} ${lvl.level} — ${diffLabel}`}
                      >
                        <div
                          className="w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{
                            background: isReached
                              ? `${color}35`
                              : "rgba(255,255,255,0.04)",
                            border: isCurrent
                              ? `2px solid ${color}`
                              : isReached
                                ? `1.5px solid ${color}65`
                                : "1px solid rgba(255,255,255,0.07)",
                            color: isReached ? color : "oklch(0.30 0.02 200)",
                            fontFamily: "'Bricolage Grotesque', monospace",
                            fontSize: "10px",
                            boxShadow: isCurrent
                              ? `0 0 12px ${color}70`
                              : isReached
                                ? `0 0 5px ${color}25`
                                : "none",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {lvl.level}
                        </div>
                        {isCurrent && (
                          <motion.div
                            animate={{ scale: [1, 1.4, 1] }}
                            transition={{
                              duration: 1.2,
                              repeat: Number.POSITIVE_INFINITY,
                            }}
                            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                            style={{
                              background: color,
                              boxShadow: `0 0 8px ${color}`,
                            }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Progress summary */}
                <div className="flex items-center gap-4 mt-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: theme.primaryColor,
                        boxShadow: `0 0 6px ${theme.primaryColor}`,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Sora', sans-serif",
                        fontSize: "12px",
                        color: "oklch(0.60 0.06 200)",
                      }}
                    >
                      {bestLevel > 0 ? `${bestLevel}/50` : "0/50"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap size={12} style={{ color: theme.secondaryColor }} />
                    <span
                      style={{
                        fontFamily: "'Sora', sans-serif",
                        fontSize: "12px",
                        color: "oklch(0.60 0.06 200)",
                      }}
                    >
                      {t("start.level_label", lang)} 50: 62ms spawn, 50 meteors
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ============== HOW TO PLAY TAB ============== */}
          {activeTab === "howto" && (
            <motion.div
              key="howto"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="rounded-2xl p-5"
                style={{
                  background: theme.cardBg ?? "rgba(0,0,0,0.5)",
                  border: `1.5px solid ${theme.primaryColor}25`,
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}
              >
                <div className="flex flex-col gap-3">
                  {HOW_TO_PLAY.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.09 }}
                        className="flex items-start gap-4 p-4 rounded-2xl"
                        style={{
                          background: `${theme.primaryColor}10`,
                          border: `1.5px solid ${theme.primaryColor}20`,
                        }}
                      >
                        <div
                          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${theme.primaryColor}30, ${theme.accentColor}20)`,
                            border: `1.5px solid ${theme.primaryColor}45`,
                            boxShadow: `0 0 12px ${theme.primaryColor}25`,
                          }}
                        >
                          <Icon
                            size={18}
                            style={{ color: theme.primaryColor }}
                          />
                        </div>
                        <p
                          className="text-sm leading-relaxed"
                          style={{
                            fontFamily: "'Sora', sans-serif",
                            color: "oklch(0.80 0.06 200)",
                            paddingTop: "6px",
                          }}
                        >
                          {howToTexts[item.key]}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Quick CTA */}
                <motion.div
                  className="mt-4"
                  whileHover={canStart ? { scale: 1.03, y: -2 } : {}}
                  whileTap={canStart ? { scale: 0.97 } : {}}
                >
                  <Button
                    data-ocid="start.howto_start_button"
                    onClick={() => {
                      if (canStart) handleStart();
                      else setActiveTab("play");
                    }}
                    className="w-full overflow-hidden"
                    style={{
                      height: "52px",
                      fontSize: "15px",
                      fontWeight: "900",
                      letterSpacing: "0.06em",
                      background: canStart
                        ? (theme.btnBg ??
                          `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`)
                        : `${theme.primaryColor}18`,
                      border: `2px solid ${theme.primaryColor}50`,
                      color: canStart ? "#fff" : theme.primaryColor,
                      fontFamily: "'Bricolage Grotesque', 'Sora', sans-serif",
                      boxShadow: canStart
                        ? `0 0 25px ${theme.primaryColor}50`
                        : "none",
                      borderRadius: "16px",
                    }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Zap size={18} />
                      {t("start.btn_start", lang)}
                    </span>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ========================= PRIVACY POLICY FOOTER ========================= */}
      <div className="relative z-20 text-center pb-4 pt-2">
        <a
          href="https://sites.google.com/view/meteorescape/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          data-ocid="start.privacy_policy_link"
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: "11px",
            color: "oklch(0.50 0.05 200)",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            letterSpacing: "0.04em",
            cursor: "pointer",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color =
              theme.primaryColor;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color =
              "oklch(0.50 0.05 200)";
          }}
        >
          {{
            tr: "Gizlilik Politikası",
            en: "Privacy Policy",
            de: "Datenschutzrichtlinie",
            es: "Política de Privacidad",
            fr: "Politique de Confidentialité",
            hi: "गोपनीयता नीति",
            zh: "隐私政策",
            ru: "Политика конфиденциальности",
            pt: "Política de Privacidade",
          }[lang] ?? "Privacy Policy"}
        </a>
      </div>
    </div>
  );
}
