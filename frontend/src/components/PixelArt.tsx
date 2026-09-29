import { useEffect, useRef } from "react";
import { decodeRle } from "../engine/pixelCodec";
import type { PixelArtSpec } from "../types/story";

interface PixelArtProps {
  spec: PixelArtSpec;
}

/** "#rgb" or "#rrggbb" -> packed little-endian RGBA (opaque), as ImageData's Uint32 view expects. */
function packColor(hex: string): number {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

export function PixelArt({ spec }: PixelArtProps) {
  const { width, height, palette, rle, glowPixels } = spec;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const indices = decodeRle(rle, width, height);
    const colors = palette.map(packColor);
    const image = ctx.createImageData(width, height);
    const target = new Uint32Array(image.data.buffer);
    for (let i = 0; i < indices.length; i++) {
      const index = indices[i];
      if (index >= 0 && index < colors.length) target[i] = colors[index];
    }
    ctx.putImageData(image, 0, 0);
  }, [rle, width, height, palette]);

  return (
    <div className="pixel-art">
      <div className="pixel-art__stage">
        <canvas ref={canvasRef} width={width} height={height} aria-hidden="true" />
        {glowPixels && glowPixels.length > 0 && (
          <svg
            className="pixel-art__glow"
            viewBox={`0 0 ${width} ${height}`}
            shapeRendering="crispEdges"
            aria-hidden="true"
          >
            {glowPixels.map((glow, i) => (
              <rect
                key={i}
                x={glow.x}
                y={glow.y}
                width={1}
                height={1}
                fill={glow.color ?? "#ffb347"}
                className={`pixel-glow pixel-glow--${glow.animation ?? "pulse"}`}
                style={{ animationDelay: `${(i * 137) % 900}ms` }}
              />
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}
