/** Run-length codec for pixel art. Shared by the game (decode) and the story build scripts (encode). */

/** Encodes a [height][width] palette-index grid as flat `[index, runLength, ...]` pairs, row-major. */
export function encodeRle(pixels: number[][]): number[] {
  const rle: number[] = [];
  let current: number | undefined;
  let run = 0;
  for (const row of pixels) {
    for (const index of row) {
      if (index === current) {
        run++;
        continue;
      }
      if (run > 0) rle.push(current as number, run);
      current = index;
      run = 1;
    }
  }
  if (run > 0) rle.push(current as number, run);
  return rle;
}

/** Expands `rle` into a flat row-major array of palette indices (length width * height). */
export function decodeRle(rle: readonly number[], width: number, height: number): Int16Array {
  const out = new Int16Array(width * height);
  let pos = 0;
  for (let i = 0; i + 1 < rle.length; i += 2) {
    const end = Math.min(pos + rle[i + 1], out.length);
    out.fill(rle[i], pos, end);
    pos = end;
  }
  return out;
}
