import { t, useLanguage } from "@/game/i18n";
import { useTheme } from "@/game/themeContext";
import { THEMES } from "@/game/themes";
import { motion } from "motion/react";

export function ThemeSelector() {
  const { themeId, setTheme } = useTheme();
  const { lang } = useLanguage();

  return (
    <div className="flex flex-col gap-2">
      <p
        className="text-xs font-semibold tracking-widest opacity-60 text-center"
        style={{
          fontFamily: "'Sora', sans-serif",
          color: "var(--theme-primary, oklch(0.78 0.22 195))",
        }}
      >
        {t("theme.label", lang)}
      </p>
      <div className="flex gap-2 justify-center flex-wrap">
        {THEMES.map((theme, i) => {
          const isActive = themeId === theme.id;
          return (
            <motion.button
              key={theme.id}
              type="button"
              data-ocid={`theme.option.${i + 1}`}
              onClick={() => setTheme(theme.id)}
              whileHover={{ scale: 1.12, y: -2 }}
              whileTap={{ scale: 0.95 }}
              title={t(theme.nameKey, lang)}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                border: isActive
                  ? `2px solid ${theme.primaryColor}`
                  : "2px solid rgba(255,255,255,0.1)",
                background: isActive
                  ? `${theme.bgGradient}`
                  : "rgba(255,255,255,0.06)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                boxShadow: isActive
                  ? `0 0 14px ${theme.primaryColor}, 0 0 28px ${theme.primaryColor}50, inset 0 1px 0 rgba(255,255,255,0.1)`
                  : "none",
                transition: "all 0.2s ease",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {theme.emoji}
              {isActive && (
                <motion.div
                  layoutId="theme-active-indicator"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "12px",
                    background: `${theme.primaryColor}25`,
                    pointerEvents: "none",
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      <p
        className="text-center text-xs opacity-30 tracking-wider"
        style={{ fontFamily: "'Sora', sans-serif", fontSize: "10px" }}
      >
        {t(
          THEMES.find((t) => t.id === themeId)?.nameKey ?? "theme.space",
          lang,
        )}
      </p>
    </div>
  );
}
