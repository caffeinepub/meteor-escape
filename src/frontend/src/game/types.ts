// Game screen states
export type GameScreen = "start" | "game" | "levelup" | "gameover";

// Meteor object
export interface Meteor {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  vertices: { x: number; y: number }[];
  colorSet: number;
  crackLines: { x1: number; y1: number; x2: number; y2: number }[];
}

// Body center position
export interface BodyCenter {
  x: number;
  y: number;
}

// Level config
export interface LevelConfig {
  level: number;
  scoreThreshold: number;
  spawnMs: number;
  speedMin: number;
  speedMax: number;
  maxMeteors: number;
}

// Game state
export interface GameState {
  screen: GameScreen;
  playerName: string;
  score: number;
  highScore: number;
  lives: number;
  currentLevel: number;
  meteors: Meteor[];
  bodyCenter: BodyCenter | null;
  isInvincible: boolean;
  isPaused: boolean;
  isHit: boolean;
}

// Score popup
export interface ScorePopup {
  id: number;
  x: number;
  y: number;
  value: number;
  timestamp: number;
}

// MediaPipe global declarations
declare global {
  interface Window {
    Pose: new (config: {
      locateFile: (file: string) => string;
    }) => MediaPipePose;
    Camera: new (
      videoElement: HTMLVideoElement,
      config: {
        onFrame: () => Promise<void>;
        width: number;
        height: number;
      },
    ) => MediaPipeCamera;
  }
}

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseResults {
  poseLandmarks?: PoseLandmark[];
  image: HTMLVideoElement | HTMLImageElement;
}

export interface MediaPipePose {
  setOptions: (options: {
    modelComplexity?: number;
    smoothLandmarks?: boolean;
    enableSegmentation?: boolean;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }) => void;
  onResults: (callback: (results: PoseResults) => void) => void;
  send: (inputs: {
    image: HTMLVideoElement | HTMLImageElement;
  }) => Promise<void>;
  close: () => Promise<void>;
}

export interface MediaPipeCamera {
  start: () => Promise<void>;
  stop: () => void;
}
