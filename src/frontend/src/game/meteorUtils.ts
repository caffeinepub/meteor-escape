import { METEOR_COLOR_SETS, PLAYER_HITBOX_RADIUS } from "./constants";
import type { Meteor, PowerUp } from "./types";

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
    // Kırmızı kalp
    ctx.scale(pulse, pulse);
    const r = powerUp.radius;

    // Outer glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(255, 60, 60, 0.8)";

    // Heart shape using bezier curves
    ctx.beginPath();
    const s = r * 0.055;
    ctx.moveTo(0, r * 0.3);
    ctx.bezierCurveTo(
      -r * 0.6 * s * 10,
      r * 0.05 * s * 10,
      -r * 1.0,
      -r * 0.4,
      0,
      -r * 0.7,
    );
    ctx.bezierCurveTo(
      r * 1.0,
      -r * 0.4,
      r * 0.6 * s * 10,
      r * 0.05 * s * 10,
      0,
      r * 0.3,
    );
    ctx.closePath();

    const heartGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.3, 0, 0, 0, r);
    heartGrad.addColorStop(0, "#FF8080");
    heartGrad.addColorStop(0.5, "#FF2222");
    heartGrad.addColorStop(1, "#CC0000");
    ctx.fillStyle = heartGrad;
    ctx.fill();
    ctx.strokeStyle = "#FF6666";
    ctx.lineWidth = 2;
    ctx.stroke();

    // White specular
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(-r * 0.25, -r * 0.4, r * 0.18, r * 0.12, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fill();
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
 * Draw player badge (shield) on canvas
 */
export function drawPlayerBadge(
  ctx: CanvasRenderingContext2D,
  bodyCenter: { x: number; y: number },
  playerName: string,
  isHit: boolean,
  isInvincible: boolean,
): void {
  const { x, y } = bodyCenter;
  const r = 50;

  ctx.save();

  // Shake effect on hit
  if (isHit) {
    ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
  }

  const color = isHit ? "#FF3333" : "#FFD700";
  const glowColor = isHit ? "rgba(255, 51, 51, 0.6)" : "rgba(255, 215, 0, 0.6)";

  // Outer glow ring
  ctx.shadowBlur = 20;
  ctx.shadowColor = glowColor;

  // Invincibility flash effect
  const opacity =
    isInvincible && !isHit ? 0.5 + Math.sin(Date.now() * 0.015) * 0.5 : 1.0;
  ctx.globalAlpha = opacity;

  // Shield gradient background
  const shieldGrad = ctx.createRadialGradient(
    x - r * 0.2,
    y - r * 0.3,
    r * 0.1,
    x,
    y,
    r,
  );
  if (isHit) {
    shieldGrad.addColorStop(0, "rgba(255, 80, 80, 0.5)");
    shieldGrad.addColorStop(0.6, "rgba(180, 20, 20, 0.35)");
    shieldGrad.addColorStop(1, "rgba(100, 0, 0, 0.2)");
  } else {
    shieldGrad.addColorStop(0, "rgba(255, 230, 50, 0.4)");
    shieldGrad.addColorStop(0.6, "rgba(200, 150, 0, 0.25)");
    shieldGrad.addColorStop(1, "rgba(120, 80, 0, 0.15)");
  }

  // Draw shield circle
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = shieldGrad;
  ctx.fill();

  // Shield border
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner decorative ring
  ctx.beginPath();
  ctx.arc(x, y, r - 8, 0, Math.PI * 2);
  ctx.strokeStyle = `${color}44`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Player initial letter
  const initial = playerName.charAt(0).toUpperCase() || "?";
  ctx.shadowBlur = 10;
  ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
  ctx.font = 'bold 28px "Orbitron", "Sora", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(initial, x, y);

  ctx.restore();
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
): void {
  ctx.save();

  // Semi-transparent HUD bar at top
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(0, 0, canvasWidth, 70);

  // Border bottom
  const hudGrad = ctx.createLinearGradient(0, 68, canvasWidth, 68);
  hudGrad.addColorStop(0, "transparent");
  hudGrad.addColorStop(0.3, "#00ffcc44");
  hudGrad.addColorStop(0.7, "#00ffcc44");
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
  ctx.fillStyle = "rgba(0, 255, 204, 0.6)";
  ctx.fillText(scoreLabel, canvasWidth / 2, 18);
  ctx.font = 'bold 26px "Orbitron", "Sora", monospace';
  ctx.fillStyle = "#00ffcc";
  ctx.shadowBlur = 12;
  ctx.shadowColor = "#00ffcc";
  ctx.fillText(score.toString(), canvasWidth / 2, 48);
  ctx.shadowBlur = 0;

  // Level (right side)
  ctx.textAlign = "right";
  ctx.font = 'bold 12px "Orbitron", "Sora", monospace';
  ctx.fillStyle = "rgba(255, 215, 0, 0.6)";
  ctx.fillText(levelLabel, canvasWidth - 16, 18);
  ctx.font = 'bold 28px "Orbitron", "Sora", monospace';
  ctx.fillStyle = "#FFD700";
  ctx.shadowBlur = 12;
  ctx.shadowColor = "#FFD700";
  ctx.fillText(level.toString(), canvasWidth - 16, 48);
  ctx.shadowBlur = 0;

  ctx.restore();
}
