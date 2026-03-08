import type { LevelConfig } from "./types";

export const LEVELS: LevelConfig[] = [
  // Bölüm 1-10: Orijinal değerler
  {
    level: 1,
    scoreThreshold: 0,
    spawnMs: 2200,
    speedMin: 2,
    speedMax: 3.5,
    maxMeteors: 3,
  },
  {
    level: 2,
    scoreThreshold: 200,
    spawnMs: 1900,
    speedMin: 2.5,
    speedMax: 4.5,
    maxMeteors: 4,
  },
  {
    level: 3,
    scoreThreshold: 500,
    spawnMs: 1600,
    speedMin: 3,
    speedMax: 5.5,
    maxMeteors: 5,
  },
  {
    level: 4,
    scoreThreshold: 900,
    spawnMs: 1400,
    speedMin: 3.5,
    speedMax: 6.5,
    maxMeteors: 6,
  },
  {
    level: 5,
    scoreThreshold: 1400,
    spawnMs: 1200,
    speedMin: 4,
    speedMax: 7.5,
    maxMeteors: 7,
  },
  {
    level: 6,
    scoreThreshold: 2000,
    spawnMs: 1000,
    speedMin: 5,
    speedMax: 9,
    maxMeteors: 8,
  },
  {
    level: 7,
    scoreThreshold: 2800,
    spawnMs: 800,
    speedMin: 6,
    speedMax: 11,
    maxMeteors: 10,
  },
  {
    level: 8,
    scoreThreshold: 3700,
    spawnMs: 650,
    speedMin: 7,
    speedMax: 13,
    maxMeteors: 12,
  },
  {
    level: 9,
    scoreThreshold: 4500,
    spawnMs: 500,
    speedMin: 8,
    speedMax: 15,
    maxMeteors: 14,
  },
  {
    level: 10,
    scoreThreshold: 5400,
    spawnMs: 350,
    speedMin: 9,
    speedMax: 16,
    maxMeteors: 16,
  },
  // Bölüm 11-50: Kademeli artan zorluk
  // Spawn 350->80ms, speedMin 9->22, speedMax 16->38, maxMeteors 16->40
  // Puan eşiği: 5400'den başlayıp her bölüm ~450-900 arası artar
  {
    level: 11,
    scoreThreshold: 6300,
    spawnMs: 330,
    speedMin: 9.4,
    speedMax: 16.6,
    maxMeteors: 17,
  },
  {
    level: 12,
    scoreThreshold: 7300,
    spawnMs: 310,
    speedMin: 9.8,
    speedMax: 17.2,
    maxMeteors: 18,
  },
  {
    level: 13,
    scoreThreshold: 8400,
    spawnMs: 292,
    speedMin: 10.2,
    speedMax: 17.9,
    maxMeteors: 19,
  },
  {
    level: 14,
    scoreThreshold: 9600,
    spawnMs: 275,
    speedMin: 10.6,
    speedMax: 18.6,
    maxMeteors: 20,
  },
  {
    level: 15,
    scoreThreshold: 10900,
    spawnMs: 260,
    speedMin: 11,
    speedMax: 19.3,
    maxMeteors: 21,
  },
  {
    level: 16,
    scoreThreshold: 12300,
    spawnMs: 245,
    speedMin: 11.5,
    speedMax: 20.1,
    maxMeteors: 22,
  },
  {
    level: 17,
    scoreThreshold: 13800,
    spawnMs: 232,
    speedMin: 12,
    speedMax: 20.9,
    maxMeteors: 23,
  },
  {
    level: 18,
    scoreThreshold: 15400,
    spawnMs: 219,
    speedMin: 12.5,
    speedMax: 21.7,
    maxMeteors: 24,
  },
  {
    level: 19,
    scoreThreshold: 17200,
    spawnMs: 207,
    speedMin: 13,
    speedMax: 22.6,
    maxMeteors: 25,
  },
  {
    level: 20,
    scoreThreshold: 19100,
    spawnMs: 196,
    speedMin: 13.5,
    speedMax: 23.5,
    maxMeteors: 26,
  },
  {
    level: 21,
    scoreThreshold: 21200,
    spawnMs: 185,
    speedMin: 14,
    speedMax: 24.4,
    maxMeteors: 27,
  },
  {
    level: 22,
    scoreThreshold: 23400,
    spawnMs: 175,
    speedMin: 14.5,
    speedMax: 25.3,
    maxMeteors: 28,
  },
  {
    level: 23,
    scoreThreshold: 25800,
    spawnMs: 166,
    speedMin: 15,
    speedMax: 26.3,
    maxMeteors: 29,
  },
  {
    level: 24,
    scoreThreshold: 28300,
    spawnMs: 157,
    speedMin: 15.5,
    speedMax: 27.2,
    maxMeteors: 30,
  },
  {
    level: 25,
    scoreThreshold: 31000,
    spawnMs: 149,
    speedMin: 16,
    speedMax: 28.2,
    maxMeteors: 31,
  },
  {
    level: 26,
    scoreThreshold: 34000,
    spawnMs: 141,
    speedMin: 16.5,
    speedMax: 29.2,
    maxMeteors: 32,
  },
  {
    level: 27,
    scoreThreshold: 37200,
    spawnMs: 134,
    speedMin: 17,
    speedMax: 30.2,
    maxMeteors: 33,
  },
  {
    level: 28,
    scoreThreshold: 40600,
    spawnMs: 127,
    speedMin: 17.5,
    speedMax: 31.2,
    maxMeteors: 33,
  },
  {
    level: 29,
    scoreThreshold: 44200,
    spawnMs: 121,
    speedMin: 18,
    speedMax: 32.2,
    maxMeteors: 34,
  },
  {
    level: 30,
    scoreThreshold: 48000,
    spawnMs: 115,
    speedMin: 18.5,
    speedMax: 33.1,
    maxMeteors: 35,
  },
  {
    level: 31,
    scoreThreshold: 52100,
    spawnMs: 110,
    speedMin: 19,
    speedMax: 34.1,
    maxMeteors: 35,
  },
  {
    level: 32,
    scoreThreshold: 56400,
    spawnMs: 105,
    speedMin: 19.4,
    speedMax: 34.9,
    maxMeteors: 36,
  },
  {
    level: 33,
    scoreThreshold: 61000,
    spawnMs: 100,
    speedMin: 19.8,
    speedMax: 35.6,
    maxMeteors: 36,
  },
  {
    level: 34,
    scoreThreshold: 65900,
    spawnMs: 96,
    speedMin: 20.2,
    speedMax: 36.3,
    maxMeteors: 37,
  },
  {
    level: 35,
    scoreThreshold: 71000,
    spawnMs: 92,
    speedMin: 20.6,
    speedMax: 36.9,
    maxMeteors: 37,
  },
  {
    level: 36,
    scoreThreshold: 76400,
    spawnMs: 88,
    speedMin: 21,
    speedMax: 37.5,
    maxMeteors: 38,
  },
  {
    level: 37,
    scoreThreshold: 82100,
    spawnMs: 85,
    speedMin: 21.3,
    speedMax: 37.8,
    maxMeteors: 38,
  },
  {
    level: 38,
    scoreThreshold: 88100,
    spawnMs: 83,
    speedMin: 21.5,
    speedMax: 38,
    maxMeteors: 39,
  },
  {
    level: 39,
    scoreThreshold: 94400,
    spawnMs: 81,
    speedMin: 21.8,
    speedMax: 38,
    maxMeteors: 39,
  },
  {
    level: 40,
    scoreThreshold: 101000,
    spawnMs: 80,
    speedMin: 22,
    speedMax: 38,
    maxMeteors: 40,
  },
  // Bölüm 41-50: Maksimum zorluk, spawn ve hız sabit -- sadece puan eşiği artıyor
  {
    level: 41,
    scoreThreshold: 108000,
    spawnMs: 80,
    speedMin: 22,
    speedMax: 38,
    maxMeteors: 40,
  },
  {
    level: 42,
    scoreThreshold: 115500,
    spawnMs: 78,
    speedMin: 22.5,
    speedMax: 38.5,
    maxMeteors: 41,
  },
  {
    level: 43,
    scoreThreshold: 123300,
    spawnMs: 76,
    speedMin: 23,
    speedMax: 39,
    maxMeteors: 42,
  },
  {
    level: 44,
    scoreThreshold: 131400,
    spawnMs: 74,
    speedMin: 23.5,
    speedMax: 39.5,
    maxMeteors: 43,
  },
  {
    level: 45,
    scoreThreshold: 139800,
    spawnMs: 72,
    speedMin: 24,
    speedMax: 40,
    maxMeteors: 44,
  },
  {
    level: 46,
    scoreThreshold: 148500,
    spawnMs: 70,
    speedMin: 24.5,
    speedMax: 40.5,
    maxMeteors: 45,
  },
  {
    level: 47,
    scoreThreshold: 157500,
    spawnMs: 68,
    speedMin: 25,
    speedMax: 41,
    maxMeteors: 46,
  },
  {
    level: 48,
    scoreThreshold: 166800,
    spawnMs: 66,
    speedMin: 25.5,
    speedMax: 41.5,
    maxMeteors: 47,
  },
  {
    level: 49,
    scoreThreshold: 176400,
    spawnMs: 64,
    speedMin: 26,
    speedMax: 42,
    maxMeteors: 48,
  },
  {
    level: 50,
    scoreThreshold: 186300,
    spawnMs: 62,
    speedMin: 26.5,
    speedMax: 42.5,
    maxMeteors: 50,
  },
];

export const METEOR_COLOR_SETS = [
  { inner: "#FF9040", mid: "#FF6B35", outer: "#CC3300" },
  { inner: "#FF7040", mid: "#FF4500", outer: "#8B0000" },
  { inner: "#FFA040", mid: "#FF8C00", outer: "#B8340A" },
  { inner: "#FF4060", mid: "#DC143C", outer: "#8B0000" },
  { inner: "#FF9070", mid: "#FF7F50", outer: "#C0392B" },
];

export const PLAYER_HITBOX_RADIUS = 40;
export const PLAYER_BADGE_RADIUS = 50;
export const INVINCIBILITY_DURATION = 1500; // ms
export const MAX_LIVES = 3;
export const SCORE_PER_METEOR = 10;

export const STORAGE_KEYS = {
  PLAYER_NAME: "meteorescape_playername",
  HIGH_SCORE: "meteorescape_highscore",
} as const;

export const SMOOTHING_ALPHA = 0.4;

export const POWERUP_BONUS_SCORE = 25;
export const POWERUP_HEART_CHANCE = 0.4; // 40% kalp, 60% coin

/**
 * Bölüme göre power-up spawn aralığı (ms) -- zorluk arttıkça seyrekleşir
 * Bölüm 1-3:   8-10s
 * Bölüm 4-6:   12-15s
 * Bölüm 7-9:   18-22s
 * Bölüm 10-15: 28-35s
 * Bölüm 16-25: 40-55s
 * Bölüm 26-40: 60-80s
 * Bölüm 41-50: 85-110s
 */
export function getPowerUpSpawnInterval(level: number): number {
  if (level <= 3) return 8000 + Math.random() * 2000; // 8-10s
  if (level <= 6) return 12000 + Math.random() * 3000; // 12-15s
  if (level <= 9) return 18000 + Math.random() * 4000; // 18-22s
  if (level <= 15) return 28000 + Math.random() * 7000; // 28-35s
  if (level <= 25) return 40000 + Math.random() * 15000; // 40-55s
  if (level <= 40) return 60000 + Math.random() * 20000; // 60-80s
  return 85000 + Math.random() * 25000; // 85-110s
}

export function getLevelForScore(score: number): LevelConfig {
  let currentLevel = LEVELS[0];
  for (const level of LEVELS) {
    if (score >= level.scoreThreshold) {
      currentLevel = level;
    } else {
      break;
    }
  }
  return currentLevel;
}

export function getLevelByNumber(levelNum: number): LevelConfig {
  return LEVELS[Math.min(levelNum - 1, LEVELS.length - 1)];
}
