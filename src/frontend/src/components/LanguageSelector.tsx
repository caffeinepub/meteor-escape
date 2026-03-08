import { LANGUAGES, useLanguage } from "@/game/i18n";
import { useEffect, useRef, useState } from "react";

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className = "" }: LanguageSelectorProps) {
  const { lang, setLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLanguage =
    LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        data-ocid="lang.select_button"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          background: "rgba(0, 0, 0, 0.7)",
          border: "1px solid oklch(0.78 0.22 195 / 0.5)",
          color: "oklch(0.90 0.10 200)",
          fontFamily: "'Sora', sans-serif",
          fontSize: "13px",
          fontWeight: "600",
          letterSpacing: "0.06em",
          padding: "6px 10px",
          borderRadius: "8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          backdropFilter: "blur(8px)",
          transition: "all 0.2s ease",
          boxShadow: isOpen ? "0 0 12px oklch(0.78 0.22 195 / 0.4)" : "none",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "oklch(0.78 0.22 195 / 0.9)";
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 0 12px oklch(0.78 0.22 195 / 0.3)";
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "oklch(0.78 0.22 195 / 0.5)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
          }
        }}
      >
        <span style={{ fontSize: "16px" }}>{currentLanguage.flag}</span>
        <span>{currentLanguage.code.toUpperCase()}</span>
        <svg
          role="img"
          aria-label="toggle"
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="currentColor"
          style={{
            opacity: 0.6,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <path
            d="M1 3L5 7L9 3"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          data-ocid="lang.dropdown_menu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: "160px",
            background: "oklch(0.08 0.025 265 / 0.97)",
            border: "1px solid oklch(0.78 0.22 195 / 0.35)",
            borderRadius: "10px",
            backdropFilter: "blur(20px)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.7), 0 0 20px oklch(0.78 0.22 195 / 0.15)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {LANGUAGES.map((language, index) => {
            const isSelected = language.code === lang;
            return (
              <button
                type="button"
                key={language.code}
                data-ocid={`lang.option.${index + 1}`}
                onClick={() => {
                  setLang(language.code);
                  setIsOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "9px 14px",
                  background: isSelected
                    ? "oklch(0.78 0.22 195 / 0.15)"
                    : "transparent",
                  border: "none",
                  borderBottom:
                    index < LANGUAGES.length - 1
                      ? "1px solid oklch(0.78 0.22 195 / 0.08)"
                      : "none",
                  color: isSelected
                    ? "oklch(0.90 0.20 195)"
                    : "oklch(0.80 0.05 200)",
                  fontFamily: "'Sora', sans-serif",
                  fontSize: "13px",
                  fontWeight: isSelected ? "700" : "400",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "oklch(0.78 0.22 195 / 0.08)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                  }
                }}
              >
                <span style={{ fontSize: "18px", flexShrink: 0 }}>
                  {language.flag}
                </span>
                <span>{language.nativeName}</span>
                {isSelected && (
                  <svg
                    role="img"
                    aria-label="selected"
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    style={{ marginLeft: "auto", flexShrink: 0 }}
                  >
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="oklch(0.78 0.22 195)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
