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

type Grid = number[][];

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Standard hell-world palette, reused for continuity with fork1_scene1's lavaTwistWorld128:
// 0 outline/black, 1 sky-back, 2 sky-front, 3 lava floor, 4 bright vein/rim,
// 5 deep black, 6 dark accent, 7 smoke/stone, 8 ember red accent (used for direct fills, not just glow)
const HELL_PALETTE = ["#070403", "#241210", "#3a1f16", "#5c1a0a", "#8a2a0a", "#040202", "#170d10", "#3a2f2a", "#ff2d2d"];

/** Shared lava-world backdrop: gradient sky bands, glowing floor with veins, smoke haze. */
function lavaBase(grid: Grid, seed: number) {
  const rng = mulberry32(seed);
  for (let x = 0; x < 128; x++) {
    const back = 24 + Math.floor(rng() * 28);
    fillRect(grid, x, 0, 1, back, 1);
  }
  const rng2 = mulberry32(seed + 1);
  for (let x = 0; x < 128; x++) {
    const front = Math.max(0, 12 + Math.floor(rng2() * 20));
    fillRect(grid, x, 0, 1, front, 2);
  }
  fillRect(grid, 0, 96, 128, 32, 3); // lava floor
  noiseDither(grid, 0, 96, 128, 32, 4, 0.22, mulberry32(seed + 2));
  fillRect(grid, 0, 96, 128, 2, 4); // bright rim
  [
    [8, 100, 36],
    [44, 110, 28],
    [80, 102, 40],
    [112, 116, 12],
  ].forEach(([x, y, w]) => fillRect(grid, x, y, w, 2, 4));
  noiseDither(grid, 0, 56, 128, 40, 7, 0.09, mulberry32(seed + 3));
}

/** A jagged crack of light/color running diagonally through a rect, useful for rifts and fissures. */
function jaggedCrack(grid: Grid, x0: number, y0: number, x1: number, y1: number, colorIndex: number, width: number, rng: () => number) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const wob = Math.round((rng() - 0.5) * 3);
    const x = Math.round(x0 + (x1 - x0) * t) + wob;
    const y = Math.round(y0 + (y1 - y0) * t);
    fillRect(grid, x, y, width, width, colorIndex);
  }
}

// --- fork1_scene2: the devil delighted, revealing the proving-ground ---
function arenaReveal128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 501);
  hoodedFigure(grid, 46, 30, 6, 4.4, 2);
  // arm flung wide toward the flame-sea (an extra silhouette limb)
  fillRect(grid, 78, 56, 20, 3, 6);
  fillRect(grid, 96, 52, 4, 6, 6);
  playerBack(grid, 30, 96, 5, 4);
  const grin = [58, 60, 62, 64, 66, 68].map((x, i) => ({
    x,
    y: 50 - Math.abs(i - 2.5) * 1.2,
    animation: "pulse" as const,
    color: "#ff2d2d",
  }));
  const glow = [
    ...radialGlow(24, 108, 10, "pulse", "#ff5a2a", mulberry32(502)),
    ...radialGlow(100, 112, 10, "flicker", "#ff7a1f", mulberry32(503)),
    ...grin,
    { x: 56, y: 44, animation: "pulse" as const, color: "#c9a6ff" },
    { x: 62, y: 44, animation: "pulse" as const, color: "#c9a6ff" },
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_pact_intro, hel_pact_price: devil offering a clawed hand, a deal ---
function pactOath128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 511);
  hoodedFigure(grid, 66, 28, 6, 4.2, 2);
  // outstretched clawed hand toward the viewer
  fillRect(grid, 40, 58, 22, 4, 6);
  fillRect(grid, 38, 56, 3, 8, 8);
  fillRect(grid, 42, 54, 3, 10, 8);
  fillRect(grid, 46, 55, 3, 9, 8);
  const glow = [
    ...radialGlow(20, 104, 8, "flicker", "#ff7a1f", mulberry32(512)),
    ...radialGlow(112, 96, 8, "pulse", "#ff5a2a", mulberry32(513)),
    { x: 73, y: 44, animation: "pulse" as const, color: "#c9a6ff" },
    { x: 79, y: 44, animation: "pulse" as const, color: "#c9a6ff" },
    { x: 39, y: 58, animation: "sparkle" as const, color: "#ffb347" },
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_pact_decline_end: the fire dims, the figure turns away ---
function pactDeclineEnd128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 521);
  noiseDither(grid, 0, 96, 128, 32, 5, 0.35, mulberry32(522)); // ash dulling the floor
  hoodedFigure(grid, 70, 34, 6, 3.4, undefined); // no edge highlight: figure is turning away, dimmer
  fillRect(grid, 66, 40, 4, 20, 5); // shadowed side
  const glow = [...radialGlow(30, 108, 5, "flicker", "#8a2a0a", mulberry32(523))];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_pact_trial1: the riddle of the shadow that does not match its owner ---
function obsidianRiddle128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 531);
  hoodedFigure(grid, 40, 30, 6, 4, 2);
  // a second, mismatched shadow silhouette cast away at an odd angle
  fillRect(grid, 78, 60, 4, 2, 5);
  fillRect(grid, 80, 58, 4, 2, 5);
  fillRect(grid, 82, 54, 4, 2, 5);
  fillRect(grid, 84, 48, 4, 2, 5);
  fillRect(grid, 86, 42, 5, 3, 5);
  fillRect(grid, 90, 36, 5, 3, 5);
  const glow = [
    ...radialGlow(96, 100, 8, "pulse", "#ff5a2a", mulberry32(532)),
    { x: 92, y: 37, animation: "sparkle" as const, color: "#c9a6ff" },
    { x: 49, y: 46, animation: "pulse" as const, color: "#c9a6ff" },
    { x: 55, y: 46, animation: "pulse" as const, color: "#c9a6ff" },
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_pact_trial2, hel_pact_hesitate: a crowned dark self, shown in the flames ---
function trialVision128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 541);
  // the vision, framed in the fire: a small crowned silhouette
  outlineRect(grid, 50, 60, 28, 30, 5, 4);
  fillRect(grid, 58, 76, 12, 14, 6); // body
  fillRect(grid, 60, 68, 8, 8, 6); // head
  fillRect(grid, 58, 64, 12, 4, 8); // crown, ember-bright
  fillRect(grid, 60, 62, 2, 3, 8);
  fillRect(grid, 66, 62, 2, 3, 8);
  const glow = [
    ...radialGlow(64, 90, 10, "flicker", "#ff2d2d", mulberry32(542)),
    { x: 62, y: 72, animation: "pulse" as const, color: "#ffdca0" },
    { x: 66, y: 72, animation: "pulse" as const, color: "#ffdca0" },
    ...radialGlow(20, 108, 6, "pulse", "#ff5a2a", mulberry32(543)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_pact_regret_end: walking away, the image fading ---
function regretEnd128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 551);
  playerBack(grid, 60, 70, 5, 3.4);
  noiseDither(grid, 40, 60, 48, 40, 7, 0.18, mulberry32(552)); // haze swallowing the path
  const glow = [...radialGlow(96, 106, 6, "flicker", "#ff7a1f", mulberry32(553))];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_pact_trial3: forked ground, glowing name vs. a trapped face in stone ---
function trial3Crossroads128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 561);
  // left path: a name-shaped ember cluster
  fillRect(grid, 20, 92, 4, 6, 8);
  fillRect(grid, 26, 90, 4, 8, 8);
  fillRect(grid, 32, 92, 4, 6, 8);
  // right path: a fissure with a stone face
  outlineRect(grid, 84, 86, 24, 20, 7, 5);
  fillRect(grid, 90, 92, 3, 3, 0);
  fillRect(grid, 99, 92, 3, 3, 0);
  fillRect(grid, 92, 98, 8, 2, 5);
  hoodedFigure(grid, 56, 20, 6, 3.2, 2);
  const glow = [
    { x: 22, y: 94, animation: "pulse" as const, color: "#ff2d2d" },
    { x: 28, y: 92, animation: "pulse" as const, color: "#ff2d2d" },
    { x: 34, y: 94, animation: "pulse" as const, color: "#ff2d2d" },
    { x: 91, y: 93, animation: "sparkle" as const, color: "#c9a6ff" },
    { x: 100, y: 93, animation: "sparkle" as const, color: "#c9a6ff" },
    ...radialGlow(64, 100, 6, "flicker", "#ff7a1f", mulberry32(562)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_pact_heir_end: the player is now the hooded figure ---
function heirEnd128() {
  const grid = createGrid(128, 128, 0);
  const palette = ["#020103", "#0d0912", "#171224", "#0f0b09", "#160f0b", "#3a1c08", "#0a0710", "#241a10", "#ffdca0"];
  const rng = mulberry32(571);
  // reprise of the dark-forest framing, but now the player's own silhouette waits by the fire
  for (let x = 0; x < 128; x++) {
    const back = 40 + Math.floor(rng() * 20);
    fillRect(grid, x, 104 - back, 1, back, 2);
  }
  fillRect(grid, 0, 104, 128, 24, 3);
  noiseDither(grid, 0, 104, 128, 24, 4, 0.28, mulberry32(572));
  fillRect(grid, 0, 104, 128, 2, 7);
  hoodedFigure(grid, 48, 34, 6, 4, 2);
  fillRect(grid, 55, 46, 2, 2, 8); // eyes now ember-red, not violet
  fillRect(grid, 61, 46, 2, 2, 8);
  outlineRect(grid, 54, 92, 20, 8, 5, 7);
  const glow = [
    ...radialGlow(64, 90, 14, "flicker", "#ffb347", mulberry32(573)),
    { x: 56, y: 46, animation: "pulse" as const, color: "#ff2d2d" },
    { x: 62, y: 46, animation: "pulse" as const, color: "#ff2d2d" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- hel_pact_mercy: a face trapped in the stone ---
function mercyCage128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 581);
  outlineRect(grid, 40, 56, 48, 44, 7, 5);
  fillRect(grid, 52, 68, 6, 6, 0); // left eye
  fillRect(grid, 70, 68, 6, 6, 0); // right eye
  fillRect(grid, 56, 82, 16, 3, 5); // mouth line
  noiseDither(grid, 40, 56, 48, 44, 6, 0.12, mulberry32(582)); // stony texture
  playerBack(grid, 30, 96, 5, 3.4);
  const glow = [
    { x: 55, y: 70, animation: "flicker" as const, color: "#c9a6ff" },
    { x: 73, y: 70, animation: "flicker" as const, color: "#c9a6ff" },
    ...radialGlow(100, 108, 6, "pulse", "#ff5a2a", mulberry32(583)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_pact_alone_end: the crack sealing shut ---
function aloneEnd128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 591);
  outlineRect(grid, 44, 60, 40, 36, 7, 5);
  noiseDither(grid, 44, 60, 40, 36, 5, 0.4, mulberry32(592)); // sealing over, dim
  playerBack(grid, 76, 90, 5, 3.2);
  const glow = [...radialGlow(20, 106, 6, "flicker", "#ff7a1f", mulberry32(593))];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_probe_intro: the player, suspicious, sizing the figure up ---
function probeIntro128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 601);
  hoodedFigure(grid, 70, 30, 6, 4, 2);
  playerBack(grid, 34, 88, 5, 4.4);
  const glow = [
    { x: 77, y: 44, animation: "pulse" as const, color: "#c9a6ff" },
    { x: 83, y: 44, animation: "pulse" as const, color: "#c9a6ff" },
    ...radialGlow(100, 106, 8, "flicker", "#ff7a1f", mulberry32(602)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_probe_explore: cracked ground glowing from beneath, a shape by a rock ---
function probeExplore128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 611);
  jaggedCrack(grid, 10, 96, 60, 124, 4, 2, mulberry32(612));
  jaggedCrack(grid, 90, 100, 70, 126, 4, 2, mulberry32(613));
  outlineRect(grid, 96, 84, 18, 14, 7, 5); // rock
  fillRect(grid, 98, 92, 12, 4, 6); // draped cloth shape
  const glow = [
    ...radialGlow(35, 112, 6, "pulse", "#ff5a2a", mulberry32(614)),
    ...radialGlow(80, 116, 6, "pulse", "#ff5a2a", mulberry32(615)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_probe_cloak: a worn human shirt with a stitched name ---
function probeCloak128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 621);
  outlineRect(grid, 40, 70, 48, 34, 6, 5); // rock backdrop
  outlineRect(grid, 48, 78, 32, 22, 7, 8); // draped shirt
  fillRect(grid, 56, 92, 16, 3, 8); // stitched name line
  const glow = [
    { x: 62, y: 93, animation: "sparkle" as const, color: "#ffdca0" },
    { x: 68, y: 93, animation: "sparkle" as const, color: "#ffdca0" },
    ...radialGlow(100, 108, 6, "flicker", "#ff7a1f", mulberry32(622)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_probe_confront_early: face to face, tense ---
function probeConfront128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 631);
  hoodedFigure(grid, 34, 26, 6, 4.6, 2);
  playerBack(grid, 80, 30, 5, 5.2);
  const glow = [
    { x: 43, y: 42, animation: "pulse" as const, color: "#c9a6ff" },
    { x: 49, y: 42, animation: "pulse" as const, color: "#c9a6ff" },
    ...radialGlow(64, 106, 10, "flicker", "#ff7a1f", mulberry32(632)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_probe_crack: a trapped face deep in a fissure ---
function probeCrack128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 641);
  jaggedCrack(grid, 40, 20, 70, 96, 4, 3, mulberry32(642));
  outlineRect(grid, 54, 80, 26, 24, 7, 5);
  fillRect(grid, 60, 88, 5, 5, 0);
  fillRect(grid, 72, 88, 5, 5, 0);
  const glow = [
    { x: 62, y: 90, animation: "flicker" as const, color: "#c9a6ff" },
    { x: 74, y: 90, animation: "flicker" as const, color: "#c9a6ff" },
    ...radialGlow(20, 106, 6, "pulse", "#ff5a2a", mulberry32(643)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_probe_free: the stone breaking apart around the trapped figure ---
function probeFree128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 651);
  outlineRect(grid, 48, 66, 32, 34, 7, 5);
  noiseDither(grid, 48, 66, 32, 34, 0, 0.3, mulberry32(652)); // stone crumbling
  fillRect(grid, 56, 78, 6, 6, 6); // face emerging
  fillRect(grid, 68, 78, 6, 6, 6);
  playerBack(grid, 90, 90, 5, 3.4);
  const glow = [
    { x: 59, y: 80, animation: "sparkle" as const, color: "#c9a6ff" },
    { x: 71, y: 80, animation: "sparkle" as const, color: "#c9a6ff" },
    ...radialGlow(20, 108, 6, "flicker", "#ff7a1f", mulberry32(653)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_probe_flee: running, a shadow looming behind ---
function probeFlee128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 661);
  playerBack(grid, 34, 84, 5, 4.6);
  hoodedFigure(grid, 78, 24, 5, 5, undefined); // looming, larger, unlit edge = menacing
  const glow = [
    ...radialGlow(90, 100, 10, "pulse", "#ff2d2d", mulberry32(662)),
    ...radialGlow(20, 112, 6, "flicker", "#ff7a1f", mulberry32(663)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_probe_caught_end: a cold hand on the shoulder ---
function probeCaughtEnd128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 671);
  hoodedFigure(grid, 62, 26, 6, 4.4, 2);
  playerBack(grid, 50, 78, 5, 3.6);
  fillRect(grid, 60, 66, 8, 3, 6); // arm reaching toward player's shoulder
  const glow = [
    { x: 69, y: 40, animation: "pulse" as const, color: "#c9a6ff" },
    { x: 75, y: 40, animation: "pulse" as const, color: "#c9a6ff" },
    ...radialGlow(30, 110, 6, "flicker", "#ff7a1f", mulberry32(672)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_probe_escape_run: a white rift torn through the black sky ---
function escapeRift128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 681);
  jaggedCrack(grid, 60, 4, 68, 60, 8, 3, mulberry32(682));
  fillRect(grid, 58, 30, 14, 4, 8);
  playerBack(grid, 56, 90, 5, 4);
  const glow = [
    ...radialGlow(64, 30, 14, "sparkle", "#ffffff", mulberry32(683)),
    ...radialGlow(20, 108, 6, "flicker", "#ff7a1f", mulberry32(684)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_probe_escape_end: forest at dawn, free ---
function escapeGoodEnd128() {
  const palette = ["#0d1c1a", "#1c3a30", "#2f5c46", "#4a7a5a", "#8fae6a", "#b7d98a", "#ffe6a0", "#3a2a1a", "#e8f5c8"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(691);
  for (let x = 0; x < 128; x++) {
    fillRect(grid, x, 0, 1, 30 + Math.floor(rng() * 10), 0);
  }
  fillRect(grid, 0, 90, 128, 38, 2);
  noiseDither(grid, 0, 90, 128, 38, 3, 0.2, mulberry32(692));
  const treeCols = [4, 20, 96, 112];
  treeCols.forEach((x) => {
    fillRect(grid, x + 4, 60, 6, 30, 7);
    fillRect(grid, x, 40, 16, 26, 1);
    fillRect(grid, x + 2, 44, 12, 18, 3);
  });
  playerBack(grid, 58, 78, 8, 3.6);
  const glow = [
    ...radialGlow(100, 20, 14, "sparkle", "#ffe6a0", mulberry32(693)),
    { x: 30, y: 40, animation: "sparkle" as const, color: "#e8f5c8" },
    { x: 90, y: 50, animation: "sparkle" as const, color: "#e8f5c8" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- hel_probe_lastlook_end: a hooded figure whose face is your own ---
function lastlookTwistEnd128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 701);
  jaggedCrack(grid, 60, 4, 66, 40, 8, 3, mulberry32(702));
  hoodedFigure(grid, 50, 40, 6, 3.6, 2);
  fillRect(grid, 57, 52, 2, 2, 8);
  fillRect(grid, 63, 52, 2, 2, 8);
  const glow = [
    ...radialGlow(64, 20, 10, "sparkle", "#ffffff", mulberry32(703)),
    { x: 58, y: 52, animation: "pulse" as const, color: "#c9a6ff" },
    { x: 64, y: 52, animation: "pulse" as const, color: "#c9a6ff" },
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_confront: the climax - three silhouettes facing off ---
function confrontClimax128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 711);
  hoodedFigure(grid, 84, 30, 6, 3.6, 2); // the devil
  playerBack(grid, 30, 84, 5, 3.6); // the player
  outlineRect(grid, 52, 70, 20, 30, 7, 5); // the freed one, still half in stone
  fillRect(grid, 58, 80, 4, 4, 6);
  fillRect(grid, 66, 80, 4, 4, 6);
  const glow = [
    { x: 91, y: 44, animation: "pulse" as const, color: "#c9a6ff" },
    { x: 97, y: 44, animation: "pulse" as const, color: "#c9a6ff" },
    { x: 60, y: 82, animation: "flicker" as const, color: "#ffdca0" },
    { x: 68, y: 82, animation: "flicker" as const, color: "#ffdca0" },
    ...radialGlow(20, 108, 6, "flicker", "#ff7a1f", mulberry32(712)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_liberation_end: fire dying down, a paling dawn sky opening ---
function liberationEnd128() {
  const palette = ["#1a1030", "#3a2f56", "#6a5a86", "#a89ac2", "#e6d9f5", "#3a1f16", "#8a2a0a", "#3a2f2a", "#ffdca0"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(721);
  for (let x = 0; x < 128; x++) {
    const back = 20 + Math.floor(rng() * 40);
    fillRect(grid, x, 0, 1, back, 1);
  }
  fillRect(grid, 0, 96, 128, 32, 5);
  noiseDither(grid, 0, 96, 128, 32, 6, 0.15, mulberry32(722)); // dying embers, dim
  fillRect(grid, 0, 96, 128, 2, 3);
  playerBack(grid, 48, 84, 5, 3.6);
  playerBack(grid, 68, 84, 4, 3.6);
  const glow = [
    ...radialGlow(64, 24, 16, "sparkle", "#e6d9f5", mulberry32(723)),
    ...radialGlow(30, 108, 4, "flicker", "#8a2a0a", mulberry32(724)),
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- hel_sacrifice_end: sealed in the stone, at peace ---
function sacrificeEnd128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 731);
  outlineRect(grid, 48, 60, 32, 40, 7, 5);
  fillRect(grid, 56, 74, 5, 5, 6);
  fillRect(grid, 68, 74, 5, 5, 6);
  fillRect(grid, 58, 88, 12, 3, 6); // faint, calm smile line
  playerBack(grid, 96, 92, 4, 3); // the freed one, walking away small
  const glow = [
    { x: 58, y: 76, animation: "flicker" as const, color: "#c9a6ff" },
    { x: 70, y: 76, animation: "flicker" as const, color: "#c9a6ff" },
    ...radialGlow(104, 96, 6, "sparkle", "#ffdca0", mulberry32(732)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_reckless_intro: an out-of-place flickering crack near the feet ---
function recklessIntro128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 741);
  jaggedCrack(grid, 50, 100, 78, 118, 8, 2, mulberry32(742));
  playerBack(grid, 56, 78, 5, 3.6);
  const glow = [
    ...radialGlow(64, 110, 10, "sparkle", "#ffffff", mulberry32(743)),
    ...radialGlow(20, 106, 6, "flicker", "#ff7a1f", mulberry32(744)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_reckless_reach / hel_reckless_pullback_end: a hand passing through the ground's texture ---
function recklessReach128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 751);
  outlineRect(grid, 40, 96, 48, 20, 8, 0); // a pale glitching seam in the floor
  noiseDither(grid, 40, 96, 48, 20, 0, 0.3, mulberry32(752));
  playerBack(grid, 54, 70, 5, 4);
  fillRect(grid, 58, 90, 3, 10, 6); // arm reaching down
  const glow = [
    ...radialGlow(64, 104, 10, "sparkle", "#ffffff", mulberry32(753)),
    ...radialGlow(20, 108, 5, "flicker", "#ff7a1f", mulberry32(754)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_reckless_crossover: reality torn, a mundane room bleeding through ---
function recklessCrossover128() {
  const palette = ["#070403", "#241210", "#3a1f16", "#5c1a0a", "#8a2a0a", "#2a3040", "#4a5468", "#c9d2e0", "#ffdca0"];
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 761);
  // a rectangular tear showing a mundane room: pale wall, dark window
  outlineRect(grid, 44, 30, 40, 54, 7, 5);
  fillRect(grid, 48, 34, 32, 46, 5);
  outlineRect(grid, 56, 42, 16, 14, 6, 7); // window
  fillRect(grid, 52, 66, 24, 4, 6); // bed edge
  const glow = [
    ...radialGlow(64, 50, 10, "sparkle", "#c9d2e0", mulberry32(762)),
    ...radialGlow(20, 108, 6, "flicker", "#ff7a1f", mulberry32(763)),
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- hel_reckless_wake_end: a plain bedroom ceiling, ash on the shoes - reality break ---
function recklessWakeEnd128() {
  const palette = ["#12141c", "#242838", "#3a4256", "#7a8aa8", "#e0e4ec", "#0e0e12", "#8a2a0a", "#3a2f2a", "#c9d2e0"];
  const grid = createGrid(128, 128, 0);
  fillRect(grid, 0, 0, 128, 128, 4); // pale ceiling/room fills most of the frame
  noiseDither(grid, 0, 0, 128, 90, 3, 0.06, mulberry32(771)); // faint cracks in the ceiling
  outlineRect(grid, 20, 90, 88, 30, 1, 5); // bed frame silhouette
  fillRect(grid, 26, 96, 76, 18, 2);
  fillRect(grid, 40, 106, 12, 10, 6); // shoes by the bed
  fillRect(grid, 56, 108, 12, 8, 6);
  noiseDither(grid, 40, 106, 28, 12, 7, 0.4, mulberry32(772)); // dry black ash on the shoes
  const glow = [{ x: 100, y: 20, animation: "flicker" as const, color: "#e0e4ec" }];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- hel_reckless_seal_end: the crack sealing with a soundless slam, figure looming ---
function recklessSealEnd128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 781);
  hoodedFigure(grid, 40, 16, 6, 5.6, undefined); // huge, unlit, filling the frame - menacing
  noiseDither(grid, 0, 0, 128, 96, 5, 0.1, mulberry32(782));
  const glow = [
    { x: 62, y: 60, animation: "pulse" as const, color: "#ff2d2d" },
    { x: 74, y: 60, animation: "pulse" as const, color: "#ff2d2d" },
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_reckless_stare: the flame filling the whole frame, doubled vision ---
function recklessStare128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 791);
  fillRect(grid, 20, 20, 88, 88, 3);
  noiseDither(grid, 20, 20, 88, 88, 4, 0.3, mulberry32(792));
  noiseDither(grid, 20, 20, 88, 88, 8, 0.06, mulberry32(793));
  const glow = [
    ...radialGlow(64, 64, 20, "flicker", "#ff5a2a", mulberry32(794)),
    ...radialGlow(48, 48, 8, "pulse", "#ff2d2d", mulberry32(795)),
    ...radialGlow(80, 80, 8, "pulse", "#ff2d2d", mulberry32(796)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_reckless_dissolve: a silhouette losing its edges to the embers ---
function recklessDissolve128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 801);
  playerBack(grid, 58, 60, 5, 5);
  noiseDither(grid, 50, 50, 30, 40, -1, 0.35, mulberry32(802)); // erase chunks of the silhouette into transparency
  const glow = [
    ...radialGlow(64, 70, 18, "sparkle", "#ff7a1f", mulberry32(803)),
    ...radialGlow(64, 50, 10, "sparkle", "#ffdca0", mulberry32(804)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

// --- hel_reckless_void_end: abstract embers drifting in a directionless dark ---
function recklessVoidEnd128() {
  const palette = ["#020103", "#0a0710", "#170d10", "#3a1f16", "#5c1a0a", "#241a10", "#0d0912", "#8a2a0a", "#ffdca0"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(811);
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rng() * 128);
    const y = Math.floor(rng() * 128);
    grid[y][x] = 4;
  }
  noiseDither(grid, 0, 0, 128, 128, 3, 0.03, mulberry32(812));
  const glow = radialGlow(64, 64, 24, "sparkle", "#ffdca0", mulberry32(813));
  return buildSpec(128, 128, palette, grid, glow);
}

// --- hel_reckless_anchor: close on the player's own hands, grounding ---
function recklessAnchor128() {
  const grid = createGrid(128, 128, 0);
  lavaBase(grid, 821);
  outlineRect(grid, 40, 60, 48, 40, 7, 5); // hands, large and central
  fillRect(grid, 48, 68, 8, 20, 7);
  fillRect(grid, 58, 66, 8, 22, 7);
  fillRect(grid, 68, 68, 8, 20, 7);
  fillRect(grid, 78, 70, 8, 18, 7);
  const glow = [
    ...radialGlow(64, 40, 10, "pulse", "#c9a6ff", mulberry32(822)),
    ...radialGlow(20, 108, 6, "flicker", "#ff7a1f", mulberry32(823)),
  ];
  return buildSpec(128, 128, HELL_PALETTE, grid, glow);
}

const images = {
  arenaReveal128: arenaReveal128(),
  pactOath128: pactOath128(),
  pactDeclineEnd128: pactDeclineEnd128(),
  obsidianRiddle128: obsidianRiddle128(),
  trialVision128: trialVision128(),
  regretEnd128: regretEnd128(),
  trial3Crossroads128: trial3Crossroads128(),
  heirEnd128: heirEnd128(),
  mercyCage128: mercyCage128(),
  aloneEnd128: aloneEnd128(),
  probeIntro128: probeIntro128(),
  probeExplore128: probeExplore128(),
  probeCloak128: probeCloak128(),
  probeConfront128: probeConfront128(),
  probeCrack128: probeCrack128(),
  probeFree128: probeFree128(),
  probeFlee128: probeFlee128(),
  probeCaughtEnd128: probeCaughtEnd128(),
  escapeRift128: escapeRift128(),
  escapeGoodEnd128: escapeGoodEnd128(),
  lastlookTwistEnd128: lastlookTwistEnd128(),
  confrontClimax128: confrontClimax128(),
  liberationEnd128: liberationEnd128(),
  sacrificeEnd128: sacrificeEnd128(),
  recklessIntro128: recklessIntro128(),
  recklessReach128: recklessReach128(),
  recklessCrossover128: recklessCrossover128(),
  recklessWakeEnd128: recklessWakeEnd128(),
  recklessSealEnd128: recklessSealEnd128(),
  recklessStare128: recklessStare128(),
  recklessDissolve128: recklessDissolve128(),
  recklessVoidEnd128: recklessVoidEnd128(),
  recklessAnchor128: recklessAnchor128(),
};
console.log(JSON.stringify(images));
