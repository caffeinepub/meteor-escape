import { useMemo } from "react";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

export function StarField() {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 0.5 + Math.random() * 2,
      delay: Math.random() * 4,
      duration: 2 + Math.random() * 4,
    }));
  }, []);

  return (
    <div className="stars-bg" aria-hidden="true">
      {/* Nebula gradients */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at 20% 30%, oklch(0.4 0.15 265 / 0.4) 0%, transparent 50%), " +
            "radial-gradient(ellipse at 80% 70%, oklch(0.35 0.12 195 / 0.3) 0%, transparent 50%), " +
            "radial-gradient(ellipse at 60% 20%, oklch(0.3 0.10 300 / 0.2) 0%, transparent 40%)",
        }}
      />
      {/* Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
