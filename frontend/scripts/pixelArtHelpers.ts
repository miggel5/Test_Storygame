import type { GlowPixel, PixelArtSpec } from "../src/types/story";

export type Grid = number[][];

export function createGrid(width: number, height: number, fill = -1): Grid {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => fill));
}

export function fillRect(grid: Grid, x: number, y: number, w: number, h: number, colorIndex: number): void {
  for (let row = y; row < y + h; row++) {
    if (row < 0 || row >= grid.length) continue;
    for (let col = x; col < x + w; col++) {
      if (col < 0 || col >= grid[row].length) continue;
      grid[row][col] = colorIndex;
    }
  }
}

/** Fills each column from the bottom up to `heights[x]` pixels tall - good for towers, mountains, trees. */
export function silhouette(grid: Grid, heights: number[], colorIndex: number, baseY?: number): void {
  const floor = baseY ?? grid.length;
  heights.forEach((h, x) => {
    for (let row = floor - h; row < floor; row++) {
      if (row < 0 || row >= grid.length) continue;
      if (x < 0 || x >= grid[row].length) continue;
      grid[row][x] = colorIndex;
    }
  });
}

/** Scatters `colorIndex` onto empty (-1) cells within a rect for texture/dither. */
export function noiseDither(
  grid: Grid,
  x: number,
  y: number,
  w: number,
  h: number,
  colorIndex: number,
  density: number,
  rng: () => number = Math.random
): void {
  for (let row = y; row < y + h; row++) {
    if (row < 0 || row >= grid.length) continue;
    for (let col = x; col < x + w; col++) {
      if (col < 0 || col >= grid[row].length) continue;
      if (grid[row][col] === -1 && rng() < density) {
        grid[row][col] = colorIndex;
      }
    }
  }
}

/** Produces a small cluster of glow pixels around a center point - embers, sparkles, eyes. */
export function radialGlow(
  cx: number,
  cy: number,
  count: number,
  animation: GlowPixel["animation"] = "flicker",
  color?: string,
  rng: () => number = Math.random
): GlowPixel[] {
  const pixels: GlowPixel[] = [{ x: cx, y: cy, animation, color }];
  for (let i = 1; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const radius = 1 + Math.floor(rng() * 2);
    pixels.push({
      x: cx + Math.round(Math.cos(angle) * radius),
      y: cy + Math.round(Math.sin(angle) * radius),
      animation,
      color,
    });
  }
  return pixels;
}

export function buildSpec(width: number, height: number, palette: string[], pixels: Grid, glowPixels?: GlowPixel[]): PixelArtSpec {
  return { width, height, palette, pixels, glowPixels };
}
