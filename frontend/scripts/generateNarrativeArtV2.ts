import { buildSpec, createGrid, fillRect, noiseDither, radialGlow } from "./pixelArtHelpers.ts";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hoodedFigure(grid: number[][], x: number, y: number, colorIndex: number, edgeColor?: number) {
  fillRect(grid, x + 2, y, 4, 1, colorIndex); // hood tip
  fillRect(grid, x + 1, y + 1, 6, 2, colorIndex); // hood crown
  fillRect(grid, x, y + 3, 8, 3, colorIndex); // shoulders
  fillRect(grid, x + 1, y + 6, 6, 6, colorIndex); // body/robe
  fillRect(grid, x, y + 9, 8, 3, colorIndex); // robe hem, wider
  if (edgeColor !== undefined) {
    fillRect(grid, x, y + 12, 8, 1, edgeColor); // hem highlight
    fillRect(grid, x + 1, y + 1, 6, 1, edgeColor); // hood rim highlight
  }
}

function playerBack(grid: number[][], x: number, y: number, colorIndex: number) {
  fillRect(grid, x + 1, y, 2, 2, colorIndex); // head
  fillRect(grid, x, y + 2, 4, 3, colorIndex); // shoulders
  fillRect(grid, x, y + 5, 4, 3, colorIndex); // legs
}

function twoLayerTrees(
  grid: number[][],
  columns: number[],
  backHeights: number[],
  frontHeights: number[],
  baseY: number,
  backColor: number,
  frontColor: number
) {
  columns.forEach((x, i) => {
    fillRect(grid, x, baseY - backHeights[i], 2, backHeights[i], backColor);
  });
  columns.forEach((x, i) => {
    fillRect(grid, x + 1, baseY - frontHeights[i], 2, frontHeights[i], frontColor);
  });
}

function darkForestFire() {
  const palette = ["#020103", "#0d0912", "#171224", "#0f0b09", "#160f0b", "#3a1c08", "#0a0710"];
  const grid = createGrid(32, 32, 0);
  fillRect(grid, 0, 26, 32, 6, 3); // ground
  noiseDither(grid, 0, 26, 32, 6, 4, 0.25, mulberry32(21));

  const leftCols = [0, 3, 6, 9];
  twoLayerTrees(grid, leftCols, [16, 20, 14, 18], [14, 17, 12, 15], 26, 2, 1);
  const rightCols = [21, 24, 27, 29];
  twoLayerTrees(grid, rightCols, [15, 19, 13, 17], [13, 16, 11, 14], 26, 2, 1);

  hoodedFigure(grid, 12, 10, 6);
  fillRect(grid, 13, 22, 6, 2, 5); // fire mound / logs
  noiseDither(grid, 0, 0, 32, 22, 1, 0.02, mulberry32(22)); // faint distant tree noise

  const glow = [
    ...radialGlow(16, 22, 6, "flicker", "#ffb347", mulberry32(23)),
    ...radialGlow(16, 20, 3, "flicker", "#ff9d42", mulberry32(24)),
    { x: 14, y: 13, animation: "sparkle" as const, color: "#9a7bd8" },
    { x: 17, y: 13, animation: "sparkle" as const, color: "#9a7bd8" },
  ];
  return buildSpec(32, 32, palette, grid, glow);
}

function lavaTwistWorld() {
  const palette = ["#070403", "#241210", "#3a1f16", "#5c1a0a", "#8a2a0a", "#040202", "#170d10", "#3a2f2a"];
  const grid = createGrid(32, 32, 0);

  const cliffBack = [9, 12, 8, 11, 7, 10, 6, 9, 7, 10, 8, 12, 9, 11, 8, 13, 10, 8, 11, 7, 9, 12, 8, 10, 7, 9, 11, 8, 10, 12, 9, 11];
  cliffBack.forEach((d, x) => fillRect(grid, x, 0, 1, d, 1));
  const cliffFront = cliffBack.map((d) => Math.max(0, d - 4));
  cliffFront.forEach((d, x) => fillRect(grid, x, 0, 1, d, 2));

  fillRect(grid, 0, 24, 32, 8, 3); // lava floor
  noiseDither(grid, 0, 24, 32, 8, 4, 0.2, mulberry32(25));
  noiseDither(grid, 0, 14, 32, 10, 7, 0.08, mulberry32(26)); // smoke haze

  hoodedFigure(grid, 12, 9, 6, 2);
  playerBack(grid, 14, 23, 5);

  const glow = [
    ...radialGlow(6, 27, 5, "pulse", "#ff5a2a", mulberry32(27)),
    ...radialGlow(24, 28, 5, "flicker", "#ff7a1f", mulberry32(28)),
    ...radialGlow(28, 25, 4, "pulse", "#ff5a2a", mulberry32(29)),
    ...radialGlow(3, 22, 3, "flicker", "#ff7a1f", mulberry32(30)),
    { x: 15, y: 13, animation: "pulse" as const, color: "#ff2d2d" },
    { x: 16, y: 13, animation: "pulse" as const, color: "#ff2d2d" },
  ];
  return buildSpec(32, 32, palette, grid, glow);
}

function brightForestClearing() {
  const palette = ["#bfe6ff", "#fff2b0", "#4a7a3a", "#6fae52", "#4a3221", "#7fbf5a", "#5a9a44", "#2d4a22"];
  const grid = createGrid(32, 32, 0);
  fillRect(grid, 0, 22, 32, 10, 5); // bright ground
  noiseDither(grid, 0, 22, 32, 10, 6, 0.2, mulberry32(31));

  fillRect(grid, 2, 13, 2, 9, 4);
  fillRect(grid, 0, 6, 7, 9, 2);
  fillRect(grid, 1, 5, 5, 7, 3);

  fillRect(grid, 26, 15, 2, 7, 4);
  fillRect(grid, 23, 8, 8, 9, 2);
  fillRect(grid, 24, 7, 6, 7, 3);

  fillRect(grid, 8, 17, 2, 5, 4);
  fillRect(grid, 6, 11, 6, 7, 2);
  fillRect(grid, 7, 10, 4, 5, 3);

  fillRect(grid, 12, 23, 3, 2, 7);
  fillRect(grid, 12, 22, 1, 1, 7);
  fillRect(grid, 20, 25, 3, 2, 7);
  fillRect(grid, 20, 24, 1, 1, 7);

  const glow = [
    ...radialGlow(23, 4, 7, "sparkle", "#fff2b0", mulberry32(32)),
    { x: 9, y: 8, animation: "sparkle" as const, color: "#fff2b0" },
    { x: 27, y: 11, animation: "sparkle" as const, color: "#fff2b0" },
    { x: 4, y: 9, animation: "sparkle" as const, color: "#fff2b0" },
  ];
  return buildSpec(32, 32, palette, grid, glow);
}

const images = { darkForestFire: darkForestFire(), lavaTwistWorld: lavaTwistWorld(), brightForestClearing: brightForestClearing() };
console.log(JSON.stringify(images));
