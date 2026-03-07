import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        chart: {
          1: "oklch(var(--chart-1))",
          2: "oklch(var(--chart-2))",
          3: "oklch(var(--chart-3))",
          4: "oklch(var(--chart-4))",
          5: "oklch(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
        },
        // Game-specific colors
        "neon-cyan": "oklch(0.78 0.22 195)",
        "neon-gold": "oklch(0.82 0.20 80)",
        "neon-red": "oklch(0.65 0.25 25)",
        "space-dark": "oklch(0.06 0.02 265)",
        "space-mid": "oklch(0.12 0.025 265)",
      },
      fontFamily: {
        display: ["Orbitron", "Sora", "Outfit", "sans-serif"],
        body: ["Sora", "Outfit", "system-ui", "sans-serif"],
        mono: ["'Geist Mono'", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
        "neon-cyan": "0 0 15px oklch(0.78 0.22 195 / 0.5), 0 0 30px oklch(0.78 0.22 195 / 0.25)",
        "neon-gold": "0 0 15px oklch(0.82 0.20 80 / 0.5), 0 0 30px oklch(0.82 0.20 80 / 0.25)",
        "neon-red": "0 0 15px oklch(0.65 0.25 25 / 0.5), 0 0 30px oklch(0.65 0.25 25 / 0.25)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "scale-in": {
          from: { transform: "scale(0.9)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "level-burst": {
          "0%": { transform: "scale(0.3) rotate(-5deg)", opacity: "0" },
          "50%": { transform: "scale(1.15) rotate(2deg)", opacity: "1" },
          "70%": { transform: "scale(0.95) rotate(-1deg)" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 50%, 90%": { transform: "translateX(-4px)" },
          "30%, 70%": { transform: "translateX(4px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 15px oklch(0.78 0.22 195 / 0.4)" },
          "50%": { boxShadow: "0 0 30px oklch(0.78 0.22 195 / 0.8), 0 0 60px oklch(0.78 0.22 195 / 0.4)" },
        },
        "countdown": {
          "0%": { transform: "scale(1.4)", opacity: "0.5" },
          "50%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.95)", opacity: "0.8" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "level-burst": "level-burst 0.5s ease-out",
        "shake": "shake 0.4s ease-in-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "countdown": "countdown 1s ease-out",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};
