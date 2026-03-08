import { STORAGE_KEYS } from "./constants";

export const STORAGE_KEY_BEST_LEVEL = "meteorescape_bestlevel";

export function getPlayerName(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) ?? "";
  } catch {
    return "";
  }
}

export function setPlayerName(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
  } catch {
    // ignore
  }
}

export function getHighScore(): number {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
    return val ? Number.parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function setHighScore(score: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString());
  } catch {
    // ignore
  }
}

export function updateHighScore(score: number): number {
  const current = getHighScore();
  if (score > current) {
    setHighScore(score);
    return score;
  }
  return current;
}

export function getBestLevel(): number {
  try {
    const val = localStorage.getItem(STORAGE_KEY_BEST_LEVEL);
    return val ? Number.parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function updateBestLevel(level: number): number {
  const current = getBestLevel();
  if (level > current) {
    try {
      localStorage.setItem(STORAGE_KEY_BEST_LEVEL, level.toString());
    } catch {
      // ignore
    }
    return level;
  }
  return current;
}
