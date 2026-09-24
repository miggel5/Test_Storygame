import { buildSpec, createGrid, fillRect, noiseDither, radialGlow, silhouette } from "./pixelArtHelpers.ts";

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function towerExterior() {
  const palette = ["#0d0b1a", "#171330", "#2b2440", "#463a68", "#100c1c", "#ffd479"];
  const grid = createGrid(16, 16, 0);
  fillRect(grid, 0, 12, 16, 4, 4); // ground
  const heights = [0, 0, 0, 0, 0, 9, 11, 11, 11, 9, 0, 0, 0, 0, 0, 0];
  silhouette(grid, heights, 2, 12);
  fillRect(grid, 6, 2, 4, 1, 3); // roof cap edge highlight
  fillRect(grid, 7, 9, 2, 3, 4); // door
  noiseDither(grid, 5, 3, 6, 8, 3, 0.12, mulberry32(1));
  const glow = radialGlow(7, 10, 3, "sparkle", "#ffd479", mulberry32(2));
  return buildSpec(16, 16, palette, grid, glow);
}

function towerInterior() {
  const palette = ["#0a0812", "#1a1428", "#2f2748", "#4a3a2a", "#ffb347"];
  const grid = createGrid(16, 16, 0);
  // spiral staircase suggestion: alternating step blocks climbing upward
  for (let i = 0; i < 7; i++) {
    const y = 14 - i * 2;
    const x = 4 + (i % 2 === 0 ? 0 : 5);
    fillRect(grid, x, y, 5, 1, 2);
  }
  fillRect(grid, 0, 15, 16, 1, 3); // torch base ledge
  noiseDither(grid, 0, 0, 16, 16, 1, 0.06, mulberry32(3));
  const glow = radialGlow(3, 14, 4, "flicker", "#ffb347", mulberry32(4));
  return buildSpec(16, 16, palette, grid, glow);
}

function deathEnding() {
  const palette = ["#0a0505", "#1a0808", "#3a0f0f", "#5c1414", "#ff4d4d"];
  const grid = createGrid(16, 16, 0);
  fillRect(grid, 5, 4, 6, 8, 1);
  fillRect(grid, 6, 6, 2, 2, 0); // eye socket
  fillRect(grid, 9, 6, 2, 2, 0); // eye socket
  fillRect(grid, 6, 10, 5, 1, 0); // mouth
  noiseDither(grid, 0, 0, 16, 16, 2, 0.08, mulberry32(5));
  const glow = radialGlow(6, 6, 3, "pulse", "#ff4d4d", mulberry32(6)).concat(
    radialGlow(9, 6, 3, "pulse", "#ff4d4d", mulberry32(7))
  );
  return buildSpec(16, 16, palette, grid, glow);
}

function twistEnding() {
  const palette = ["#0a0f1a", "#141f33", "#2a1f4a", "#7c5cff", "#c9a8ff"];
  const grid = createGrid(16, 16, 0);
  fillRect(grid, 0, 10, 16, 6, 1);
  silhouette(grid, [4, 6, 3, 7, 5, 8, 4, 6, 3, 5, 7, 4, 6, 3, 5, 4], 2, 10);
  noiseDither(grid, 0, 0, 16, 8, 3, 0.05, mulberry32(8));
  const glow = radialGlow(8, 4, 5, "sparkle", "#c9a8ff", mulberry32(9));
  return buildSpec(16, 16, palette, grid, glow);
}

const images = { towerExterior: towerExterior(), towerInterior: towerInterior(), deathEnding: deathEnding(), twistEnding: twistEnding() };
console.log(JSON.stringify(images, null, 2));
