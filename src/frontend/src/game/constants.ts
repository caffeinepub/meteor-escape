import type { LevelConfig } from "./types";

export const LEVELS: LevelConfig[] = [
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
