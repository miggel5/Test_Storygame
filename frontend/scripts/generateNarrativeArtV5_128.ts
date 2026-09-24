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

function threeLayerTrees(
  grid: number[][],
  columns: number[],
  baseY: number,
  backColor: number,
  midColor: number,
  frontColor: number,
  rng: () => number,
  minH: number,
  maxH: number
) {
  columns.forEach((x) => {
    const backH = minH + Math.floor(rng() * (maxH - minH));
    fillRect(grid, x, baseY - backH, 8, backH, backColor);
  });
  columns.forEach((x) => {
    const midH = minH - 4 + Math.floor(rng() * (maxH - minH));
    fillRect(grid, x + 3, baseY - midH, 8, midH, midColor);
  });
  columns.forEach((x) => {
    const frontH = minH - 8 + Math.floor(rng() * (maxH - minH));
    fillRect(grid, x + 5, baseY - frontH, 6, frontH, frontColor);
  });
}

// --- 1. start: dark, wet forest with a bonfire and the hooded figure ---
function darkForestFire128() {
  const palette = ["#020103", "#0d0912", "#171224", "#0f0b09", "#160f0b", "#3a1c08", "#0a0710", "#241a10", "#ffdca0"];
  const grid = createGrid(128, 128, 0);

  fillRect(grid, 0, 104, 128, 24, 3);
  noiseDither(grid, 0, 104, 128, 24, 4, 0.28, mulberry32(42));
  fillRect(grid, 0, 104, 128, 2, 7); // tree-line horizon band, separates ground from woods

  threeLayerTrees(grid, [0, 8, 16, 24, 32, 40], 104, 2, 1, 7, mulberry32(43), 44, 68);
  threeLayerTrees(grid, [80, 88, 96, 104, 112, 120], 104, 2, 1, 7, mulberry32(44), 40, 64);

  noiseDither(grid, 0, 0, 128, 88, 1, 0.02, mulberry32(45)); // faint distant silhouette haze
  // a scatter of tiny distant stars, visible through the canopy gap
  const starRng = mulberry32(145);
  for (let i = 0; i < 10; i++) {
    const x = 46 + Math.floor(starRng() * 36);
    const y = 6 + Math.floor(starRng() * 20);
    grid[y][x] = 8;
  }

  hoodedFigure(grid, 48, 34, 6, 4, 2);
  // a hint of a face under the hood: two small glowing eye-slits
  fillRect(grid, 55, 46, 2, 2, 2);
  fillRect(grid, 61, 46, 2, 2, 2);

  outlineRect(grid, 54, 92, 20, 8, 5, 7); // fire mound / logs, clearly bounded
  noiseDither(grid, 50, 90, 28, 12, 3, 0.15, mulberry32(46));

  const glow = [
    ...radialGlow(64, 90, 16, "flicker", "#ffb347", mulberry32(47)),
    ...radialGlow(64, 82, 10, "flicker", "#ff9d42", mulberry32(48)),
    { x: 56, y: 46, animation: "pulse" as const, color: "#c9a6ff" },
    { x: 62, y: 46, animation: "pulse" as const, color: "#c9a6ff" },
    { x: 20, y: 76, animation: "sparkle" as const, color: "#6fd8c9" },
    { x: 104, y: 68, animation: "sparkle" as const, color: "#6fd8c9" },
    { x: 12, y: 96, animation: "sparkle" as const, color: "#9a7bd8" },
    { x: 116, y: 88, animation: "sparkle" as const, color: "#9a7bd8" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 2. fork1_scene1: lava/hell world, devilish grin ---
function lavaTwistWorld128() {
  const palette = ["#070403", "#241210", "#3a1f16", "#5c1a0a", "#8a2a0a", "#040202", "#170d10", "#3a2f2a", "#ff2d2d"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(51);

  for (let x = 0; x < 128; x++) {
    const back = 24 + Math.floor(rng() * 28);
    fillRect(grid, x, 0, 1, back, 1);
  }
  const rng2 = mulberry32(52);
  for (let x = 0; x < 128; x++) {
    const front = Math.max(0, 12 + Math.floor(rng2() * 20));
    fillRect(grid, x, 0, 1, front, 2);
  }

  fillRect(grid, 0, 96, 128, 32, 3); // lava floor
  noiseDither(grid, 0, 96, 128, 32, 4, 0.22, mulberry32(53));
  fillRect(grid, 0, 96, 128, 2, 4); // bright rim where floor meets glow
  // flow veins, clearly separated bright rivers of lava
  [
    [8, 100, 36],
    [44, 110, 28],
    [80, 102, 40],
    [112, 116, 12],
  ].forEach(([x, y, w]) => fillRect(grid, x, y, w, 2, 4));
  noiseDither(grid, 0, 56, 128, 40, 7, 0.09, mulberry32(54)); // smoke haze

  hoodedFigure(grid, 48, 32, 6, 4, 2); // cloaked figure, mid-ground, larger + clearer
  playerBack(grid, 56, 92, 5, 4); // player silhouette, foreground bottom

  const grin = [
    { x: 58, y: 52, animation: "pulse" as const, color: "#ff2d2d" },
    { x: 60, y: 54, animation: "pulse" as const, color: "#ff2d2d" },
    { x: 62, y: 55, animation: "pulse" as const, color: "#ff2d2d" },
    { x: 64, y: 55, animation: "pulse" as const, color: "#ff2d2d" },
    { x: 66, y: 54, animation: "pulse" as const, color: "#ff2d2d" },
    { x: 68, y: 52, animation: "pulse" as const, color: "#ff2d2d" },
  ];
  const glow = [
    ...radialGlow(20, 108, 10, "pulse", "#ff5a2a", mulberry32(55)),
    ...radialGlow(96, 112, 10, "flicker", "#ff7a1f", mulberry32(56)),
    ...radialGlow(112, 100, 8, "pulse", "#ff5a2a", mulberry32(57)),
    ...radialGlow(12, 88, 7, "flicker", "#ff7a1f", mulberry32(58)),
    ...radialGlow(70, 104, 7, "pulse", "#ff5a2a", mulberry32(59)),
    ...grin,
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 3. fork2_scene1: bright forest clearing, sunlit, animals ---
function brightForestClearing128() {
  const palette = ["#bfe6ff", "#fff2b0", "#4a7a3a", "#6fae52", "#4a3221", "#7fbf5a", "#5a9a44", "#2d4a22", "#3a2413"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(61);

  fillRect(grid, 0, 88, 128, 40, 5); // bright ground
  noiseDither(grid, 0, 88, 128, 40, 6, 0.22, mulberry32(62));
  fillRect(grid, 0, 88, 128, 2, 1); // tree-line horizon band

  const treeCols = [2, 16, 32, 96, 112, 122];
  treeCols.forEach((x) => {
    const trunkH = 16 + Math.floor(rng() * 8);
    outlineRect(grid, x + 4, 88 - trunkH, 6, trunkH, 4, 8);
    const foliageH = 32 + Math.floor(rng() * 16);
    fillRect(grid, x, 88 - trunkH - foliageH + 8, 16, foliageH, 2);
    fillRect(grid, x + 2, 88 - trunkH - foliageH + 4, 12, foliageH - 8, 3);
  });

  // small animals: clearer bodies with outlined ears
  [
    [48, 96],
    [76, 104],
    [100, 100],
  ].forEach(([x, y]) => {
    outlineRect(grid, x, y, 12, 8, 7, 8);
    fillRect(grid, x + 2, y - 4, 4, 4, 7);
    fillRect(grid, x + 3, y - 3, 2, 2, 8); // ear inner shade
  });

  // scattered flowers/light dots in the grass
  const flowerRng = mulberry32(63);
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(flowerRng() * 128);
    const y = 92 + Math.floor(flowerRng() * 32);
    if (grid[y]?.[x] === 5) grid[y][x] = 1;
  }

  const glow = [
    ...radialGlow(92, 16, 14, "sparkle", "#fff2b0", mulberry32(64)),
    { x: 92, y: 4, animation: "sparkle" as const, color: "#fff2b0" },
    { x: 92, y: 28, animation: "sparkle" as const, color: "#fff2b0" },
    { x: 72, y: 16, animation: "sparkle" as const, color: "#fff2b0" },
    { x: 112, y: 16, animation: "sparkle" as const, color: "#fff2b0" },
    { x: 36, y: 32, animation: "sparkle" as const, color: "#fff2b0" },
    { x: 108, y: 44, animation: "sparkle" as const, color: "#fff2b0" },
    { x: 16, y: 48, animation: "sparkle" as const, color: "#fff2b0" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 4. fork2_scene2: lush frog pond ---
function lushFrogPond128() {
  const palette = ["#bfe6ff", "#fff2b0", "#2d4a22", "#4a7a3a", "#4a3221", "#7fbf5a", "#3f7a86", "#8fae3a", "#5f8a2a", "#e8f5c8"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(71);

  fillRect(grid, 0, 88, 128, 40, 5); // ground
  noiseDither(grid, 0, 88, 128, 40, 3, 0.2, mulberry32(72));

  const treeCols = [0, 14, 28, 100, 114];
  treeCols.forEach((x) => {
    const trunkH = 16 + Math.floor(rng() * 8);
    fillRect(grid, x + 4, 88 - trunkH, 6, trunkH, 4);
    const foliageH = 32 + Math.floor(rng() * 16);
    fillRect(grid, x, 88 - trunkH - foliageH + 8, 16, foliageH, 2);
    fillRect(grid, x + 2, 88 - trunkH - foliageH + 4, 12, foliageH - 8, 3);
  });

  // pond, outlined so its edge reads clearly
  outlineRect(grid, 30, 100, 68, 22, 6, 3);
  noiseDither(grid, 30, 100, 68, 22, 3, 0.1, mulberry32(73));
  // lily pad
  fillRect(grid, 42, 102, 8, 3, 9);

  // path with a few berries
  fillRect(grid, 6, 104, 22, 8, 4);
  const berryRng = mulberry32(74);
  for (let i = 0; i < 10; i++) {
    const x = 8 + Math.floor(berryRng() * 18);
    const y = 105 + Math.floor(berryRng() * 5);
    grid[y][x] = 1;
  }

  // big frog sitting at the pond's edge - clear rounded body, distinct eye bumps
  outlineRect(grid, 42, 92, 42, 14, 7, 8); // body
  outlineRect(grid, 48, 78, 32, 18, 7, 8); // back/head mass
  outlineRect(grid, 52, 70, 9, 9, 7, 8); // left eye bump
  outlineRect(grid, 74, 70, 9, 9, 7, 8); // right eye bump
  fillRect(grid, 55, 73, 4, 4, 8); // left pupil
  fillRect(grid, 77, 73, 4, 4, 8); // right pupil
  fillRect(grid, 60, 88, 6, 4, 5); // mouth line (smile)
  outlineRect(grid, 38, 100, 8, 10, 7, 8); // front leg
  outlineRect(grid, 82, 100, 8, 10, 7, 8); // front leg
  noiseDither(grid, 48, 78, 32, 26, 8, 0.15, mulberry32(75)); // spots

  const glow = [
    { x: 55, y: 74, animation: "sparkle" as const, color: "#fff2b0" },
    { x: 77, y: 74, animation: "sparkle" as const, color: "#fff2b0" },
    ...radialGlow(92, 18, 10, "sparkle", "#fff2b0", mulberry32(76)),
    { x: 20, y: 36, animation: "sparkle" as const, color: "#fff2b0" },
    { x: 108, y: 32, animation: "sparkle" as const, color: "#fff2b0" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 5. fork3_scene1: pastel space market, robot figure ---
function spaceMarketPastel128() {
  const palette = ["#1a1030", "#b79bde", "#f5e6a8", "#e0c6ff", "#8f8fa8", "#4a4a5e", "#ff9ecb", "#2c2440", "#ffffff"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(81);

  noiseDither(grid, 0, 0, 128, 80, 3, 0.05, mulberry32(82)); // distant stars
  const brightStarRng = mulberry32(182);
  for (let i = 0; i < 8; i++) {
    grid[Math.floor(brightStarRng() * 60)][Math.floor(brightStarRng() * 128)] = 8;
  }

  // floating ships in the window, outlined for legibility
  [
    [12, 16],
    [92, 28],
    [68, 8],
  ].forEach(([x, y]) => {
    outlineRect(grid, x, y, 16, 6, 4, 3);
    fillRect(grid, x + 4, y - 4, 8, 4, 3);
  });

  fillRect(grid, 0, 80, 128, 48, 7); // market floor
  noiseDither(grid, 0, 80, 128, 48, 5, 0.15, mulberry32(83));
  fillRect(grid, 0, 80, 128, 2, 4);

  // market stalls in pastel colors either side, outlined
  [
    [4, 88],
    [100, 88],
  ].forEach(([x, y]) => {
    outlineRect(grid, x, y, 24, 20, 1, 3);
    fillRect(grid, x, y, 24, 4, 2);
  });

  // little robots along the ground
  const botRng = mulberry32(84);
  for (let i = 0; i < 6; i++) {
    const x = 8 + Math.floor(botRng() * 112);
    const y = 112 + Math.floor(botRng() * 10);
    outlineRect(grid, x, y, 6, 6, 4, 5);
  }

  // metallic cloaked robot-figure, center - larger, clearer faceplate
  hoodedFigure(grid, 52, 40, 5, 4, 4);
  outlineRect(grid, 58, 60, 12, 4, 3, 8); // faceplate band
  fillRect(grid, 60, 61, 2, 2, 6); // left photo-eye
  fillRect(grid, 66, 61, 2, 2, 6); // right photo-eye

  const glow = [
    { x: 61, y: 62, animation: "pulse" as const, color: "#ff9ecb" },
    { x: 67, y: 62, animation: "pulse" as const, color: "#ff9ecb" },
    ...radialGlow(28, 92, 8, "sparkle", "#ff9ecb", mulberry32(85)),
    ...radialGlow(98, 96, 8, "sparkle", "#f5e6a8", mulberry32(86)),
    ...radialGlow(20, 20, 10, "flicker", "#e0c6ff", mulberry32(87)),
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 6. fork3_pilot_scene1: hangar full of starships, officer silhouette ---
function hangarStarships128() {
  const palette = ["#0a0e1a", "#232a3d", "#141826", "#5a6b8c", "#c9d6f0", "#8fd9ff", "#05070d", "#ffd27f", "#3a4a6b"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(91);

  fillRect(grid, 0, 0, 128, 80, 1); // hangar wall
  fillRect(grid, 0, 80, 128, 48, 2); // floor
  noiseDither(grid, 0, 80, 128, 48, 1, 0.1, mulberry32(92));
  fillRect(grid, 0, 80, 128, 2, 8);

  // row of starships along the back wall, outlined so hulls read clearly
  const shipCols = [4, 24, 88, 108];
  shipCols.forEach((x) => {
    outlineRect(grid, x, 28, 16, 28, 3, 4);
    fillRect(grid, x + 4, 20, 8, 8, 4);
  });

  // one bright hero ship, center-back, glowing
  outlineRect(grid, 48, 16, 32, 36, 3, 4);
  fillRect(grid, 54, 8, 20, 8, 4);
  fillRect(grid, 48, 52, 32, 4, 5);

  // tall silhouette figure in foreground (the officer with the high hat)
  fillRect(grid, 58, 88, 12, 4, 7); // hat brim
  fillRect(grid, 60, 80, 8, 8, 7); // hat crown
  fillRect(grid, 58, 96, 12, 8, 6); // head/shoulders
  fillRect(grid, 54, 104, 20, 20, 6); // coat body
  fillRect(grid, 54, 104, 20, 2, 8); // coat collar highlight

  // rows of aspirants, small silhouettes
  [16, 36, 92, 112].forEach((x) => {
    fillRect(grid, x, 112, 6, 12, 6);
  });

  const glow = [
    ...radialGlow(64, 32, 14, "pulse", "#8fd9ff", mulberry32(94)),
    { x: 64, y: 52, animation: "flicker" as const, color: "#ffd27f" },
    { x: 12, y: 36, animation: "flicker" as const, color: "#8fd9ff" },
    { x: 96, y: 36, animation: "flicker" as const, color: "#8fd9ff" },
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

// --- 7. fork3_villain_scene1: purple-cloaked figure, sabre, market brawl ---
function purpleSaberBrawl128() {
  const palette = ["#12081c", "#6a3fa0", "#3a1f66", "#d8d8e8", "#7fe8ff", "#241433", "#1c1030", "#ff4d4d", "#9a6fd0"];
  const grid = createGrid(128, 128, 0);
  const rng = mulberry32(101);

  fillRect(grid, 0, 88, 128, 40, 6); // floor
  noiseDither(grid, 0, 88, 128, 40, 5, 0.15, mulberry32(102));
  fillRect(grid, 0, 88, 128, 2, 7);

  // chaotic crowd silhouettes brawling in the background
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(rng() * 120);
    const y = 60 + Math.floor(rng() * 28);
    fillRect(grid, x, y, 8, 20, 5);
  }

  // mystic purple-cloaked figure, center, larger and outlined
  hoodedFigure(grid, 52, 32, 1, 4, 2);
  outlineRect(grid, 58, 48, 12, 6, 8, 2); // hood rim highlight band for clarity

  // sabre held out to the side, with a glowing blade
  fillRect(grid, 84, 60, 20, 2, 3);
  fillRect(grid, 80, 60, 4, 4, 3); // hilt
  const bladeGlow = Array.from({ length: 16 }, (_, i) => ({
    x: 88 + i,
    y: 60,
    animation: "pulse" as const,
    color: "#7fe8ff",
  }));

  // guards' warning silhouettes flanking the scene
  outlineRect(grid, 8, 68, 10, 28, 6, 7);
  outlineRect(grid, 110, 68, 10, 28, 6, 7);

  const glow = [
    ...bladeGlow,
    { x: 12, y: 68, animation: "pulse" as const, color: "#ff4d4d" },
    { x: 114, y: 68, animation: "pulse" as const, color: "#ff4d4d" },
    ...radialGlow(60, 48, 10, "sparkle", "#7fe8ff", mulberry32(103)),
  ];
  return buildSpec(128, 128, palette, grid, glow);
}

const images = {
  darkForestFire128: darkForestFire128(),
  lavaTwistWorld128: lavaTwistWorld128(),
  brightForestClearing128: brightForestClearing128(),
  lushFrogPond128: lushFrogPond128(),
  spaceMarketPastel128: spaceMarketPastel128(),
  hangarStarships128: hangarStarships128(),
  purpleSaberBrawl128: purpleSaberBrawl128(),
};
console.log(JSON.stringify(images));
