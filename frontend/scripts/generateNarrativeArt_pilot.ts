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
import type { GlowPixel } from "../src/types/story";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Small procedural "icon" drawers - blocky, built from rects, matching the
// established chunky pixel-art language (no hand-authored pixel grids).
// ---------------------------------------------------------------------------

function drawShipIcon(grid: number[][], x: number, y: number, body: number, trim: number) {
  outlineRect(grid, x, y, 20, 8, body, trim);
  fillRect(grid, x + 6, y - 4, 8, 4, body);
  fillRect(grid, x, y + 8, 20, 2, trim);
}

function drawWrenchIcon(grid: number[][], x: number, y: number, tool: number, trim: number) {
  outlineRect(grid, x, y, 6, 6, tool, trim);
  fillRect(grid, x + 5, y + 5, 10, 3, tool);
  outlineRect(grid, x + 14, y + 7, 6, 6, tool, trim);
}

function drawMopIcon(grid: number[][], x: number, y: number, handle: number, head: number) {
  fillRect(grid, x + 2, y, 2, 20, handle);
  outlineRect(grid, x, y + 18, 6, 6, head, handle);
}

function drawCrownIcon(grid: number[][], x: number, y: number, gold: number, gem: number) {
  fillRect(grid, x, y + 4, 14, 6, gold);
  fillRect(grid, x, y, 2, 6, gold);
  fillRect(grid, x + 6, y, 2, 6, gold);
  fillRect(grid, x + 12, y, 2, 6, gold);
  fillRect(grid, x + 5, y + 6, 4, 2, gem);
}

function drawCadetRow(grid: number[][], xs: number[], y: number, color: number) {
  xs.forEach((x) => fillRect(grid, x, y, 6, 12, color));
}

function drawKeypad(grid: number[][], x: number, y: number, body: number, screen: number, trim: number) {
  outlineRect(grid, x, y, 24, 20, body, trim);
  fillRect(grid, x + 3, y + 3, 18, 8, screen);
  const keyRng = mulberry32(x * 7 + y * 3);
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      fillRect(grid, x + 3 + c * 5, y + 13 + r * 3, 3, 2, keyRng() > 0.5 ? trim : screen);
    }
  }
}

function drawPipes(grid: number[][], baseY: number, colorMain: number, colorTrim: number, rng: () => number) {
  for (let x = 0; x < 128; x += 10) {
    const h = 10 + Math.floor(rng() * 14);
    fillRect(grid, x, baseY - h, 5, h, colorMain);
    fillRect(grid, x, baseY - h, 5, 1, colorTrim);
  }
}

function starsBackdrop(grid: number[][], colorIdx: number, count: number, maxY: number, seed: number) {
  const rng = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rng() * 128);
    const y = Math.floor(rng() * maxY);
    grid[y][x] = colorIdx;
  }
}

// ---------------------------------------------------------------------------
// Reusable scene templates. Each returns a full PixelArtSpec. Palette and
// seed vary per call so every scene reads as its own image while the style
// (outlined shapes, noise dither, radial glow) stays consistent with
// generateNarrativeArtV5_128.ts.
// ---------------------------------------------------------------------------

function simRoomTemplate(seed: number, palette: string[], starCount = 10) {
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(seed);
  fillRect(grid, 0, 0, 128, 70, 0);
  starsBackdrop(grid, 4, starCount, 40, seed + 1);
  outlineRect(grid, 20, 40, 88, 30, 2, 3); // big viewport/console band
  noiseDither(grid, 20, 40, 88, 30, 3, 0.12, rng);
  fillRect(grid, 0, 70, 128, 58, 1); // simulator floor
  noiseDither(grid, 0, 70, 128, 58, 2, 0.15, mulberry32(seed + 2));
  fillRect(grid, 0, 70, 128, 2, 5);
  outlineRect(grid, 52, 86, 24, 30, 2, 5); // pilot seat
  drawKeypad(grid, 8, 92, 2, 6, 5);
  drawKeypad(grid, 96, 92, 2, 6, 5);
  const glow: GlowPixel[] = [
    ...radialGlow(64, 55, 12, "pulse", palette[5] ?? "#8fd9ff", mulberry32(seed + 3)),
    { x: 20, y: 96, animation: "flicker", color: palette[5] ?? "#8fd9ff" },
    { x: 112, y: 96, animation: "flicker", color: palette[5] ?? "#8fd9ff" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

function keypadCloseupTemplate(seed: number, palette: string[]) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 0);
  noiseDither(grid, 0, 0, 128, 128, 2, 0.05, mulberry32(seed));
  outlineRect(grid, 14, 20, 100, 88, 1, 3);
  outlineRect(grid, 26, 32, 76, 30, 6, 3); // big screen
  const rng = mulberry32(seed + 1);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      outlineRect(grid, 26 + c * 15, 70 + r * 15, 12, 12, rng() > 0.6 ? 5 : 2, 3);
    }
  }
  const glow: GlowPixel[] = [
    ...radialGlow(64, 47, 10, "pulse", palette[6] ?? "#ffd27f", mulberry32(seed + 2)),
    { x: 20, y: 24, animation: "flicker", color: palette[6] ?? "#ffd27f" },
    { x: 108, y: 24, animation: "flicker", color: palette[6] ?? "#ffd27f" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

function cockpitFlightTemplate(seed: number, palette: string[], alarmActive: boolean) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 84, 0);
  starsBackdrop(grid, 4, 24, 70, seed);
  outlineRect(grid, 8, 8, 112, 64, 2, 3); // cockpit window frame
  // distant ships/rocks passing by
  const rng = mulberry32(seed + 4);
  for (let i = 0; i < 3; i++) {
    const x = 20 + Math.floor(rng() * 88);
    const y = 20 + Math.floor(rng() * 40);
    outlineRect(grid, x, y, 10, 5, 3, 5);
  }
  fillRect(grid, 0, 84, 128, 44, 1); // dashboard
  noiseDither(grid, 0, 84, 128, 44, 2, 0.14, mulberry32(seed + 5));
  fillRect(grid, 0, 84, 128, 2, alarmActive ? 8 : 5);
  drawKeypad(grid, 30, 92, 2, alarmActive ? 8 : 6, 5);
  drawKeypad(grid, 74, 92, 2, alarmActive ? 8 : 6, 5);
  const glow: GlowPixel[] = alarmActive
    ? [
        ...radialGlow(64, 30, 16, "pulse", "#ff4d4d", mulberry32(seed + 6)),
        { x: 20, y: 12, animation: "pulse", color: "#ff4d4d" },
        { x: 108, y: 12, animation: "pulse", color: "#ff4d4d" },
      ]
    : [
        ...radialGlow(64, 30, 10, "sparkle", palette[5] ?? "#8fd9ff", mulberry32(seed + 6)),
        { x: 20, y: 12, animation: "flicker", color: palette[5] ?? "#8fd9ff" },
      ];
  return buildSpec(128, 128, palette, grid, glow);
}

function wormholeTemplate(seed: number, palette: string[]) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 0);
  starsBackdrop(grid, 4, 14, 30, seed);
  const rng = mulberry32(seed + 1);
  for (let ring = 0; ring < 7; ring++) {
    const r = 10 + ring * 8;
    const col = ring % 2 === 0 ? 2 : 3;
    for (let a = 0; a < 360; a += 6) {
      const rad = (a * Math.PI) / 180;
      const x = 64 + Math.round(Math.cos(rad) * r * (0.6 + rng() * 0.05));
      const y = 64 + Math.round(Math.sin(rad) * r);
      if (x >= 0 && x < 128 && y >= 0 && y < 128) grid[y][x] = col;
    }
  }
  playerBack(grid, 60, 96, 5, 3);
  const glow: GlowPixel[] = [
    ...radialGlow(64, 64, 20, "pulse", palette[5] ?? "#c9a6ff", mulberry32(seed + 2)),
    ...radialGlow(64, 64, 10, "sparkle", palette[6] ?? "#ffffff", mulberry32(seed + 3)),
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

function twistSpaceTemplate(seed: number, palette: string[]) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 0);
  starsBackdrop(grid, 4, 40, 128, seed);
  starsBackdrop(grid, 5, 14, 128, seed + 1);
  playerBack(grid, 60, 90, 6, 4);
  const glow: GlowPixel[] = [
    ...radialGlow(70, 40, 14, "sparkle", palette[6] ?? "#8fd9ff", mulberry32(seed + 2)),
    { x: 30, y: 20, animation: "sparkle", color: palette[6] ?? "#8fd9ff" },
    { x: 100, y: 70, animation: "sparkle", color: palette[6] ?? "#8fd9ff" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

function engineRoomTemplate(seed: number, palette: string[]) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 1);
  noiseDither(grid, 0, 0, 128, 128, 2, 0.06, mulberry32(seed));
  drawPipes(grid, 128, 3, 5, mulberry32(seed + 1));
  outlineRect(grid, 40, 20, 48, 40, 2, 5); // engine core casing
  fillRect(grid, 54, 30, 20, 20, 6);
  const rng = mulberry32(seed + 2);
  for (let i = 0; i < 4; i++) {
    outlineRect(grid, 10 + Math.floor(rng() * 100), 90 + Math.floor(rng() * 20), 8, 8, 4, 5);
  }
  const glow: GlowPixel[] = [
    ...radialGlow(64, 40, 12, "pulse", palette[6] ?? "#ffd27f", mulberry32(seed + 3)),
    { x: 20, y: 100, animation: "flicker", color: palette[6] ?? "#ffd27f" },
    { x: 108, y: 100, animation: "flicker", color: palette[6] ?? "#ffd27f" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

function mekAftermathTemplate(seed: number, palette: string[]) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 1);
  noiseDither(grid, 0, 0, 128, 128, 2, 0.05, mulberry32(seed));
  drawPipes(grid, 60, 3, 5, mulberry32(seed + 1));
  fillRect(grid, 0, 60, 128, 68, 2);
  noiseDither(grid, 0, 60, 128, 68, 1, 0.12, mulberry32(seed + 2));
  drawWrenchIcon(grid, 50, 76, 6, 5);
  playerBack(grid, 60, 96, 5, 4);
  const glow: GlowPixel[] = [
    ...radialGlow(64, 40, 8, "flicker", palette[6] ?? "#ffd27f", mulberry32(seed + 3)),
    { x: 30, y: 90, animation: "sparkle", color: palette[6] ?? "#ffd27f" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

function vaskHangarTemplate(seed: number, palette: string[]) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 84, 1); // wall
  fillRect(grid, 0, 84, 128, 44, 2); // floor
  noiseDither(grid, 0, 84, 128, 44, 1, 0.16, mulberry32(seed));
  fillRect(grid, 0, 84, 128, 2, 5);
  const rng = mulberry32(seed + 1);
  [10, 34, 90, 110].forEach((x) => {
    outlineRect(grid, x, 40 + Math.floor(rng() * 10), 16, 40, 3, 4); // stacked crates/hulls
  });
  drawMopIcon(grid, 58, 88, 4, 3);
  outlineRect(grid, 66, 100, 12, 12, 4, 5); // bucket
  const glow: GlowPixel[] = [
    ...radialGlow(20, 30, 8, "flicker", palette[6] ?? "#ffd27f", mulberry32(seed + 2)),
    { x: 108, y: 30, animation: "flicker", color: palette[6] ?? "#ffd27f" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

function vaskTunnelTemplate(seed: number, palette: string[]) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 0);
  noiseDither(grid, 0, 0, 128, 128, 1, 0.08, mulberry32(seed));
  // tunnel perspective rings, narrowing toward center
  for (let i = 0; i < 5; i++) {
    const inset = i * 12;
    outlineRect(grid, inset, inset, 128 - inset * 2, 128 - inset * 2, -1, i % 2 === 0 ? 2 : 3);
  }
  playerBack(grid, 58, 90, 6, 4);
  const glow: GlowPixel[] = [...radialGlow(64, 20, 10, "flicker", palette[6] ?? "#ffd27f", mulberry32(seed + 1))];
  return buildSpec(128, 128, palette, grid, glow);
}

function vaskSmugglerDenTemplate(seed: number, palette: string[]) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 0);
  noiseDither(grid, 0, 0, 128, 128, 1, 0.06, mulberry32(seed));
  const rng = mulberry32(seed + 1);
  [8, 40, 72, 100].forEach((x) => {
    outlineRect(grid, x, 70 + Math.floor(rng() * 20), 20, 26, 3, 5);
  });
  hoodedFigure(grid, 40, 40, 5, 3, 2);
  hoodedFigure(grid, 76, 44, 5, 3, 2);
  const glow: GlowPixel[] = [
    ...radialGlow(64, 90, 10, "flicker", palette[6] ?? "#ffd27f", mulberry32(seed + 2)),
    { x: 50, y: 48, animation: "pulse", color: palette[7] ?? "#ff4d4d" },
    { x: 84, y: 52, animation: "pulse", color: palette[7] ?? "#ff4d4d" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

function vaskDreamForestTemplate(seed: number, palette: string[]) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 100, 128, 28, 3);
  noiseDither(grid, 0, 100, 128, 28, 4, 0.25, mulberry32(seed));
  fillRect(grid, 0, 100, 128, 2, 7);
  const rng = mulberry32(seed + 1);
  [4, 20, 100, 116].forEach((x) => {
    const h = 30 + Math.floor(rng() * 26);
    fillRect(grid, x, 100 - h, 10, h, 2);
    fillRect(grid, x + 2, 100 - h + 4, 6, h - 8, 1);
  });
  hoodedFigure(grid, 48, 30, 6, 4, 2);
  fillRect(grid, 55, 42, 2, 2, 2);
  fillRect(grid, 61, 42, 2, 2, 2);
  outlineRect(grid, 54, 88, 20, 8, 5, 7); // bonfire mound, echoing the very first scene
  const glow: GlowPixel[] = [
    ...radialGlow(64, 86, 14, "flicker", "#ffb347", mulberry32(seed + 2)),
    { x: 56, y: 42, animation: "pulse", color: "#c9a6ff" },
    { x: 62, y: 42, animation: "pulse", color: "#c9a6ff" },
    { x: 16, y: 70, animation: "sparkle", color: palette[6] ?? "#6fd8c9" },
    { x: 112, y: 62, animation: "sparkle", color: palette[6] ?? "#6fd8c9" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

function crisisAlarmHangarTemplate(seed: number, palette: string[]) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 80, 1);
  fillRect(grid, 0, 80, 128, 48, 2);
  noiseDither(grid, 0, 80, 128, 48, 1, 0.14, mulberry32(seed));
  fillRect(grid, 0, 80, 128, 2, 5);
  const rng = mulberry32(seed + 1);
  [4, 24, 88, 108].forEach((x) => {
    outlineRect(grid, x, 28, 16, 28, 3, 4);
  });
  // scattered running cadets
  [16, 36, 60, 92, 112].forEach((x) => {
    fillRect(grid, x, 100 + Math.floor(rng() * 8), 6, 12, 8);
  });
  const glow: GlowPixel[] = [
    ...radialGlow(64, 20, 20, "pulse", "#ff4d4d", mulberry32(seed + 2)),
    { x: 10, y: 16, animation: "pulse", color: "#ff4d4d" },
    { x: 118, y: 16, animation: "pulse", color: "#ff4d4d" },
    { x: 64, y: 90, animation: "flicker", color: "#ff4d4d" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

function crisisEvacCorridorTemplate(seed: number, palette: string[]) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 1);
  noiseDither(grid, 0, 0, 128, 128, 2, 0.08, mulberry32(seed));
  outlineRect(grid, 10, 10, 108, 108, -1, 3);
  const rng = mulberry32(seed + 1);
  drawCadetRow(grid, [20, 40, 60, 80, 100].map((x) => x + Math.floor(rng() * 4)), 90, 8);
  outlineRect(grid, 0, 40, 16, 40, 5, 4); // exit door glowing
  const glow: GlowPixel[] = [
    ...radialGlow(8, 60, 10, "pulse", "#8fd9ff", mulberry32(seed + 2)),
    { x: 64, y: 20, animation: "pulse", color: "#ff4d4d" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

function crisisOfficerCloseTemplate(seed: number, palette: string[]) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 6);
  noiseDither(grid, 0, 0, 128, 128, 5, 0.1, mulberry32(seed));
  fillRect(grid, 44, 10, 40, 12, 7); // hat brim
  fillRect(grid, 50, 0, 28, 12, 7); // hat crown
  fillRect(grid, 44, 24, 40, 30, 6); // head/shoulders
  fillRect(grid, 36, 54, 56, 60, 6); // coat
  fillRect(grid, 36, 54, 56, 4, 8); // collar highlight
  const glow: GlowPixel[] = [
    ...radialGlow(64, 20, 14, "pulse", "#ff4d4d", mulberry32(seed + 1)),
    { x: 56, y: 38, animation: "pulse", color: palette[6] ?? "#8fd9ff" },
    { x: 72, y: 38, animation: "pulse", color: palette[6] ?? "#8fd9ff" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

type Figure = "ship" | "wrench" | "mop" | "crown" | "cadets";

function drawFigure(grid: number[][], figure: Figure, body: number, trim: number) {
  switch (figure) {
    case "ship":
      drawShipIcon(grid, 54, 58, body, trim);
      break;
    case "wrench":
      drawWrenchIcon(grid, 54, 54, body, trim);
      break;
    case "mop":
      drawMopIcon(grid, 60, 50, body, trim);
      break;
    case "crown":
      drawCrownIcon(grid, 57, 56, body, trim);
      break;
    case "cadets":
      drawCadetRow(grid, [50, 62, 74], 56, body);
      break;
  }
}

function endingGlowTemplate(seed: number, palette: string[], figure: Figure) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 0);
  starsBackdrop(grid, 4, 30, 128, seed);
  fillRect(grid, 0, 96, 128, 32, 1);
  noiseDither(grid, 0, 96, 128, 32, 2, 0.14, mulberry32(seed + 1));
  drawFigure(grid, figure, 5, 6);
  playerBack(grid, 58, 100, 5, 4);
  const glow: GlowPixel[] = [
    ...radialGlow(64, 60, 22, "pulse", palette[6] ?? "#8fd9ff", mulberry32(seed + 2)),
    ...radialGlow(64, 60, 10, "sparkle", palette[7] ?? "#ffffff", mulberry32(seed + 3)),
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

function endingGreyTemplate(seed: number, palette: string[], figure: Figure) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 1);
  noiseDither(grid, 0, 0, 128, 128, 2, 0.1, mulberry32(seed));
  fillRect(grid, 0, 90, 128, 38, 2);
  drawFigure(grid, figure, 5, 3);
  playerBack(grid, 58, 96, 5, 3);
  const glow: GlowPixel[] = [{ x: 20, y: 20, animation: "flicker", color: palette[5] ?? "#5a6b8c" }];
  return buildSpec(128, 128, palette, grid, glow);
}

function endingNeutralTemplate(seed: number, palette: string[], figure: Figure) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 90, 1);
  fillRect(grid, 0, 90, 128, 38, 2);
  noiseDither(grid, 0, 0, 128, 128, 3, 0.08, mulberry32(seed));
  drawFigure(grid, figure, 4, 5);
  const glow: GlowPixel[] = [
    { x: 30, y: 30, animation: "flicker", color: palette[6] ?? "#c9d6f0" },
    { x: 98, y: 30, animation: "flicker", color: palette[6] ?? "#c9d6f0" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

function endingTwistTemplate(seed: number, palette: string[], figure: Figure) {
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 0);
  starsBackdrop(grid, 4, 24, 128, seed);
  drawFigure(grid, figure, 3, 6);
  const rng = mulberry32(seed + 1);
  for (let i = 0; i < 30; i++) {
    const x = Math.floor(rng() * 128);
    const y = Math.floor(rng() * 128);
    if (grid[y][x] === 0 && rng() > 0.6) grid[y][x] = 2;
  }
  const glow: GlowPixel[] = [
    ...radialGlow(64, 64, 16, "sparkle", palette[6] ?? "#c9a6ff", mulberry32(seed + 2)),
    ...radialGlow(64, 64, 8, "pulse", palette[7] ?? "#ff9ecb", mulberry32(seed + 3)),
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// ---------------------------------------------------------------------------
// Palettes - one small family per setting, reused with variations.
// ---------------------------------------------------------------------------

const P = {
  simRoom: ["#0a0e1a", "#232a3d", "#141826", "#5a6b8c", "#c9d6f0", "#8fd9ff", "#05070d", "#ffd27f", "#3a4a6b"],
  simRoomWarm: ["#0a0e1a", "#2a2333", "#141826", "#8c5a6b", "#f0c9d6", "#ff9ecb", "#05070d", "#ffd27f", "#6b3a4a"],
  cockpitCalm: ["#050912", "#182238", "#0b0f1a", "#4a6b8c", "#d6e6ff", "#8fd9ff", "#02040a", "#ffe0a0", "#2a3a5a"],
  cockpitAlarm: ["#0d0507", "#3a1414", "#1a0808", "#8c4a4a", "#ffd6d6", "#ff4d4d", "#0a0202", "#ffa07f", "#5a1a1a"],
  wormhole: ["#0a0316", "#241355", "#160a30", "#5a2fa0", "#c9a6ff", "#7fe8ff", "#04010a", "#ffffff", "#3a1a66"],
  twistSpace: ["#020817", "#0f1f3a", "#050c1a", "#3a5a8c", "#bfe0ff", "#8fd9ff", "#010410", "#e8f0ff", "#22406b"],
  engine: ["#0f0b06", "#3a2a14", "#1a1208", "#8c6a2a", "#e8c078", "#ffd27f", "#080502", "#ff9d42", "#5a4018"],
  engineAftermath: ["#0f0b06", "#2a3a2a", "#1a1208", "#6a8c6a", "#c0e8c0", "#ffd27f", "#080502", "#7fe0a0", "#3a5a3a"],
  vaskHangar: ["#0a0e1a", "#2a3a4a", "#141826", "#5a7a8c", "#c9e0e6", "#ffd27f", "#05070d", "#8fd9ff", "#3a5a6b"],
  vaskTunnel: ["#050505", "#1a1a2a", "#0a0a12", "#3a3a5a", "#8a8ab0", "#ffd27f", "#020208", "#c9c9e0", "#2a2a4a"],
  vaskSmuggler: ["#0c0810", "#3a2350", "#160f22", "#7a4fa0", "#d8c6ff", "#ffd27f", "#06040a", "#ff4d4d", "#4a2f66"],
  vaskDream: ["#020103", "#0d0912", "#171224", "#6a4a1c", "#3a1c08", "#c9a6ff", "#0a0710", "#241a10", "#ffdca0"],
  crisis: ["#0a0e1a", "#3a1414", "#141826", "#8c4a4a", "#ffd6d6", "#ff4d4d", "#05070d", "#ffb347", "#5a1a1a"],
  evac: ["#0a0e1a", "#232a3d", "#141826", "#5a6b8c", "#c9d6f0", "#8fd9ff", "#05070d", "#ff4d4d", "#3a4a6b"],
  officer: ["#0a0e1a", "#232a3d", "#141826", "#c9a6a6", "#e8d6d6", "#7fd9c9", "#05070d", "#8fd9ff", "#6b3a3a"],
  goodPilot: ["#020817", "#0f1f3a", "#050c1a", "#3a5a8c", "#bfe0ff", "#8fd9ff", "#010410", "#ffffff", "#22406b"],
  goodMek: ["#0f0b06", "#2a3a2a", "#1a1208", "#6a8c6a", "#c0e8c0", "#ffd27f", "#080502", "#7fe0a0", "#3a5a3a"],
  goodVask: ["#0a0e1a", "#2a3a4a", "#141826", "#5a7a8c", "#c9e0e6", "#ffd27f", "#05070d", "#8fd9ff", "#3a5a6b"],
  badPilot: ["#0d0507", "#2a2a2a", "#1a0808", "#5a5a5a", "#a0a0a0", "#8c4a4a", "#0a0202", "#6a6a6a", "#3a3a3a"],
  badMek: ["#0f0b06", "#2a2a24", "#1a1208", "#6a6a5a", "#c0c0a8", "#8c6a2a", "#080502", "#9a9a80", "#4a4a3a"],
  neutralVask: ["#0a0e1a", "#2a3a4a", "#141826", "#5a7a8c", "#c9d6d6", "#8f8fa8", "#05070d", "#8fd9ff", "#3a5a6b"],
  twistPilot: ["#0a0316", "#241355", "#160a30", "#5a2fa0", "#c9a6ff", "#7fe8ff", "#04010a", "#ff9ecb", "#3a1a66"],
  twistMek: ["#0f0b06", "#241355", "#1a1208", "#5a2fa0", "#e8c078", "#c9a6ff", "#080502", "#ffd27f", "#4a2f66"],
  twistVask: ["#12081c", "#6a3fa0", "#3a1f66", "#d8d8e8", "#7fe8ff", "#9a6fd0", "#241433", "#ff9ecb", "#1c1030"],
};

const images: Record<string, ReturnType<typeof buildSpec>> = {};

// --- reused entry scenes (now choice scenes) ---
images["fork3_pilot_ending"] = simRoomTemplate(210, P.simRoom);
images["fork3_mechanic_ending"] = engineRoomTemplate(220, P.engine);
images["fork3_cleaner_ending"] = vaskHangarTemplate(230, P.vaskHangar);

// --- pilot sub-track ---
images["pil_cadet_meet"] = crisisEvacCorridorTemplate(211, P.simRoom);
images["pil_sim_intro"] = simRoomTemplate(212, P.simRoomWarm, 14);
images["pil_sim_test"] = keypadCloseupTemplate(213, P.simRoom);
images["pil_first_flight"] = cockpitFlightTemplate(214, P.cockpitCalm, false);
images["pil_anomaly_detour"] = cockpitFlightTemplate(215, P.cockpitCalm, false);
images["pil_anomaly_wormhole"] = wormholeTemplate(216, P.wormhole);
images["pil_anomaly_fight_ending"] = endingTwistTemplate(217, P.twistSpace, "ship");
images["pil_anomaly_surrender_ending"] = twistSpaceTemplate(218, P.twistSpace);

// --- mechanic sub-track ---
images["pil_mek_mentor"] = engineRoomTemplate(221, P.engine);
images["pil_mek_toolbelt"] = engineRoomTemplate(222, P.engine);
images["pil_mek_report"] = crisisOfficerCloseTemplate(223, P.officer);
images["pil_mek_investigate"] = engineRoomTemplate(224, P.engineAftermath);
images["pil_mek_disarm_solo"] = keypadCloseupTemplate(225, P.engine);
images["pil_mek_defused"] = mekAftermathTemplate(226, P.engineAftermath);
images["pil_mek_aftermath"] = mekAftermathTemplate(227, P.engine);

// --- cleaner sub-track ---
images["pil_vask_hangar3"] = vaskHangarTemplate(231, P.vaskHangar);
images["pil_vask_dutiful"] = vaskHangarTemplate(232, P.vaskHangar);
images["pil_vask_quiet_ending"] = endingGlowTemplate(233, P.goodVask, "mop");
images["pil_vask_dream"] = vaskDreamForestTemplate(234, P.vaskDream);
images["pil_vask_dream_twist_ending"] = vaskDreamForestTemplate(235, P.vaskDream);
images["pil_vask_dream_wake_ending"] = endingTwistTemplate(236, P.twistVask, "mop");
images["pil_vask_passage"] = vaskTunnelTemplate(237, P.vaskTunnel);
images["pil_vask_tunnel"] = vaskTunnelTemplate(238, P.vaskTunnel);
images["pil_vask_retreat_ending"] = endingNeutralTemplate(239, P.neutralVask, "mop");
images["pil_vask_smugglers"] = vaskSmugglerDenTemplate(240, P.vaskSmuggler);
images["pil_vask_confront"] = vaskSmugglerDenTemplate(241, P.vaskSmuggler);
images["pil_vask_captured_ending"] = endingGreyTemplate(242, P.badPilot, "mop");

// --- shared crisis convergence ---
images["pil_crisis_alarm"] = crisisAlarmHangarTemplate(250, P.crisis);
images["pil_crisis_evac"] = crisisEvacCorridorTemplate(251, P.evac);
images["pil_crisis_evac_ending"] = endingGlowTemplate(252, P.goodVask, "cadets");
images["pil_crisis_conversation"] = crisisOfficerCloseTemplate(253, P.officer);
images["pil_crisis_hero"] = crisisAlarmHangarTemplate(254, P.crisis);
images["pil_crisis_failure"] = crisisAlarmHangarTemplate(255, P.crisis);
images["pil_crisis_twist"] = crisisAlarmHangarTemplate(256, P.crisis);

// --- differentiated final endings ---
images["pil_pilot_hero_ending"] = endingGlowTemplate(260, P.goodPilot, "ship");
images["pil_mek_hero_ending"] = endingGlowTemplate(261, P.goodMek, "wrench");
images["pil_vask_hero_ending"] = endingGlowTemplate(262, P.goodVask, "mop");
images["pil_pilot_grounded_ending"] = endingGreyTemplate(263, P.badPilot, "ship");
images["pil_mek_blamed_ending"] = endingGreyTemplate(264, P.badMek, "wrench");
images["pil_vask_forgotten_ending"] = endingNeutralTemplate(265, P.neutralVask, "mop");
images["pil_pilot_simulation_ending"] = endingTwistTemplate(266, P.twistPilot, "ship");
images["pil_mek_conspiracy_ending"] = endingTwistTemplate(267, P.twistMek, "wrench");
images["pil_vask_royalty_ending"] = endingTwistTemplate(268, P.twistVask, "crown");

console.log(JSON.stringify(images));
