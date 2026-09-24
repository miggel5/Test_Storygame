import type { PixelArtSpec } from "../types/story";

interface PixelArtProps {
  spec: PixelArtSpec;
}

export function PixelArt({ spec }: PixelArtProps) {
  const { width, height, palette, pixels, glowPixels } = spec;

  return (
    <div className="pixel-art">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        shapeRendering="crispEdges"
        role="img"
        aria-hidden="true"
      >
        {pixels.map((row, y) =>
          row.map((index, x) => {
            if (index < 0 || index >= palette.length) return null;
            return <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={palette[index]} />;
          })
        )}
        {glowPixels?.map((glow, i) => (
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
    </div>
  );
}
