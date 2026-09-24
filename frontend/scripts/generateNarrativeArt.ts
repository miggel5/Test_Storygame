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

function hoodedFigure(grid: number[][], x: number, y: number, colorIndex: number) {
  fillRect(grid, x, y, 3, 1, colorIndex); // hood tip
  fillRect(grid, x - 1, y + 1, 5, 2, colorIndex); // hood/shoulders
  fillRect(grid, x, y + 3, 3, 3, colorIndex); // body
}

function playerBack(grid: number[][], x: number, y: number, colorIndex: number) {
  fillRect(grid, x, y, 2, 1, colorIndex); // head
  fillRect(grid, x - 1, y + 1, 4, 2, colorIndex); // shoulders/body
}

function darkForestFire() {
  const palette = ["#030204", "#0d0912", "#100c0a", "#3a1c08", "#0a0710"];
  const grid = createGrid(16, 16, 0);
  fillRect(grid, 0, 13, 16, 3, 2); // ground
  // tree silhouettes, left and right clusters
  const leftHeights = [10, 12, 8, 11];
  leftHeights.forEach((h, i) => fillRect(grid, i, 13 - h, 1, h, 1));
  const rightHeights = [9, 12, 11, 8];
  rightHeights.forEach((h, i) => fillRect(grid, 12 + i, 13 - h, 1, h, 1));
  hoodedFigure(grid, 7, 6, 4);
  fillRect(grid, 6, 11, 3, 1, 3); // fire mound
  noiseDither(grid, 0, 0, 16, 13, 1, 0.05, mulberry32(11));
  const glow = radialGlow(7, 11, 5, "flicker", "#ffb347", mulberry32(12));
  return buildSpec(16, 16, palette, grid, glow);
}

function lavaTwistWorld() {
  const palette = ["#0a0503", "#241210", "#5c1a0a", "#050303", "#170d10", "#3a2f2a"];
  const grid = createGrid(16, 16, 0);
  // jagged cliffs from the top
  const cliffDepths = [5, 7, 4, 6, 3, 5, 2, 3, 2, 4, 3, 5, 4, 6, 5, 7];
  cliffDepths.forEach((d, x) => fillRect(grid, x, 0, 1, d, 1));
  fillRect(grid, 0, 12, 16, 4, 2); // lava/ground
  noiseDither(grid, 0, 7, 16, 5, 5, 0.1, mulberry32(13)); // smoke/ash haze
  hoodedFigure(grid, 7, 6, 4); // cloaked figure, mid-ground
  playerBack(grid, 7, 11, 3); // player silhouette, foreground bottom
  const glow = [
    ...radialGlow(3, 13, 3, "pulse", "#ff5a2a", mulberry32(14)),
    ...radialGlow(11, 14, 3, "flicker", "#ff7a1f", mulberry32(15)),
    ...radialGlow(13, 12, 2, "pulse", "#ff5a2a", mulberry32(16)),
  ];
  return buildSpec(16, 16, palette, grid, glow);
}

function brightForestClearing() {
  const palette = ["#bfe6ff", "#fff2b0", "#5a8f4a", "#4a3221", "#7fbf5a", "#2d4a22"];
  const grid = createGrid(16, 16, 0);
  fillRect(grid, 0, 11, 16, 5, 4); // bright ground
  // trunks + foliage, left and right
  fillRect(grid, 1, 6, 1, 5, 3);
  fillRect(grid, 0, 3, 3, 4, 2);
  fillRect(grid, 13, 7, 1, 4, 3);
  fillRect(grid, 12, 4, 4, 4, 2);
  fillRect(grid, 4, 8, 1, 3, 3);
  fillRect(grid, 3, 5, 3, 4, 2);
  fillRect(grid, 6, 12, 1, 1, 5); // small animal silhouette
  fillRect(grid, 10, 13, 1, 1, 5);
  const glow = radialGlow(11, 2, 6, "sparkle", "#fff2b0", mulberry32(17));
  return buildSpec(16, 16, palette, grid, glow);
}

const images = {
  darkForestFire: darkForestFire(),
  lavaTwistWorld: lavaTwistWorld(),
  brightForestClearing: brightForestClearing(),
};
console.log(JSON.stringify(images));
