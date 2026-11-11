/*
 * Pattern fills of the Map (spec: specs/components/map.md › Pattern fills, roadmap 4.18.97, after
 * ApexMaps' patterns sample; WCAG 1.4.1): a texture per class over a choropleth's colors, so classes
 * differ by more than color. The patterns are the Chart's (4.18.62). `mapPatternLayer` is pure; the
 * map controller draws the images (`ok-pattern-<style>`) on demand through MapLibre's
 * `styleimagemissing` with `drawMapPattern`.
 */
import type { MapExpression, MapScaleResult } from "./choropleth.js";

/** Pattern styles, as the Chart names them. */
export const mapPatternStyles = [
  "slantedLines",
  "squares",
  "circles",
  "horizontalLines",
  "verticalLines",
] as const;
export type MapPatternStyle = (typeof mapPatternStyles)[number];

/** ApexMaps' names of the same textures. */
const ALIASES: Record<string, MapPatternStyle> = {
  dots: "circles",
  lines: "horizontalLines",
  diagonal: "slantedLines",
};

/** A pattern name (or an ApexMaps alias) → a style, or `null`. */
export function mapPatternStyle(value: unknown): MapPatternStyle | null {
  if (typeof value !== "string") return null;
  if (mapPatternStyles.includes(value as MapPatternStyle)) return value as MapPatternStyle;
  return ALIASES[value] ?? null;
}

/** The MapLibre image id of a pattern (`ok-pattern-none` is transparent). */
export const mapPatternImage = (style: MapPatternStyle | null) => `ok-pattern-${style ?? "none"}`;

const IMAGE = /^ok-pattern-(none|slantedLines|squares|circles|horizontalLines|verticalLines)$/;

/** The style of an image id the controller draws, or `undefined` for other ids. */
export const mapPatternOfImage = (id: string): MapPatternStyle | null | undefined => {
  const match = IMAGE.exec(id);
  if (!match) return undefined;
  return match[1] === "none" ? null : (match[1] as MapPatternStyle);
};

export interface MapPatternLayerOptions {
  /** Id of the layer (draw it between `mapRegionLayers`' fill and outline). */
  readonly id: string;
  readonly source: string;
  readonly sourceLayer?: string | undefined;
  /** The choropleth's scale: one pattern per class. */
  readonly scale: MapScaleResult;
  /** A pattern per class (`null`: none), in class order. Default: every pattern in turn. Aliases `dots`, `lines`, `diagonal` work too. */
  readonly patterns?:
    | readonly (MapPatternStyle | "dots" | "lines" | "diagonal" | null)[]
    | undefined;
  /** Opacity of the pattern of muted regions. Default 0.15, like the fill. */
  readonly mutedOpacity?: number | undefined;
}

/** The patterns of each class (`null`: none). */
export function mapClassPatterns(
  classes: number,
  patterns?: MapPatternLayerOptions["patterns"],
): (MapPatternStyle | null)[] {
  return Array.from({ length: classes }, (_, index) =>
    patterns
      ? mapPatternStyle(patterns[index])
      : (mapPatternStyles[index % mapPatternStyles.length] as MapPatternStyle),
  );
}

/**
 * A fill layer of patterns, one per class of the scale (regions without a value stay plain). It
 * reads the scale's `input` and the `muted` feature state like `mapRegionLayers`' fill.
 */
export function mapPatternLayer(options: MapPatternLayerOptions): {
  id: string;
  type: "fill";
  source: string;
  "source-layer"?: string;
  paint: Record<string, unknown>;
} {
  const { scale } = options;
  // The scale's expression is `["case", ["==", ["typeof", input], "number"], …]`.
  const typeOf = (scale.expression[1] as unknown[])[1] as unknown[];
  const input = typeOf[1] as MapExpression;
  const images = mapClassPatterns(scale.colors.length, options.patterns).map(mapPatternImage);
  const step: unknown =
    scale.breaks.length === 0
      ? images[0]
      : ["step", input, images[0], ...scale.breaks.flatMap((b, i) => [b, images[i + 1]])];
  return {
    id: options.id,
    type: "fill",
    source: options.source,
    ...(options.sourceLayer ? { "source-layer": options.sourceLayer } : {}),
    paint: {
      "fill-pattern": ["case", ["==", ["typeof", input], "number"], step, mapPatternImage(null)],
      "fill-opacity": [
        "case",
        ["boolean", ["feature-state", "muted"], false],
        options.mutedOpacity ?? 0.15,
        1,
      ],
    },
  };
}

/** Tile size in CSS px (as the Chart's patterns). */
const TILE = 8;

/**
 * Draws a pattern tile: ink marks on a transparent 8px tile at `pixelRatio`, as MapLibre image
 * data. Needs a canvas (DOM).
 */
export function drawMapPattern(
  style: MapPatternStyle | null,
  ink: string,
  pixelRatio = 2,
): { width: number; height: number; data: Uint8ClampedArray } {
  const size = TILE * pixelRatio;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context || style === null)
    return { width: size, height: size, data: new Uint8ClampedArray(size * size * 4) };
  context.scale(pixelRatio, pixelRatio);
  context.fillStyle = ink;
  context.strokeStyle = ink;
  context.lineWidth = 1.5;
  context.lineCap = "square";
  context.beginPath();
  if (style === "circles") {
    context.arc(4, 4, 1.75, 0, Math.PI * 2);
    context.fill();
  } else if (style === "squares") {
    context.fillRect(1, 1, 3.5, 3.5);
  } else {
    if (style === "verticalLines") {
      context.moveTo(4, 0);
      context.lineTo(4, 8);
    } else if (style === "horizontalLines") {
      context.moveTo(0, 4);
      context.lineTo(8, 4);
    } else {
      // Diagonals that join across tiles.
      context.moveTo(-2, 2);
      context.lineTo(2, -2);
      context.moveTo(0, 8);
      context.lineTo(8, 0);
      context.moveTo(6, 10);
      context.lineTo(10, 6);
    }
    context.stroke();
  }
  const { data } = context.getImageData(0, 0, size, size);
  return { width: size, height: size, data };
}
