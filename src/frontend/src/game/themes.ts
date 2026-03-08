export type ThemeId = "space" | "neon" | "volcanic" | "ice" | "gold";

export interface ThemeConfig {
  id: ThemeId;
  nameKey: string;
  emoji: string;
  cssClass: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgGradient: string;
  cardBg?: string;
  glow?: string;
  btnBg?: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: "space",
    nameKey: "theme.space",
    emoji: "🌌",
    cssClass: "theme-space",
    primaryColor: "oklch(0.78 0.22 195)",
    secondaryColor: "oklch(0.82 0.20 80)",
    accentColor: "oklch(0.70 0.28 295)",
    bgGradient:
      "linear-gradient(145deg, oklch(0.14 0.06 265) 0%, oklch(0.20 0.10 250) 40%, oklch(0.12 0.08 220) 70%, oklch(0.10 0.06 190) 100%)",
    cardBg:
      "linear-gradient(135deg, oklch(0.18 0.06 265 / 0.92), oklch(0.14 0.05 250 / 0.95))",
    glow: "0 0 30px oklch(0.78 0.22 195 / 0.6), 0 0 60px oklch(0.78 0.22 195 / 0.3)",
    btnBg:
      "linear-gradient(135deg, oklch(0.60 0.22 195), oklch(0.50 0.20 220))",
  },
  {
    id: "neon",
    nameKey: "theme.neon",
    emoji: "⚡",
    cssClass: "theme-neon",
    primaryColor: "oklch(0.78 0.30 220)",
    secondaryColor: "oklch(0.75 0.34 330)",
    accentColor: "oklch(0.82 0.28 160)",
    bgGradient:
      "linear-gradient(145deg, oklch(0.12 0.08 280) 0%, oklch(0.18 0.14 310) 40%, oklch(0.10 0.10 250) 70%, oklch(0.14 0.10 340) 100%)",
    cardBg:
      "linear-gradient(135deg, oklch(0.14 0.08 280 / 0.92), oklch(0.10 0.06 265 / 0.95))",
    glow: "0 0 30px oklch(0.78 0.30 220 / 0.6), 0 0 60px oklch(0.75 0.34 330 / 0.4)",
    btnBg:
      "linear-gradient(135deg, oklch(0.58 0.30 220), oklch(0.50 0.32 330))",
  },
  {
    id: "volcanic",
    nameKey: "theme.volcanic",
    emoji: "🌋",
    cssClass: "theme-volcanic",
    primaryColor: "oklch(0.75 0.28 40)",
    secondaryColor: "oklch(0.80 0.25 65)",
    accentColor: "oklch(0.68 0.30 20)",
    bgGradient:
      "linear-gradient(145deg, oklch(0.16 0.12 20) 0%, oklch(0.22 0.14 35) 40%, oklch(0.14 0.10 15) 70%, oklch(0.18 0.08 50) 100%)",
    cardBg:
      "linear-gradient(135deg, oklch(0.16 0.08 25 / 0.92), oklch(0.12 0.06 20 / 0.95))",
    glow: "0 0 30px oklch(0.75 0.28 40 / 0.6), 0 0 60px oklch(0.68 0.30 20 / 0.4)",
    btnBg: "linear-gradient(135deg, oklch(0.60 0.30 35), oklch(0.48 0.26 20))",
  },
  {
    id: "ice",
    nameKey: "theme.ice",
    emoji: "❄️",
    cssClass: "theme-ice",
    primaryColor: "oklch(0.85 0.20 210)",
    secondaryColor: "oklch(0.92 0.10 200)",
    accentColor: "oklch(0.70 0.25 240)",
    bgGradient:
      "linear-gradient(145deg, oklch(0.16 0.08 220) 0%, oklch(0.24 0.10 210) 40%, oklch(0.12 0.06 240) 70%, oklch(0.20 0.08 200) 100%)",
    cardBg:
      "linear-gradient(135deg, oklch(0.18 0.06 220 / 0.92), oklch(0.14 0.04 235 / 0.95))",
    glow: "0 0 30px oklch(0.85 0.20 210 / 0.6), 0 0 60px oklch(0.70 0.25 240 / 0.4)",
    btnBg:
      "linear-gradient(135deg, oklch(0.60 0.24 210), oklch(0.50 0.22 240))",
  },
  {
    id: "gold",
    nameKey: "theme.gold",
    emoji: "👑",
    cssClass: "theme-gold",
    primaryColor: "oklch(0.85 0.22 80)",
    secondaryColor: "oklch(0.90 0.18 95)",
    accentColor: "oklch(0.65 0.20 50)",
    bgGradient:
      "linear-gradient(145deg, oklch(0.16 0.10 65) 0%, oklch(0.24 0.14 75) 40%, oklch(0.12 0.08 55) 70%, oklch(0.20 0.12 80) 100%)",
    cardBg:
      "linear-gradient(135deg, oklch(0.18 0.08 65 / 0.92), oklch(0.14 0.06 60 / 0.95))",
    glow: "0 0 30px oklch(0.85 0.22 80 / 0.7), 0 0 60px oklch(0.65 0.20 50 / 0.4)",
    btnBg: "linear-gradient(135deg, oklch(0.65 0.24 80), oklch(0.52 0.20 60))",
  },
];

export function getThemeConfig(id: ThemeId): ThemeConfig {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
