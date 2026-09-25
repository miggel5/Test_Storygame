import {
  buildSpec,
  createGrid,
  fillRect,
  hoodedFigure,
  noiseDither,
  outlineRect,
  playerBack,
  radialGlow,
} from "./pixelArtHelpers.ts";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- shared composition helpers for this track ----------

function jailBars(grid: number[][], x: number, y: number, w: number, h: number, barColor: number, count = 6) {
  const spacing = w / count;
  for (let i = 0; i <= count; i++) {
    const bx = x + Math.round(i * spacing);
    fillRect(grid, bx, y, 1, h, barColor);
  }
  fillRect(grid, x, y, w, 1, barColor);
  fillRect(grid, x, y + h - 1, w, 1, barColor);
}

function ventGrate(grid: number[][], x: number, y: number, w: number, h: number, gridColor: number, holeColor: number) {
  outlineRect(grid, x, y, w, h, holeColor, gridColor);
  for (let gy = y + 2; gy < y + h - 2; gy += 3) {
    fillRect(grid, x + 1, gy, w - 2, 1, gridColor);
  }
  for (let gx = x + 2; gx < x + w - 2; gx += 3) {
    fillRect(grid, gx, y + 1, 1, h - 2, gridColor);
  }
}

function terminalScreen(
  grid: number[][],
  x: number,
  y: number,
  w: number,
  h: number,
  frameColor: number,
  screenColor: number,
  glowColor: string
) {
  outlineRect(grid, x, y, w, h, screenColor, frameColor);
  return radialGlow(x + Math.floor(w / 2), y + Math.floor(h / 2), 6, "pulse", glowColor);
}

function crowdSilhouettes(
  grid: number[][],
  count: number,
  xRange: [number, number],
  yRange: [number, number],
  colorIndex: number,
  rng: () => number
) {
  for (let i = 0; i < count; i++) {
    const x = xRange[0] + Math.floor(rng() * (xRange[1] - xRange[0]));
    const y = yRange[0] + Math.floor(rng() * (yRange[1] - yRange[0]));
    fillRect(grid, x, y, 6, 16, colorIndex);
  }
}

function uniformedFigure(grid: number[][], x: number, y: number, scale: number, bodyColor: number, trimColor: number) {
  const s = (n: number) => Math.round(n * scale);
  fillRect(grid, x + s(2), y, s(4), s(3), bodyColor); // helmet/head
  fillRect(grid, x, y + s(3), s(8), s(2), trimColor); // shoulder trim
  fillRect(grid, x + s(1), y + s(5), s(6), s(8), bodyColor); // torso
  fillRect(grid, x + s(1), y + s(13), s(6), s(1), trimColor); // belt
  fillRect(grid, x, y + s(14), s(3), s(6), bodyColor); // leg
  fillRect(grid, x + s(5), y + s(14), s(3), s(6), bodyColor); // leg
}

// ---------- palettes ----------

const jailPalette = ["#0a0c12", "#1c2230", "#2f3b4f", "#546178", "#8fa3bd", "#0e0e14", "#3a2020", "#ff6b4d", "#c9d6e8"];
const ventPalette = ["#050a08", "#0f2420", "#1c3f34", "#2f6e5a", "#5fd9b0", "#0a1512", "#223028", "#ffd27f", "#8fffe0"];
const marketPalette = ["#0d0616", "#2a1240", "#4a1f66", "#7a2f8f", "#c93fd6", "#170a22", "#3a1550", "#ff4da6", "#f5c8ff"];
const mysticPalette = ["#0c0818", "#241a3a", "#3a2a5c", "#5c4a86", "#8f7fc9", "#120c22", "#2a1f40", "#7fe8ff", "#c9a6ff"];
const cosmicPalette = ["#04050a", "#0e1830", "#1a3a5c", "#2f6e9e", "#7fd9ff", "#e8f5ff", "#0a0e1a", "#ff4dd8", "#ffffff"];
const heistPalette = ["#08060a", "#1c1622", "#3a2a1a", "#6e4f2a", "#d9a84a", "#120e16", "#2a2018", "#ffd700", "#fff4c9"];
const doubtPalette = ["#0a0e16", "#1c2838", "#2f4258", "#4a6280", "#7fa8c9", "#141c26", "#2a3a4a", "#ffb347", "#c9e0f0"];
const policePalette = ["#080a10", "#18202e", "#2a3648", "#465a74", "#7fa0c0", "#0e1420", "#243040", "#4dd0ff", "#e0e8f0"];
const handlerPalette = ["#080a0e", "#161c26", "#28323e", "#42525f", "#7f9aa8", "#0e1216", "#222a30", "#ffb347", "#d0e8f0"];
const stakeoutPalette = ["#0a0714", "#1e1030", "#3a1f52", "#5c2f7a", "#ff9ecb", "#12081e", "#2a1840", "#f5e6a8", "#8fd9ff"];
const liaisonPalette = ["#07100c", "#122420", "#1f3a30", "#2f5c48", "#6ea888", "#0a1814", "#1a2c24", "#ff4d4d", "#c9ffe0"];

// ---------- template functions (one call per scene image) ----------

function jailScene128(seed: number, palette: string[], variant: string) {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);

  fillRect(grid, 0, 0, 128, 72, 1);
  noiseDither(grid, 0, 0, 128, 72, 2, 0.08, rng);
  fillRect(grid, 0, 72, 128, 56, 5);
  noiseDither(grid, 0, 72, 128, 56, 2, 0.12, mulberry32(seed + 1));
  fillRect(grid, 0, 72, 128, 2, 6);

  let glow: ReturnType<typeof radialGlow> = [];

  if (variant === "cell" || variant === "cell-listen") {
    jailBars(grid, 40, 12, 48, 24, 6);
    fillRect(grid, 40, 12, 48, 2, 2);
    playerBack(grid, 58, 84, 7, 5);
    if (variant === "cell-listen") {
      fillRect(grid, 8, 60, 4, 40, 3);
      playerBack(grid, 14, 84, 7, 4);
    }
    glow = [
      ...radialGlow(64, 20, 8, "flicker", "#8fa3bd", mulberry32(seed + 2)),
      { x: 60, y: 88, animation: "pulse", color: "#ff6b4d" },
    ];
  } else if (variant === "corridor" || variant === "corridor-deal" || variant === "corridor-caught") {
    for (let i = 0; i < 4; i++) {
      const cx = 6 + i * 30;
      jailBars(grid, cx, 20, 16, 44, 6);
    }
    uniformedFigure(grid, 96, 74, 3, 3, 7);
    if (variant === "corridor-deal") {
      fillRect(grid, 100, 90, 6, 2, 8);
      glow = [{ x: 102, y: 91, animation: "sparkle", color: "#ffd27f" }];
    }
    if (variant === "corridor-caught") {
      fillRect(grid, 0, 0, 128, 72, 6);
      noiseDither(grid, 0, 0, 128, 72, 1, 0.1, mulberry32(seed + 3));
    }
    glow = [...glow, ...radialGlow(108, 78, 6, "pulse", "#ff6b4d", mulberry32(seed + 4))];
  } else if (variant === "dark" || variant === "dark-rash") {
    fillRect(grid, 0, 0, 128, 128, 5);
    fillRect(grid, 50, 20, 28, 40, 1);
    noiseDither(grid, 50, 20, 28, 40, 2, 0.2, mulberry32(seed + 5));
    playerBack(grid, 60, 92, 7, 4);
    glow = radialGlow(64, 30, 10, "flicker", "#546178", mulberry32(seed + 6));
  } else if (variant === "wall-tap" || variant === "wall-tap-close" || variant === "wall-tap-network") {
    fillRect(grid, 60, 0, 8, 128, 2);
    playerBack(grid, 40, 88, 7, 4);
    playerBack(grid, 80, 88, 7, 4);
    if (variant === "wall-tap-network") {
      noiseDither(grid, 62, 40, 4, 40, 8, 0.3, mulberry32(seed + 7));
    }
    glow = [
      { x: 62, y: 60, animation: "pulse", color: "#ff6b4d" },
      { x: 66, y: 60, animation: "pulse", color: "#ff6b4d" },
      ...radialGlow(40, 84, 6, "sparkle", "#c9d6e8", mulberry32(seed + 8)),
      ...radialGlow(80, 84, 6, "sparkle", "#c9d6e8", mulberry32(seed + 9)),
    ];
  }

  return buildSpec(128, 128, palette, grid, glow);
}

function ventBreakout128(seed: number, palette: string[], variant: string) {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);
  fillRect(grid, 0, 0, 128, 128, 1);
  noiseDither(grid, 0, 0, 128, 128, 2, 0.06, rng);

  let glow: ReturnType<typeof radialGlow> = [];

  if (variant === "shaft-entry") {
    ventGrate(grid, 44, 30, 40, 28, 6, 2);
    playerBack(grid, 56, 70, 4, 5);
    glow = radialGlow(64, 44, 10, "flicker", "#5fd9b0", mulberry32(seed + 1));
  } else if (variant === "shadow-figures") {
    fillRect(grid, 0, 0, 128, 128, 5);
    hoodedFigure(grid, 30, 60, 2, 3, 6);
    hoodedFigure(grid, 80, 60, 2, 3, 6);
    playerBack(grid, 58, 92, 6, 4);
    glow = [
      { x: 36, y: 74, animation: "pulse", color: "#7fe8ff" },
      { x: 86, y: 74, animation: "pulse", color: "#7fe8ff" },
      ...radialGlow(64, 100, 8, "sparkle", "#8fffe0", mulberry32(seed + 2)),
    ];
  } else if (variant === "crawl") {
    for (let i = 0; i < 5; i++) {
      const w = 60 - i * 8;
      const x = 64 - w / 2;
      const y = 20 + i * 16;
      outlineRect(grid, x, y, w, 10, 2, 6);
    }
    playerBack(grid, 58, 104, 6, 4);
    glow = radialGlow(64, 24, 8, "flicker", "#5fd9b0", mulberry32(seed + 3));
  } else if (variant === "open-sky") {
    fillRect(grid, 0, 0, 128, 60, 7);
    noiseDither(grid, 0, 0, 128, 60, 8, 0.06, mulberry32(seed + 4));
    const starRng = mulberry32(seed + 5);
    for (let i = 0; i < 14; i++) grid[Math.floor(starRng() * 50)][Math.floor(starRng() * 128)] = 8;
    fillRect(grid, 0, 60, 128, 68, 3);
    playerBack(grid, 58, 84, 7, 5);
    glow = radialGlow(64, 40, 14, "sparkle", "#8fffe0", mulberry32(seed + 6));
  }

  return buildSpec(128, 128, palette, grid, glow);
}

function undergroundMarket128(seed: number, palette: string[], variant: string) {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);
  fillRect(grid, 0, 88, 128, 40, 6);
  noiseDither(grid, 0, 88, 128, 40, 5, 0.15, rng);
  fillRect(grid, 0, 88, 128, 2, 7);
  noiseDither(grid, 0, 0, 128, 88, 1, 0.03, mulberry32(seed + 1));

  let glow: ReturnType<typeof radialGlow> = [];

  if (variant === "crowd-fear") {
    crowdSilhouettes(grid, 10, [0, 120], [60, 86], 5, mulberry32(seed + 2));
    hoodedFigure(grid, 52, 30, 8, 4, 3);
    glow = [
      ...radialGlow(60, 46, 10, "pulse", "#ff4da6", mulberry32(seed + 3)),
      { x: 20, y: 70, animation: "flicker", color: "#c93fd6" },
      { x: 108, y: 70, animation: "flicker", color: "#c93fd6" },
    ];
  } else if (variant === "nyx-approach") {
    hoodedFigure(grid, 30, 50, 8, 3, 3);
    playerBack(grid, 74, 90, 6, 4);
    outlineRect(grid, 20, 84, 20, 4, 2, 3);
    glow = [
      ...radialGlow(38, 58, 8, "sparkle", "#ff4da6", mulberry32(seed + 4)),
      { x: 42, y: 60, animation: "pulse", color: "#f5c8ff" },
    ];
  } else if (variant === "alone") {
    playerBack(grid, 58, 84, 7, 5);
    crowdSilhouettes(grid, 4, [0, 120], [64, 84], 5, mulberry32(seed + 5));
    glow = radialGlow(64, 100, 6, "flicker", "#7a2f8f", mulberry32(seed + 6));
  } else if (variant === "undercity-tunnel") {
    fillRect(grid, 0, 0, 128, 88, 5);
    outlineRect(grid, 44, 40, 40, 48, 6, 2);
    playerBack(grid, 58, 96, 6, 4);
    glow = radialGlow(64, 50, 10, "pulse", "#c93fd6", mulberry32(seed + 7));
  } else if (variant === "crew-table") {
    outlineRect(grid, 40, 78, 48, 16, 2, 3);
    hoodedFigure(grid, 26, 48, 8, 3, 3);
    playerBack(grid, 74, 60, 5, 3);
    crowdSilhouettes(grid, 3, [90, 120], [50, 78], 5, mulberry32(seed + 8));
    glow = radialGlow(64, 84, 8, "sparkle", "#ff4da6", mulberry32(seed + 9));
  }

  return buildSpec(128, 128, palette, grid, glow);
}

function mysticFigureScene128(seed: number, palette: string[], variant: string) {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);
  noiseDither(grid, 0, 0, 128, 128, 2, 0.04, rng);

  let glow: ReturnType<typeof radialGlow> = [];

  if (variant === "investigate") {
    fillRect(grid, 0, 90, 128, 38, 5);
    playerBack(grid, 56, 96, 6, 5);
    outlineRect(grid, 20, 40, 24, 30, 3, 6);
    glow = radialGlow(32, 50, 8, "pulse", "#7fe8ff", mulberry32(seed + 1));
  } else if (variant === "closeup") {
    hoodedFigure(grid, 44, 20, 6, 6, 8);
    fillRect(grid, 58, 46, 3, 3, 8);
    fillRect(grid, 68, 46, 3, 3, 8);
    glow = [
      { x: 59, y: 47, animation: "pulse", color: "#7fe8ff" },
      { x: 69, y: 47, animation: "pulse", color: "#7fe8ff" },
      ...radialGlow(64, 60, 12, "flicker", "#c9a6ff", mulberry32(seed + 2)),
    ];
  } else if (variant === "vanish") {
    hoodedFigure(grid, 48, 24, 6, 4, 8);
    noiseDither(grid, 44, 20, 40, 60, 4, 0.35, mulberry32(seed + 3));
    glow = radialGlow(64, 40, 10, "sparkle", "#c9a6ff", mulberry32(seed + 4));
  }

  return buildSpec(128, 128, palette, grid, glow);
}

function cosmicLab128(seed: number, palette: string[], _variant: string) {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);
  fillRect(grid, 0, 0, 128, 128, 1);
  noiseDither(grid, 0, 0, 128, 128, 2, 0.1, rng);

  const panelRng = mulberry32(seed + 1);
  for (let i = 0; i < 6; i++) {
    const x = Math.floor(panelRng() * 100);
    const y = Math.floor(panelRng() * 90);
    outlineRect(grid, x, y, 20, 12, 3, 5);
  }
  outlineRect(grid, 48, 44, 32, 32, 5, 8);
  fillRect(grid, 60, 56, 8, 8, 8);
  playerBack(grid, 58, 96, 6, 4);

  const glow = [
    ...radialGlow(64, 60, 16, "sparkle", "#7fd9ff", mulberry32(seed + 2)),
    { x: 64, y: 60, animation: "pulse" as const, color: "#ff4dd8" },
    ...radialGlow(20, 20, 6, "flicker", "#ffffff", mulberry32(seed + 3)),
    ...radialGlow(108, 20, 6, "flicker", "#ffffff", mulberry32(seed + 4)),
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

function heistVault128(seed: number, palette: string[], variant: string) {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);
  fillRect(grid, 0, 0, 128, 128, 1);
  noiseDither(grid, 0, 0, 128, 128, 2, 0.05, rng);
  fillRect(grid, 0, 96, 128, 32, 5);

  let glow: ReturnType<typeof radialGlow> = [];

  if (variant === "planning") {
    outlineRect(grid, 30, 70, 68, 20, 2, 3);
    hoodedFigure(grid, 16, 40, 8, 3, 3);
    playerBack(grid, 90, 60, 5, 3);
    glow = radialGlow(64, 78, 8, "pulse", "#d9a84a", mulberry32(seed + 1));
  } else if (variant === "lock-console") {
    outlineRect(grid, 44, 30, 40, 50, 3, 8);
    const consoleGlow = terminalScreen(grid, 50, 40, 28, 18, 8, 2, "#ffd700");
    glow = [...consoleGlow, ...radialGlow(64, 49, 8, "pulse", "#ffd700", mulberry32(seed + 2))];
  } else if (variant === "triumph") {
    outlineRect(grid, 44, 30, 40, 40, 3, 8);
    playerBack(grid, 56, 76, 6, 4);
    const sparkRng = mulberry32(seed + 3);
    for (let i = 0; i < 20; i++) grid[Math.floor(sparkRng() * 90)][Math.floor(sparkRng() * 128)] = 8;
    glow = radialGlow(64, 50, 16, "sparkle", "#ffd700", mulberry32(seed + 4));
  } else if (variant === "showdown") {
    playerBack(grid, 56, 60, 8, 4);
    crowdSilhouettes(grid, 6, [0, 120], [70, 96], 2, mulberry32(seed + 5));
    glow = radialGlow(64, 70, 14, "pulse", "#ffd700", mulberry32(seed + 6));
  } else if (variant === "exposed") {
    fillRect(grid, 0, 0, 128, 96, 5);
    playerBack(grid, 56, 60, 8, 4);
    glow = radialGlow(64, 30, 16, "pulse", "#ff4d4d", mulberry32(seed + 7));
  } else if (variant === "walkaway") {
    playerBack(grid, 20, 70, 6, 4);
    outlineRect(grid, 60, 40, 40, 40, 3, 8);
    glow = radialGlow(80, 55, 8, "flicker", "#ffd700", mulberry32(seed + 8));
  }

  return buildSpec(128, 128, palette, grid, glow);
}

function doubtRedemption128(seed: number, palette: string[], variant: string) {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);
  fillRect(grid, 0, 90, 128, 38, 5);
  noiseDither(grid, 0, 90, 128, 38, 2, 0.12, rng);
  noiseDither(grid, 0, 0, 128, 90, 1, 0.03, mulberry32(seed + 1));

  let glow: ReturnType<typeof radialGlow> = [];

  if (variant === "hesitate") {
    playerBack(grid, 58, 90, 6, 5);
    glow = radialGlow(64, 60, 10, "flicker", "#7fa8c9", mulberry32(seed + 2));
  } else if (variant === "confront-nyx") {
    hoodedFigure(grid, 30, 40, 3, 3, 8);
    playerBack(grid, 78, 66, 5, 4);
    glow = radialGlow(40, 50, 10, "pulse", "#ff4da6", mulberry32(seed + 3));
  } else if (variant === "walk-free") {
    fillRect(grid, 0, 0, 128, 90, 7);
    noiseDither(grid, 0, 0, 128, 90, 8, 0.06, mulberry32(seed + 4));
    playerBack(grid, 58, 70, 7, 5);
    glow = radialGlow(64, 30, 14, "sparkle", "#ffb347", mulberry32(seed + 5));
  } else if (variant === "marked") {
    fillRect(grid, 0, 0, 128, 90, 5);
    playerBack(grid, 58, 70, 7, 4);
    glow = radialGlow(64, 30, 10, "pulse", "#ff4d4d", mulberry32(seed + 6));
  }

  return buildSpec(128, 128, palette, grid, glow);
}

function policePrecinct128(seed: number, palette: string[], variant: string) {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);
  fillRect(grid, 0, 0, 128, 80, 1);
  fillRect(grid, 0, 80, 128, 48, 2);
  noiseDither(grid, 0, 80, 128, 48, 1, 0.1, rng);
  fillRect(grid, 0, 80, 128, 2, 8);

  let glow: ReturnType<typeof radialGlow> = [];

  if (variant === "briefing") {
    uniformedFigure(grid, 30, 50, 4, 3, 8);
    playerBack(grid, 80, 70, 5, 4);
    outlineRect(grid, 8, 20, 40, 24, 3, 8);
    glow = radialGlow(28, 32, 8, "pulse", "#4dd0ff", mulberry32(seed + 1));
  } else if (variant === "suspicion") {
    uniformedFigure(grid, 70, 50, 4, 3, 8);
    playerBack(grid, 30, 70, 5, 4);
    glow = radialGlow(76, 58, 6, "flicker", "#4dd0ff", mulberry32(seed + 2));
  } else if (variant === "archive") {
    for (let i = 0; i < 4; i++) outlineRect(grid, 8 + i * 28, 20, 20, 50, 3, 8);
    playerBack(grid, 56, 90, 5, 4);
    glow = radialGlow(64, 40, 8, "sparkle", "#e0e8f0", mulberry32(seed + 3));
  } else if (variant === "mission-map") {
    outlineRect(grid, 30, 20, 68, 44, 3, 8);
    const screenGlow = terminalScreen(grid, 36, 26, 56, 32, 8, 2, "#4dd0ff");
    playerBack(grid, 56, 88, 5, 4);
    glow = [...screenGlow, ...radialGlow(64, 42, 10, "pulse", "#4dd0ff", mulberry32(seed + 4))];
  }

  return buildSpec(128, 128, palette, grid, glow);
}

function handlerOffice128(seed: number, palette: string[], variant: string) {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);
  fillRect(grid, 0, 0, 128, 90, 1);
  fillRect(grid, 0, 90, 128, 38, 2);
  noiseDither(grid, 0, 90, 128, 38, 1, 0.1, rng);

  uniformedFigure(grid, 68, 40, 4, 3, 8);
  playerBack(grid, 30, 60, 5, 4);
  outlineRect(grid, 44, 74, 40, 14, 3, 8);

  let glow: ReturnType<typeof radialGlow> = [];
  if (variant === "confront") {
    glow = radialGlow(76, 48, 8, "pulse", "#ffb347", mulberry32(seed + 1));
  } else if (variant === "exposed") {
    fillRect(grid, 0, 0, 128, 90, 5);
    glow = radialGlow(76, 30, 12, "pulse", "#ff4d4d", mulberry32(seed + 2));
  } else if (variant === "double") {
    glow = [
      ...radialGlow(30, 68, 6, "sparkle", "#d0e8f0", mulberry32(seed + 3)),
      ...radialGlow(76, 48, 6, "sparkle", "#ffb347", mulberry32(seed + 4)),
    ];
  }

  return buildSpec(128, 128, palette, grid, glow);
}

function stakeoutRooftop128(seed: number, palette: string[], variant: string) {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);
  noiseDither(grid, 0, 0, 128, 70, 2, 0.05, rng);
  const starRng = mulberry32(seed + 1);
  for (let i = 0; i < 10; i++) grid[Math.floor(starRng() * 50)][Math.floor(starRng() * 128)] = 8;
  fillRect(grid, 0, 70, 128, 58, 2);
  noiseDither(grid, 0, 70, 128, 58, 5, 0.12, mulberry32(seed + 2));

  let glow: ReturnType<typeof radialGlow> = [];

  if (variant === "watch") {
    playerBack(grid, 56, 50, 5, 4);
    outlineRect(grid, 20, 90, 88, 20, 3, 5);
    glow = radialGlow(64, 96, 10, "sparkle", "#ff9ecb", mulberry32(seed + 3));
  } else if (variant === "report") {
    playerBack(grid, 56, 50, 5, 4);
    const screenGlow = terminalScreen(grid, 70, 40, 24, 16, 8, 2, "#4dd0ff");
    glow = [...screenGlow, ...radialGlow(82, 48, 6, "pulse", "#4dd0ff", mulberry32(seed + 4))];
  } else if (variant === "undercover") {
    hoodedFigure(grid, 30, 40, 3, 3, 8);
    playerBack(grid, 76, 60, 5, 4);
    glow = radialGlow(40, 50, 8, "flicker", "#ff9ecb", mulberry32(seed + 5));
  } else if (variant === "switch") {
    hoodedFigure(grid, 30, 40, 3, 3, 8);
    playerBack(grid, 76, 60, 5, 4);
    glow = radialGlow(40, 50, 10, "sparkle", "#7fe8ff", mulberry32(seed + 6));
  } else if (variant === "bust") {
    uniformedFigure(grid, 20, 50, 3, 3, 8);
    uniformedFigure(grid, 90, 50, 3, 3, 8);
    crowdSilhouettes(grid, 3, [50, 80], [60, 90], 5, mulberry32(seed + 7));
    glow = radialGlow(64, 60, 10, "pulse", "#4dd0ff", mulberry32(seed + 8));
  }

  return buildSpec(128, 128, palette, grid, glow);
}

function prisonLiaison128(seed: number, palette: string[], variant: string) {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);
  fillRect(grid, 0, 0, 128, 128, 1);
  noiseDither(grid, 0, 0, 128, 128, 2, 0.08, rng);

  let glow: ReturnType<typeof radialGlow> = [];

  if (variant === "liaison") {
    jailBars(grid, 40, 20, 48, 30, 6);
    playerBack(grid, 56, 70, 5, 4);
    glow = radialGlow(64, 34, 8, "flicker", "#6ea888", mulberry32(seed + 1));
  } else if (variant === "reveal") {
    outlineRect(grid, 30, 20, 68, 50, 3, 8);
    const screenGlow = terminalScreen(grid, 38, 28, 52, 34, 8, 2, "#ff4d4d");
    playerBack(grid, 56, 90, 5, 4);
    glow = [...screenGlow, ...radialGlow(64, 45, 12, "pulse", "#ff4d4d", mulberry32(seed + 2))];
  } else if (variant === "whistleblow") {
    fillRect(grid, 0, 0, 128, 70, 7);
    playerBack(grid, 56, 70, 6, 5);
    crowdSilhouettes(grid, 6, [0, 120], [80, 110], 5, mulberry32(seed + 3));
    glow = radialGlow(64, 30, 14, "sparkle", "#c9ffe0", mulberry32(seed + 4));
  } else if (variant === "leverage") {
    playerBack(grid, 56, 60, 7, 5);
    outlineRect(grid, 30, 30, 68, 24, 3, 8);
    glow = radialGlow(64, 42, 10, "pulse", "#ffd700", mulberry32(seed + 5));
  }

  return buildSpec(128, 128, palette, grid, glow);
}

// ---------- image table, one entry per scene id ----------

const images: Record<string, ReturnType<typeof buildSpec>> = {
  // prison track
  fork3_villain_prison_ending: jailScene128(401, jailPalette, "cell"),
  vil_prison_wait: jailScene128(402, jailPalette, "cell-listen"),
  vil_prison_corrupt_guard: jailScene128(403, jailPalette, "corridor"),
  vil_prison_solitary_ending: jailScene128(404, jailPalette, "dark"),
  vil_prison_guard_deal: jailScene128(405, jailPalette, "corridor-deal"),
  vil_prison_rash_ending: jailScene128(406, jailPalette, "dark-rash"),
  vil_prison_juno_plan: jailScene128(407, jailPalette, "wall-tap"),
  vil_prison_rumor_dig: jailScene128(408, jailPalette, "wall-tap-close"),
  vil_prison_isolation_ending: jailScene128(409, jailPalette, "dark"),
  vil_prison_juno_network: jailScene128(410, jailPalette, "wall-tap-network"),
  vil_prison_breakout: ventBreakout128(411, ventPalette, "shaft-entry"),
  vil_prison_recruited_ending: ventBreakout128(412, ventPalette, "shadow-figures"),
  vil_prison_vent_crawl: ventBreakout128(413, ventPalette, "crawl"),
  vil_prison_freedom_ending: ventBreakout128(414, ventPalette, "open-sky"),
  vil_prison_recaptured_ending: jailScene128(415, jailPalette, "corridor-caught"),

  // feared / romskurk track
  fork3_villain_feared_ending: undergroundMarket128(501, marketPalette, "crowd-fear"),
  vil_fear_reputation: undergroundMarket128(502, marketPalette, "nyx-approach"),
  vil_fear_lone_wolf_ending: undergroundMarket128(503, marketPalette, "alone"),
  vil_fear_origin_investigate: mysticFigureScene128(504, mysticPalette, "investigate"),
  vil_fear_ask_figure: mysticFigureScene128(505, mysticPalette, "closeup"),
  vil_fear_figure_silence_ending: mysticFigureScene128(506, mysticPalette, "vanish"),
  vil_fear_undercity: undergroundMarket128(507, marketPalette, "undercity-tunnel"),
  vil_fear_twist_reveal_ending: cosmicLab128(508, cosmicPalette, "reveal"),
  vil_fear_crew_meet: undergroundMarket128(509, marketPalette, "crew-table"),
  vil_fear_heist_plan: heistVault128(510, heistPalette, "planning"),
  vil_fear_heist_lock: heistVault128(511, heistPalette, "lock-console"),
  vil_fear_legend_ending: heistVault128(512, heistPalette, "triumph"),
  vil_fear_heist_showdown: heistVault128(513, heistPalette, "showdown"),
  vil_fear_apex_villain_ending: heistVault128(514, heistPalette, "exposed"),
  vil_fear_walkaway_ending: heistVault128(515, heistPalette, "walkaway"),
  vil_fear_doubt: doubtRedemption128(516, doubtPalette, "hesitate"),
  vil_fear_redemption_attempt: doubtRedemption128(517, doubtPalette, "confront-nyx"),
  vil_fear_redemption_ending: doubtRedemption128(518, doubtPalette, "walk-free"),
  vil_fear_betrayed_ending: doubtRedemption128(519, doubtPalette, "marked"),

  // infiltrator track
  fork3_villain_infiltrator_ending: policePrecinct128(601, policePalette, "briefing"),
  vil_infil_suspicion: policePrecinct128(602, policePalette, "suspicion"),
  vil_infil_archive_dig: policePrecinct128(603, policePalette, "archive"),
  vil_infil_confront_handler: handlerOffice128(604, handlerPalette, "confront"),
  vil_infil_blown_cover_ending: handlerOffice128(605, handlerPalette, "exposed"),
  vil_infil_doubleagent_ending: handlerOffice128(606, handlerPalette, "double"),
  vil_infil_first_mission: policePrecinct128(607, policePalette, "mission-map"),
  vil_infil_stakeout_heist: stakeoutRooftop128(608, stakeoutPalette, "watch"),
  vil_infil_report_ending: stakeoutRooftop128(609, stakeoutPalette, "report"),
  vil_infil_undercover: stakeoutRooftop128(610, stakeoutPalette, "undercover"),
  vil_infil_switch_sides_ending: stakeoutRooftop128(611, stakeoutPalette, "switch"),
  vil_infil_bust_ending: stakeoutRooftop128(612, stakeoutPalette, "bust"),
  vil_infil_prison_liaison: prisonLiaison128(613, liaisonPalette, "liaison"),
  vil_infil_corruption_reveal: prisonLiaison128(614, liaisonPalette, "reveal"),
  vil_infil_whistleblower_ending: prisonLiaison128(615, liaisonPalette, "whistleblow"),
  vil_infil_leverage_ending: prisonLiaison128(616, liaisonPalette, "leverage"),
};

console.log(JSON.stringify(images));
