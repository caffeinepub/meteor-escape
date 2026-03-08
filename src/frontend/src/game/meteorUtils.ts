import { METEOR_COLOR_SETS, PLAYER_HITBOX_RADIUS } from "./constants";
import type { Meteor, PowerUp } from "./types";

/**
 * Returns a hex color string with the given 0-255 alpha appended as two hex digits.
 * Falls back to rgba() if the input is not a 6-char hex color, so Canvas never
 * receives an invalid value like "oklch(...)44".
 */
function hexWithAlpha(color: string, alpha: number): string {
  const hex = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    const a = Math.round(Math.max(0, Math.min(255, alpha)))
      .toString(16)
      .padStart(2, "0");
    return `${hex}${a}`;
  }
  // Fallback: convert to rgba using a temporary canvas (avoid oklch crash)
  const a01 = alpha / 255;
  return `rgba(128,128,128,${a01.toFixed(2)})`;
}

let meteorIdCounter = 0;

/**
 * Create a new meteor spawning at the top of the canvas
 */
export function createMeteor(
  canvasWidth: number,
  speedMin: number,
  speedMax: number,
): Meteor {
  const id = ++meteorIdCounter;
  const radius = 20 + Math.random() * 25; // 20-45px
  const x = radius + Math.random() * (canvasWidth - radius * 2);
  const y = -radius - 10;
  const vy = speedMin + Math.random() * (speedMax - speedMin);
  const vx = (Math.random() - 0.5) * 2; // -1 to 1

  // Generate irregular polygon vertices (5-8 corners)
  const numVertices = 5 + Math.floor(Math.random() * 4);
  const vertices: { x: number; y: number }[] = [];
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * Math.PI * 2;
    const variance = 0.7 + Math.random() * 0.6; // 0.7 to 1.3 (±30%)
    vertices.push({
      x: Math.cos(angle) * radius * variance,
      y: Math.sin(angle) * radius * variance,
    });
  }

  // Generate crack lines (2-3 cracks)
  const numCracks = 2 + Math.floor(Math.random() * 2);
  const crackLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < numCracks; i++) {
    const angle = Math.random() * Math.PI * 2;
    const len = radius * (0.4 + Math.random() * 0.5);
    const startAngle = angle + (Math.random() - 0.5) * 0.5;
    crackLines.push({
      x1: Math.cos(startAngle) * radius * 0.1,
      y1: Math.sin(startAngle) * radius * 0.1,
      x2: Math.cos(angle) * len,
      y2: Math.sin(angle) * len,
    });
  }

  return {
    id,
    x,
    y,
    vx,
    vy,
    radius,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.06,
    vertices,
    colorSet: Math.floor(Math.random() * METEOR_COLOR_SETS.length),
    crackLines,
  };
}

/**
 * Update meteor position
 */
export function updateMeteor(meteor: Meteor): Meteor {
  return {
    ...meteor,
    x: meteor.x + meteor.vx,
    y: meteor.y + meteor.vy,
    rotation: meteor.rotation + meteor.rotationSpeed,
  };
}

/**
 * Check if meteor is off screen (passed through bottom)
 */
export function isMeteorOffScreen(
  meteor: Meteor,
  canvasHeight: number,
): boolean {
  return meteor.y > canvasHeight + meteor.radius + 10;
}

/**
 * Check collision between meteor and player body center
 */
export function checkCollision(
  meteor: Meteor,
  bodyCenter: { x: number; y: number },
): boolean {
  const dx = meteor.x - bodyCenter.x;
  const dy = meteor.y - bodyCenter.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < meteor.radius + PLAYER_HITBOX_RADIUS;
}

/**
 * Draw a single meteor on canvas
 */
export function drawMeteor(
  ctx: CanvasRenderingContext2D,
  meteor: Meteor,
): void {
  const colors = METEOR_COLOR_SETS[meteor.colorSet];

  ctx.save();
  ctx.translate(meteor.x, meteor.y);
  ctx.rotate(meteor.rotation);

  // Radial gradient for 3D effect
  const grad = ctx.createRadialGradient(
    -meteor.radius * 0.25,
    -meteor.radius * 0.25,
    meteor.radius * 0.05,
    0,
    0,
    meteor.radius * 1.2,
  );
  grad.addColorStop(0, colors.inner);
  grad.addColorStop(0.5, colors.mid);
  grad.addColorStop(1, colors.outer);

  // Draw irregular polygon
  ctx.beginPath();
  if (meteor.vertices.length > 0) {
    ctx.moveTo(meteor.vertices[0].x, meteor.vertices[0].y);
    for (let i = 1; i < meteor.vertices.length; i++) {
      ctx.lineTo(meteor.vertices[i].x, meteor.vertices[i].y);
    }
    ctx.closePath();
  }

  ctx.fillStyle = grad;
  ctx.fill();

  // Outer glow / atmosphere
  ctx.shadowBlur = 15;
  ctx.shadowColor = colors.mid;
  ctx.strokeStyle = colors.outer;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Crack lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 0.8;
  for (const crack of meteor.crackLines) {
    ctx.beginPath();
    ctx.moveTo(crack.x1, crack.y1);
    ctx.lineTo(crack.x2, crack.y2);
    ctx.stroke();
  }

  // Specular highlight (top-left)
  const specGrad = ctx.createRadialGradient(
    -meteor.radius * 0.35,
    -meteor.radius * 0.35,
    0,
    -meteor.radius * 0.35,
    -meteor.radius * 0.35,
    meteor.radius * 0.4,
  );
  specGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
  specGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = specGrad;
  ctx.beginPath();
  ctx.ellipse(
    -meteor.radius * 0.35,
    -meteor.radius * 0.35,
    meteor.radius * 0.28,
    meteor.radius * 0.18,
    -0.5,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.restore();
}

// ===================== POWER-UP UTILS =====================

let powerUpIdCounter = 0;

/**
 * Create a new power-up spawning at the top of the canvas
 */
export function createPowerUp(
  canvasWidth: number,
  type: "heart" | "coin",
): PowerUp {
  const id = ++powerUpIdCounter;
  const radius = type === "heart" ? 28 : 22;
  const x = radius + Math.random() * (canvasWidth - radius * 2);
  const y = -radius - 10;
  const vy = 2.5 + Math.random() * 1.5; // slower than meteors

  return {
    id,
    x,
    y,
    vy,
    radius,
    type,
    rotation: 0,
    rotationSpeed: type === "coin" ? 0.03 : 0,
    pulsePhase: Math.random() * Math.PI * 2,
  };
}

/**
 * Update power-up position
 */
export function updatePowerUp(powerUp: PowerUp): PowerUp {
  return {
    ...powerUp,
    x: powerUp.x,
    y: powerUp.y + powerUp.vy,
    rotation: powerUp.rotation + powerUp.rotationSpeed,
    pulsePhase: powerUp.pulsePhase + 0.05,
  };
}

/**
 * Check if power-up is off screen
 */
export function isPowerUpOffScreen(
  powerUp: PowerUp,
  canvasHeight: number,
): boolean {
  return powerUp.y > canvasHeight + powerUp.radius + 10;
}

/**
 * Check collision between power-up and player body center
 */
export function checkPowerUpCollision(
  powerUp: PowerUp,
  bodyCenter: { x: number; y: number },
): boolean {
  const dx = powerUp.x - bodyCenter.x;
  const dy = powerUp.y - bodyCenter.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < powerUp.radius + PLAYER_HITBOX_RADIUS;
}

/**
 * Draw a power-up on canvas
 */
export function drawPowerUp(
  ctx: CanvasRenderingContext2D,
  powerUp: PowerUp,
): void {
  ctx.save();
  ctx.translate(powerUp.x, powerUp.y);

  const pulse = 1 + Math.sin(powerUp.pulsePhase) * 0.08;

  if (powerUp.type === "heart") {
    // Gerçekçi kırmızı kalp
    ctx.scale(pulse, pulse);
    const r = powerUp.radius;

    // Outer glow
    ctx.shadowBlur = 24;
    ctx.shadowColor = "rgba(255, 60, 60, 0.9)";

    // Perfect heart shape using standard bezier formula
    // Heart centered at (0,0), size ~r*2
    const hs = r * 0.9; // heart scale factor
    ctx.beginPath();
    // Start at the bottom point of the heart
    ctx.moveTo(0, hs);
    // Left lobe
    ctx.bezierCurveTo(
      -hs * 0.2,
      hs * 0.6,
      -hs * 1.1,
      hs * 0.3,
      -hs * 1.1,
      -hs * 0.1,
    );
    ctx.bezierCurveTo(-hs * 1.1, -hs * 0.65, -hs * 0.6, -hs, 0, -hs * 0.5);
    // Right lobe
    ctx.bezierCurveTo(hs * 0.6, -hs, hs * 1.1, -hs * 0.65, hs * 1.1, -hs * 0.1);
    ctx.bezierCurveTo(hs * 1.1, hs * 0.3, hs * 0.2, hs * 0.6, 0, hs);
    ctx.closePath();

    const heartGrad = ctx.createRadialGradient(
      -r * 0.2,
      -r * 0.25,
      r * 0.05,
      0,
      0,
      r * 1.1,
    );
    heartGrad.addColorStop(0, "#FF9090");
    heartGrad.addColorStop(0.4, "#FF2222");
    heartGrad.addColorStop(1, "#990000");
    ctx.fillStyle = heartGrad;
    ctx.fill();

    ctx.strokeStyle = "#FF8888";
    ctx.lineWidth = 2;
    ctx.stroke();

    // White specular highlight (top-left)
    ctx.shadowBlur = 0;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, hs);
    ctx.bezierCurveTo(
      -hs * 0.2,
      hs * 0.6,
      -hs * 1.1,
      hs * 0.3,
      -hs * 1.1,
      -hs * 0.1,
    );
    ctx.bezierCurveTo(-hs * 1.1, -hs * 0.65, -hs * 0.6, -hs, 0, -hs * 0.5);
    ctx.bezierCurveTo(hs * 0.6, -hs, hs * 1.1, -hs * 0.65, hs * 1.1, -hs * 0.1);
    ctx.bezierCurveTo(hs * 1.1, hs * 0.3, hs * 0.2, hs * 0.6, 0, hs);
    ctx.closePath();
    ctx.clip();
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.32, r * 0.2, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.fill();
    ctx.restore();
  } else {
    // Altın coin
    ctx.rotate(powerUp.rotation);
    ctx.scale(pulse, pulse);
    const r = powerUp.radius;

    // Outer glow
    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(255, 215, 0, 0.9)";

    // Outer ring
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    const coinGrad = ctx.createRadialGradient(
      -r * 0.2,
      -r * 0.25,
      r * 0.05,
      0,
      0,
      r,
    );
    coinGrad.addColorStop(0, "#FFF200");
    coinGrad.addColorStop(0.4, "#FFD700");
    coinGrad.addColorStop(0.75, "#FFA500");
    coinGrad.addColorStop(1, "#CC7700");
    ctx.fillStyle = coinGrad;
    ctx.fill();

    ctx.strokeStyle = "#FFE066";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner circle
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 240, 100, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // "$" text inside coin
    ctx.font = `bold ${r * 0.9}px "Orbitron", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(180, 100, 0, 0.8)";
    ctx.fillText("$", 0, 1);

    // Specular
    ctx.beginPath();
    ctx.ellipse(-r * 0.2, -r * 0.28, r * 0.22, r * 0.14, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draw player badge (superhero emblem shield) on canvas
 */
export function drawPlayerBadge(
  ctx: CanvasRenderingContext2D,
  bodyCenter: { x: number; y: number },
  playerName: string,
  isHit: boolean,
  isInvincible: boolean,
): void {
  const { x, y } = bodyCenter;
  const r = 52;

  ctx.save();

  // Shake effect on hit
  if (isHit) {
    ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
  }

  const primaryColor = isHit ? "#FF3333" : "#FFD700";
  const rimColor = isHit ? "#FF6666" : "#FFF080";
  const glowColor = isHit ? "rgba(255, 51, 51, 0.7)" : "rgba(255, 215, 0, 0.7)";
  const fillColor1 = isHit
    ? "rgba(220, 30, 30, 0.65)"
    : "rgba(255, 200, 0, 0.5)";
  const fillColor2 = isHit
    ? "rgba(140, 0, 0, 0.45)"
    : "rgba(180, 110, 0, 0.35)";
  const fillColor3 = isHit ? "rgba(80, 0, 0, 0.25)" : "rgba(100, 60, 0, 0.18)";

  // Invincibility flash effect
  const opacity =
    isInvincible && !isHit ? 0.4 + Math.sin(Date.now() * 0.02) * 0.55 : 1.0;
  ctx.globalAlpha = opacity;

  // ===== SUPERHERO PENTAGON SHIELD SHAPE =====
  // Classic comic-book shield: slightly wider top, pointed bottom
  ctx.save();
  ctx.translate(x, y);

  const sw = r; // half-width
  const sh = r * 1.15; // half-height
  const topR = r * 0.18; // top corner radius

  // Shield path: flat top with rounded corners, tapered sides, pointed bottom
  ctx.beginPath();
  // Top-left corner arc
  ctx.moveTo(-sw + topR, -sh * 0.55);
  ctx.quadraticCurveTo(-sw, -sh * 0.55, -sw, -sh * 0.55 + topR);
  // Left side curving inward
  ctx.bezierCurveTo(-sw, -sh * 0.1, -sw * 0.85, sh * 0.35, 0, sh);
  // Right side (mirror)
  ctx.bezierCurveTo(sw * 0.85, sh * 0.35, sw, -sh * 0.1, sw, -sh * 0.55 + topR);
  // Top-right corner arc
  ctx.quadraticCurveTo(sw, -sh * 0.55, sw - topR, -sh * 0.55);
  // Top edge
  ctx.lineTo(-sw + topR, -sh * 0.55);
  ctx.closePath();

  // Outer glow
  ctx.shadowBlur = 28;
  ctx.shadowColor = glowColor;

  // Background gradient (radial, from bright inner to dark edge)
  const shieldGrad = ctx.createRadialGradient(
    -sw * 0.15,
    -sh * 0.25,
    r * 0.05,
    0,
    0,
    r * 1.3,
  );
  shieldGrad.addColorStop(0, fillColor1);
  shieldGrad.addColorStop(0.55, fillColor2);
  shieldGrad.addColorStop(1, fillColor3);
  ctx.fillStyle = shieldGrad;
  ctx.fill();

  // Outer border
  ctx.shadowBlur = 0;
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // ===== INNER DECORATIVE SHIELD (smaller, inset) =====
  const innerScale = 0.72;
  ctx.save();
  ctx.scale(innerScale, innerScale);

  ctx.beginPath();
  ctx.moveTo(-sw + topR, -sh * 0.55);
  ctx.quadraticCurveTo(-sw, -sh * 0.55, -sw, -sh * 0.55 + topR);
  ctx.bezierCurveTo(-sw, -sh * 0.1, -sw * 0.85, sh * 0.35, 0, sh);
  ctx.bezierCurveTo(sw * 0.85, sh * 0.35, sw, -sh * 0.1, sw, -sh * 0.55 + topR);
  ctx.quadraticCurveTo(sw, -sh * 0.55, sw - topR, -sh * 0.55);
  ctx.lineTo(-sw + topR, -sh * 0.55);
  ctx.closePath();

  ctx.strokeStyle = `${rimColor}55`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // ===== SPECULAR HIGHLIGHT (top-left shine) =====
  const specGrad = ctx.createRadialGradient(
    -sw * 0.3,
    -sh * 0.3,
    0,
    -sw * 0.3,
    -sh * 0.3,
    r * 0.55,
  );
  specGrad.addColorStop(0, "rgba(255, 255, 255, 0.35)");
  specGrad.addColorStop(0.6, "rgba(255, 255, 255, 0.08)");
  specGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

  // Clip to shield shape for specular
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-sw + topR, -sh * 0.55);
  ctx.quadraticCurveTo(-sw, -sh * 0.55, -sw, -sh * 0.55 + topR);
  ctx.bezierCurveTo(-sw, -sh * 0.1, -sw * 0.85, sh * 0.35, 0, sh);
  ctx.bezierCurveTo(sw * 0.85, sh * 0.35, sw, -sh * 0.1, sw, -sh * 0.55 + topR);
  ctx.quadraticCurveTo(sw, -sh * 0.55, sw - topR, -sh * 0.55);
  ctx.lineTo(-sw + topR, -sh * 0.55);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = specGrad;
  ctx.fillRect(-sw, -sh, sw * 2, sh * 0.7);
  ctx.restore();

  // ===== PLAYER INITIAL LETTER =====
  const initial = playerName.charAt(0).toUpperCase() || "?";
  ctx.shadowBlur = 14;
  ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
  ctx.font = `bold 30px "Orbitron", "Sora", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(initial, 0, -sh * 0.08);

  ctx.restore(); // restore translate(x, y)
  ctx.restore(); // restore main
}

/**
 * Draw HUD (heads up display) on canvas
 */
export function drawHUD(
  ctx: CanvasRenderingContext2D,
  lives: number,
  score: number,
  level: number,
  canvasWidth: number,
  scoreLabel = "SCORE",
  levelLabel = "LEVEL",
  primaryColor = "#00ffcc",
  secondaryColor = "#FFD700",
): void {
  ctx.save();

  // Semi-transparent HUD bar at top
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(0, 0, canvasWidth, 70);

  // Border bottom with theme primary color
  const hudGrad = ctx.createLinearGradient(0, 68, canvasWidth, 68);
  hudGrad.addColorStop(0, "transparent");
  hudGrad.addColorStop(0.3, hexWithAlpha(primaryColor, 0x44));
  hudGrad.addColorStop(0.7, hexWithAlpha(primaryColor, 0x44));
  hudGrad.addColorStop(1, "transparent");
  ctx.fillStyle = hudGrad;
  ctx.fillRect(0, 68, canvasWidth, 2);

  // Lives (hearts)
  const heartSymbol = "♥";
  for (let i = 0; i < 3; i++) {
    ctx.font = "bold 26px serif";
    ctx.textBaseline = "middle";
    if (i < lives) {
      ctx.fillStyle = "#FF4444";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#FF4444";
    } else {
      ctx.fillStyle = "rgba(255, 68, 68, 0.2)";
      ctx.shadowBlur = 0;
    }
    ctx.fillText(heartSymbol, 20 + i * 36, 35);
  }
  ctx.shadowBlur = 0;

  // Score (center)
  ctx.textAlign = "center";
  ctx.font = 'bold 14px "Orbitron", "Sora", monospace';
  ctx.fillStyle = hexWithAlpha(primaryColor, 0x99);
  ctx.fillText(scoreLabel, canvasWidth / 2, 18);
  ctx.font = 'bold 26px "Orbitron", "Sora", monospace';
  ctx.fillStyle = primaryColor;
  ctx.shadowBlur = 12;
  ctx.shadowColor = primaryColor;
  ctx.fillText(score.toString(), canvasWidth / 2, 48);
  ctx.shadowBlur = 0;

  // Level (right side)
  ctx.textAlign = "right";
  ctx.font = 'bold 12px "Orbitron", "Sora", monospace';
  ctx.fillStyle = hexWithAlpha(secondaryColor, 0x99);
  ctx.fillText(levelLabel, canvasWidth - 16, 18);
  ctx.font = 'bold 28px "Orbitron", "Sora", monospace';
  ctx.fillStyle = secondaryColor;
  ctx.shadowBlur = 12;
  ctx.shadowColor = secondaryColor;
  ctx.fillText(level.toString(), canvasWidth - 16, 48);
  ctx.shadowBlur = 0;

  ctx.restore();
}
