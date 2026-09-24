import { buildSpec, createGrid, fillRect, hoodedFigure, noiseDither, playerBack, radialGlow } from "./pixelArtHelpers.ts";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function twoLayerTrees(
  grid: number[][],
  columns: number[],
  baseY: number,
  backColor: number,
  frontColor: number,
  rng: () => number,
  minH: number,
  maxH: number
) {
  columns.forEach((x) => {
    const backH = minH + Math.floor(rng() * (maxH - minH));
    fillRect(grid, x, baseY - backH, 4, backH, backColor);
  });
  columns.forEach((x) => {
    const frontH = minH - 2 + Math.floor(rng() * (maxH - minH));
    fillRect(grid, x + 2, baseY - frontH, 4, frontH, frontColor);
  });
}

function darkForestFire() {
  const palette = ["#020103", "#0d0912", "#171224", "#0f0b09", "#160f0b", "#3a1c08", "#0a0710"];
  const grid = createGrid(64, 64, 0);

  fillRect(grid, 0, 52, 64, 12, 3);
  noiseDither(grid, 0, 52, 64, 12, 4, 0.28, mulberry32(42));

  twoLayerTrees(grid, [0, 4, 8, 12, 16, 20], 52, 2, 1, mulberry32(43), 22, 34);
  twoLayerTrees(grid, [40, 44, 48, 52, 56, 60], 52, 2, 1, mulberry32(44), 20, 32);

  noiseDither(grid, 0, 0, 64, 44, 1, 0.015, mulberry32(45)); // faint distant silhouette haze

  hoodedFigure(grid, 24, 18, 6, 2, 2);
  fillRect(grid, 27, 46, 10, 4, 5); // fire mound / logs
  noiseDither(grid, 25, 45, 14, 6, 3, 0.15, mulberry32(46));

  const glow = [
    ...radialGlow(32, 45, 9, "flicker", "#ffb347", mulberry32(47)),
    ...radialGlow(32, 41, 5, "flicker", "#ff9d42", mulberry32(48)),
    { x: 28, y: 26, animation: "sparkle" as const, color: "#9a7bd8" },
    { x: 34, y: 26, animation: "sparkle" as const, color: "#9a7bd8" },
    { x: 10, y: 38, animation: "sparkle" as const, color: "#6fd8c9" },
    { x: 52, y: 34, animation: "sparkle" as const, color: "#6fd8c9" },
    { x: 6, y: 48, animation: "sparkle" as const, color: "#9a7bd8" },
  ];
  return buildSpec(64, 64, palette, grid, glow);
}

function lavaTwistWorld() {
  const palette = ["#070403", "#241210", "#3a1f16", "#5c1a0a", "#8a2a0a", "#040202", "#170d10", "#3a2f2a"];
  const grid = createGrid(64, 64, 0);
  const rng = mulberry32(51);

  for (let x = 0; x < 64; x++) {
    const back = 12 + Math.floor(rng() * 14);
    fillRect(grid, x, 0, 1, back, 1);
  }
  const rng2 = mulberry32(52);
  for (let x = 0; x < 64; x++) {
    const front = Math.max(0, 6 + Math.floor(rng2() * 10));
    fillRect(grid, x, 0, 1, front, 2);
  }

  fillRect(grid, 0, 48, 64, 16, 3); // lava floor
  noiseDither(grid, 0, 48, 64, 16, 4, 0.22, mulberry32(53));
  // flow veins
  [[4, 50, 18], [22, 55, 14], [40, 51, 20], [56, 58, 6]].forEach(([x, y, w]) => fillRect(grid, x, y, w, 1, 4));
  noiseDither(grid, 0, 28, 64, 20, 7, 0.09, mulberry32(54)); // smoke haze

  hoodedFigure(grid, 24, 17, 6, 2, 2); // cloaked figure, mid-ground
  playerBack(grid, 28, 46, 5, 2); // player silhouette, foreground bottom

  const grin = [
    { x: 29, y: 27, animation: "pulse" as const, color: "#ff2d2d" },
    { x: 30, y: 28, animation: "pulse" as const, color: "#ff2d2d" },
    { x: 31, y: 28, animation: "pulse" as const, color: "#ff2d2d" },
    { x: 32, y: 27, animation: "pulse" as const, color: "#ff2d2d" },
  ];
  const glow = [
    ...radialGlow(10, 54, 6, "pulse", "#ff5a2a", mulberry32(55)),
    ...radialGlow(48, 56, 6, "flicker", "#ff7a1f", mulberry32(56)),
    ...radialGlow(56, 50, 5, "pulse", "#ff5a2a", mulberry32(57)),
    ...radialGlow(6, 44, 4, "flicker", "#ff7a1f", mulberry32(58)),
    ...radialGlow(35, 52, 4, "pulse", "#ff5a2a", mulberry32(59)),
    ...grin,
  ];
  return buildSpec(64, 64, palette, grid, glow);
}

function brightForestClearing() {
  const palette = ["#bfe6ff", "#fff2b0", "#4a7a3a", "#6fae52", "#4a3221", "#7fbf5a", "#5a9a44", "#2d4a22"];
  const grid = createGrid(64, 64, 0);
  const rng = mulberry32(61);

  fillRect(grid, 0, 44, 64, 20, 5); // bright ground
  noiseDither(grid, 0, 44, 64, 20, 6, 0.22, mulberry32(62));

  const treeCols = [1, 8, 16, 48, 54, 60];
  treeCols.forEach((x) => {
    const trunkH = 8 + Math.floor(rng() * 4);
    fillRect(grid, x + 2, 44 - trunkH, 3, trunkH, 4);
    const foliageH = 16 + Math.floor(rng() * 8);
    fillRect(grid, x, 44 - trunkH - foliageH + 4, 8, foliageH, 2);
    fillRect(grid, x + 1, 44 - trunkH - foliageH + 2, 6, foliageH - 4, 3);
  });

  // small animals: body + ear bump
  [[24, 48], [38, 52], [50, 50]].forEach(([x, y]) => {
    fillRect(grid, x, y, 6, 4, 7);
    fillRect(grid, x + 1, y - 2, 2, 2, 7);
  });

  // scattered flowers/light dots in the grass
  const flowerRng = mulberry32(63);
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(flowerRng() * 64);
    const y = 46 + Math.floor(flowerRng() * 16);
    if (grid[y]?.[x] === 5) grid[y][x] = 1;
  }

  const glow = [
    ...radialGlow(46, 8, 9, "sparkle", "#fff2b0", mulberry32(64)),
    { x: 46, y: 2, animation: "sparkle" as const, color: "#fff2b0" },
    { x: 46, y: 14, animation: "sparkle" as const, color: "#fff2b0" },
    { x: 36, y: 8, animation: "sparkle" as const, color: "#fff2b0" },
    { x: 56, y: 8, animation: "sparkle" as const, color: "#fff2b0" },
    { x: 18, y: 16, animation: "sparkle" as const, color: "#fff2b0" },
    { x: 54, y: 22, animation: "sparkle" as const, color: "#fff2b0" },
    { x: 8, y: 24, animation: "sparkle" as const, color: "#fff2b0" },
  ];
  return buildSpec(64, 64, palette, grid, glow);
}

const images = { darkForestFire: darkForestFire(), lavaTwistWorld: lavaTwistWorld(), brightForestClearing: brightForestClearing() };
console.log(JSON.stringify(images));
