import { buildSpec, createGrid, fillRect, hoodedFigure, noiseDither, radialGlow } from "./pixelArtHelpers.ts";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lushFrogPond() {
  const palette = ["#bfe6ff", "#fff2b0", "#2d4a22", "#4a7a3a", "#4a3221", "#7fbf5a", "#3f7a86", "#8fae3a", "#5f8a2a"];
  const grid = createGrid(64, 64, 0);
  const rng = mulberry32(71);

  fillRect(grid, 0, 44, 64, 20, 5); // ground
  noiseDither(grid, 0, 44, 64, 20, 3, 0.2, mulberry32(72));

  const treeCols = [0, 7, 14, 50, 57];
  treeCols.forEach((x) => {
    const trunkH = 8 + Math.floor(rng() * 4);
    fillRect(grid, x + 2, 44 - trunkH, 3, trunkH, 4);
    const foliageH = 16 + Math.floor(rng() * 8);
    fillRect(grid, x, 44 - trunkH - foliageH + 4, 8, foliageH, 2);
    fillRect(grid, x + 1, 44 - trunkH - foliageH + 2, 6, foliageH - 4, 3);
  });

  // pond
  fillRect(grid, 18, 50, 30, 10, 6);
  noiseDither(grid, 18, 50, 30, 10, 3, 0.1, mulberry32(73));

  // path with a few berries
  fillRect(grid, 4, 52, 12, 4, 4);
  const berryRng = mulberry32(74);
  for (let i = 0; i < 6; i++) {
    const x = 5 + Math.floor(berryRng() * 10);
    const y = 52 + Math.floor(berryRng() * 3);
    grid[y][x] = 1;
  }

  // big frog sitting at the pond's edge
  fillRect(grid, 22, 46, 20, 6, 7); // body
  fillRect(grid, 24, 40, 16, 8, 7); // back/head mass
  fillRect(grid, 26, 36, 4, 4, 7); // left eye bump
  fillRect(grid, 36, 36, 4, 4, 7); // right eye bump
  fillRect(grid, 27, 37, 2, 2, 8); // left pupil
  fillRect(grid, 37, 37, 2, 2, 8); // right pupil
  fillRect(grid, 20, 50, 4, 4, 7); // front leg
  fillRect(grid, 40, 50, 4, 4, 7); // front leg
  noiseDither(grid, 24, 40, 16, 12, 8, 0.15, mulberry32(75)); // spots

  const glow = [
    { x: 27, y: 38, animation: "sparkle" as const, color: "#fff2b0" },
    { x: 37, y: 38, animation: "sparkle" as const, color: "#fff2b0" },
    ...radialGlow(46, 10, 6, "sparkle", "#fff2b0", mulberry32(76)),
    { x: 10, y: 20, animation: "sparkle" as const, color: "#fff2b0" },
    { x: 54, y: 18, animation: "sparkle" as const, color: "#fff2b0" },
  ];
  return buildSpec(64, 64, palette, grid, glow);
}

function spaceMarketPastel() {
  const palette = ["#1a1030", "#b79bde", "#f5e6a8", "#e0c6ff", "#8f8fa8", "#4a4a5e", "#ff9ecb", "#2c2440"];
  const grid = createGrid(64, 64, 0);
  const rng = mulberry32(81);

  noiseDither(grid, 0, 0, 64, 40, 3, 0.05, mulberry32(82)); // distant stars

  // floating ships in the window
  [[6, 8], [46, 14], [34, 4]].forEach(([x, y]) => {
    fillRect(grid, x, y, 8, 3, 4);
    fillRect(grid, x + 2, y - 2, 4, 2, 3);
  });

  fillRect(grid, 0, 40, 64, 24, 7); // market floor
  noiseDither(grid, 0, 40, 64, 24, 5, 0.15, mulberry32(83));

  // market stalls in pastel colors either side
  [[2, 44], [50, 44]].forEach(([x, y]) => {
    fillRect(grid, x, y, 12, 10, 1);
    fillRect(grid, x, y, 12, 2, 2);
  });

  // little robots along the ground
  const botRng = mulberry32(84);
  for (let i = 0; i < 5; i++) {
    const x = 4 + Math.floor(botRng() * 56);
    const y = 56 + Math.floor(botRng() * 5);
    fillRect(grid, x, y, 3, 3, 4);
  }

  // metallic cloaked robot-figure, center
  hoodedFigure(grid, 26, 20, 5, 2, 4);
  fillRect(grid, 29, 30, 6, 2, 3); // faceplate band

  const glow = [
    { x: 30, y: 31, animation: "pulse" as const, color: "#e0c6ff" },
    { x: 33, y: 31, animation: "pulse" as const, color: "#e0c6ff" },
    ...radialGlow(15, 46, 5, "sparkle", "#ff9ecb", mulberry32(85)),
    ...radialGlow(49, 48, 5, "sparkle", "#f5e6a8", mulberry32(86)),
    ...radialGlow(10, 10, 6, "flicker", "#e0c6ff", mulberry32(87)),
  ];
  return buildSpec(64, 64, palette, grid, glow);
}

function hangarStarships() {
  const palette = ["#0a0e1a", "#232a3d", "#141826", "#5a6b8c", "#c9d6f0", "#8fd9ff", "#05070d", "#ffd27f"];
  const grid = createGrid(64, 64, 0);
  const rng = mulberry32(91);

  fillRect(grid, 0, 0, 64, 40, 1); // hangar wall
  fillRect(grid, 0, 40, 64, 24, 2); // floor
  noiseDither(grid, 0, 40, 64, 24, 1, 0.1, mulberry32(92));

  // row of starships along the back wall
  const shipCols = [2, 12, 44, 54];
  shipCols.forEach((x) => {
    fillRect(grid, x, 14, 8, 14, 3);
    fillRect(grid, x + 2, 10, 4, 4, 4);
  });

  // one bright hero ship, center-back, glowing
  fillRect(grid, 24, 8, 16, 18, 3);
  fillRect(grid, 27, 4, 10, 4, 4);
  fillRect(grid, 24, 26, 16, 2, 5);

  // tall silhouette figure in foreground (the officer with the high hat)
  fillRect(grid, 29, 44, 6, 2, 7); // hat brim
  fillRect(grid, 30, 40, 4, 4, 7); // hat crown
  fillRect(grid, 29, 48, 6, 4, 6); // head/shoulders
  fillRect(grid, 27, 52, 10, 10, 6); // coat body
  noiseDither(grid, 27, 52, 10, 10, 1, rng() * 0 + 0.06, mulberry32(93));

  // rows of aspirants, small silhouettes
  [8, 18, 46, 56].forEach((x) => {
    fillRect(grid, x, 56, 3, 6, 6);
  });

  const glow = [
    ...radialGlow(32, 16, 8, "pulse", "#8fd9ff", mulberry32(94)),
    { x: 32, y: 26, animation: "flicker" as const, color: "#ffd27f" },
    { x: 6, y: 18, animation: "flicker" as const, color: "#8fd9ff" },
    { x: 48, y: 18, animation: "flicker" as const, color: "#8fd9ff" },
  ];
  return buildSpec(64, 64, palette, grid, glow);
}

function purpleSaberBrawl() {
  const palette = ["#12081c", "#6a3fa0", "#3a1f66", "#d8d8e8", "#7fe8ff", "#241433", "#1c1030", "#ff4d4d"];
  const grid = createGrid(64, 64, 0);
  const rng = mulberry32(101);

  fillRect(grid, 0, 44, 64, 20, 6); // floor
  noiseDither(grid, 0, 44, 64, 20, 5, 0.15, mulberry32(102));

  // chaotic crowd silhouettes brawling in the background
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(rng() * 60);
    const y = 30 + Math.floor(rng() * 14);
    fillRect(grid, x, y, 4, 10, 5);
  }

  // mystic purple-cloaked figure, center
  hoodedFigure(grid, 26, 16, 1, 2, 2);

  // sabre held out to the side, with a glowing blade
  fillRect(grid, 42, 30, 10, 1, 3);
  fillRect(grid, 40, 30, 2, 2, 3); // hilt
  const bladeGlow = Array.from({ length: 8 }, (_, i) => ({
    x: 44 + i,
    y: 30,
    animation: "pulse" as const,
    color: "#7fe8ff",
  }));

  // guards' warning silhouettes flanking the scene
  fillRect(grid, 4, 34, 5, 14, 6);
  fillRect(grid, 55, 34, 5, 14, 6);

  const glow = [
    ...bladeGlow,
    { x: 6, y: 34, animation: "pulse" as const, color: "#ff4d4d" },
    { x: 57, y: 34, animation: "pulse" as const, color: "#ff4d4d" },
    ...radialGlow(30, 24, 6, "sparkle", "#7fe8ff", mulberry32(103)),
  ];
  return buildSpec(64, 64, palette, grid, glow);
}

const images = {
  lushFrogPond: lushFrogPond(),
  spaceMarketPastel: spaceMarketPastel(),
  hangarStarships: hangarStarships(),
  purpleSaberBrawl: purpleSaberBrawl(),
};
console.log(JSON.stringify(images));
