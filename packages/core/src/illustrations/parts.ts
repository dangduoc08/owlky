/*
 * Illustration parts (ADR-0041, docs/illustrations-style.md): the pieces the set repeats, as pure
 * functions that return nodes. The built-in pictures compose them, and your own art can too, so
 * every scene shares one backdrop, one ground shadow, one sparkle and one way of drawing people.
 * Parameters are numbers and tones only. Each part marks its first node with `part` (never
 * rendered), which the style rule tests count. Functions are side-effect free, so bundlers keep
 * only the parts a picture uses.
 */
import type { IllustrationNode, IllustrationTone } from "../illustration/illustration.js";

/** Names written in `IllustrationNode.part`. */
export const illustrationParts = [
  "backdrop",
  "ground-shadow",
  "sparkle",
  "dot",
  "cloud",
  "plant",
  "lines",
  "paper",
  "screen",
  "person",
] as const;
export type IllustrationPart = (typeof illustrationParts)[number];

/** Brand tones (the `color` option's palette). */
export type IllustrationBrandTone = "lighter" | "light" | "main" | "dark" | "darker";
/** Tones of sparkles and dots: a brand tint or an accent. */
export type IllustrationSparkleTone = "lighter" | "light" | "accent-light" | "accent-main";
/** Skin tones of people. */
export type IllustrationSkinTone = "skin-light" | "skin-medium" | "skin-deep";

/** The scene's soft backdrop: one blob shape for every picture, in `main` at 8% opacity. */
/* @__NO_SIDE_EFFECTS__ */
export function backdrop(): IllustrationNode {
  return {
    part: "backdrop",
    tag: "path",
    tone: "main",
    attrs: {
      d: "M86 122C118 62 200 30 282 44c80 14 136 64 142 136 6 72-46 124-134 136-86 12-176-4-214-62-36-56-24-96 10-132Z",
      opacity: 0.08,
    },
  };
}

export interface GroundShadowOptions {
  /** Center x. Default 240 (the canvas center). */
  cx?: number;
  /** Center y: the ground line. Default 320. */
  cy?: number;
  /** Half width. Default 190. */
  rx?: number;
  /** Half height. Default 12. */
  ry?: number;
}

/** The flat ellipse the scene stands on (`shadow` tone). */
/* @__NO_SIDE_EFFECTS__ */
export function groundShadow({
  cx = 240,
  cy = 320,
  rx = 190,
  ry = 12,
}: GroundShadowOptions = {}): IllustrationNode {
  return { part: "ground-shadow", tag: "ellipse", tone: "shadow", attrs: { cx, cy, rx, ry } };
}

/** A four-point star of radius `r` centered on (`x`, `y`): `accent-main` by default. */
/* @__NO_SIDE_EFFECTS__ */
export function sparkle(
  x: number,
  y: number,
  r: number,
  tone: IllustrationSparkleTone = "accent-main",
): IllustrationNode {
  const q = `Q${x} ${y}`;
  return {
    part: "sparkle",
    tag: "path",
    tone,
    attrs: {
      d: `M${x} ${y - r}${q} ${x + r} ${y}${q} ${x} ${y + r}${q} ${x - r} ${y}${q} ${x} ${y - r}Z`,
    },
  };
}

/** A small round sparkle (radius 3 to 5): `light` by default. */
/* @__NO_SIDE_EFFECTS__ */
export function dot(
  cx: number,
  cy: number,
  r: number,
  tone: IllustrationSparkleTone = "light",
): IllustrationNode {
  return { part: "dot", tag: "circle", tone, attrs: { cx, cy, r } };
}

/**
 * A cloud whose flat base starts at (`x`, `y`): 70 × 46 at `scale` 1 (`neutral`). Sky scenes
 * stand on a bank of clouds instead of a ground shadow.
 */
/* @__NO_SIDE_EFFECTS__ */
export function cloud(x: number, y: number, scale = 1): IllustrationNode {
  const k = (value: number) => Math.round(value * scale * 100) / 100;
  const arc = (r: number) => `a${k(r)} ${k(r)} 0 0 0`;
  return {
    part: "cloud",
    tag: "path",
    tone: "neutral",
    attrs: {
      d: `M${x} ${y}h${k(70)}${arc(18)} 0-${k(36)}${arc(26)}-${k(48)}-${k(10)}${arc(20)}-${k(34)} ${k(14)}${arc(16)} ${k(12)} ${k(32)}Z`,
    },
  };
}

/** A potted plant whose leaves start at (`x`, `y`); the pot reaches `y + 28`. */
/* @__NO_SIDE_EFFECTS__ */
export function plant(x: number, y: number): IllustrationNode {
  const leaf = (tone: IllustrationBrandTone, d: string, angle: number): IllustrationNode => ({
    tag: "path",
    tone,
    attrs: { d, transform: `translate(${x} ${y}) rotate(${angle})` },
  });
  return {
    part: "plant",
    tag: "g",
    attrs: {},
    children: [
      leaf("light", "M0 0C-11.1 -15.8 -8.4 -36.2 0 -46.4C8.4 -36.2 11.1 -15.8 0 0Z", -32),
      leaf("main", "M0 0C-10.4 -14.7 -7.8 -33.7 0 -43.2C7.8 -33.7 10.4 -14.7 0 0Z", 30),
      leaf("dark", "M0 0C-13.8 -19.6 -10.4 -44.9 0 -57.6C10.4 -44.9 13.8 -19.6 0 0Z", -4),
      { tag: "path", tone: "ink", attrs: { d: `M${x - 20} ${y - 6}h40l-6 34h-28Z` } },
    ],
  };
}

export interface LinesOptions {
  /** Start of the first line. */
  x: number;
  y: number;
  /** Length of each line, top to bottom. */
  lengths: readonly number[];
  /** Distance between lines. Default 20. */
  gap?: number;
  /** Stroke width. Default 6. */
  width?: number;
}

/** Placeholder text: horizontal round-capped lines (`line` tone), one path. */
/* @__NO_SIDE_EFFECTS__ */
export function lines({ x, y, lengths, gap = 20, width = 6 }: LinesOptions): IllustrationNode {
  return {
    part: "lines",
    tag: "path",
    tone: "line",
    stroke: width,
    attrs: { d: lengths.map((length, index) => `M${x} ${y + index * gap}h${length}`).join("") },
  };
}

export interface PaperOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Corner radius. */
  radius: number;
  /** Fill: `paper` (sheets, cards, boards) or `neutral` (pedestals). Default `paper`. */
  tone?: "paper" | "neutral" | undefined;
  /** Outline width (`outline` tone). Default 3. */
  outline?: number | undefined;
  /** Placeholder text on the sheet. */
  lines?: LinesOptions | undefined;
  /** Rotates the sheet: the parts then come in one group. */
  transform?: string | undefined;
}

/**
 * A sheet, card or board: a filled rounded rectangle with a thin outline, and optional text
 * lines. Returns its nodes in drawing order (spread them into the scene).
 */
/* @__NO_SIDE_EFFECTS__ */
export function paper({
  x,
  y,
  width,
  height,
  radius,
  tone = "paper",
  outline = 3,
  lines: text,
  transform,
}: PaperOptions): IllustrationNode[] {
  const box = { x, y, width, height, rx: radius };
  const rest: IllustrationNode[] = [{ tag: "rect", tone: "outline", stroke: outline, attrs: box }];
  if (text) rest.push(lines(text));
  if (transform)
    return [
      {
        part: "paper",
        tag: "g",
        attrs: { transform },
        children: [{ tag: "rect", tone, attrs: box }, ...rest],
      },
    ];
  return [{ part: "paper", tag: "rect", tone, attrs: box }, ...rest];
}

export interface ScreenOptions {
  /** The device's outer box. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Outer corner radius; the screen's is 8 less. */
  radius: number;
  /** Frame width around the screen: one number, or [sides, top and bottom]. Default 14. */
  bezel?: number | readonly [number, number] | undefined;
}

/** A monitor or phone: an `ink` frame around a `paper` screen. Returns both nodes. */
/* @__NO_SIDE_EFFECTS__ */
export function screen({
  x,
  y,
  width,
  height,
  radius,
  bezel = 14,
}: ScreenOptions): IllustrationNode[] {
  const [bx, by] = typeof bezel === "number" ? [bezel, bezel] : bezel;
  return [
    { part: "screen", tag: "rect", tone: "ink", attrs: { x, y, width, height, rx: radius } },
    {
      tag: "rect",
      tone: "paper",
      attrs: {
        x: x + bx,
        y: y + by,
        width: width - 2 * bx,
        height: height - 2 * by,
        rx: radius - 8,
      },
    },
  ];
}

export interface PersonOptions {
  /** Center of the head. The feet stand on the ground line (y 320). Default 240. */
  x?: number | undefined;
  /** `point`: the right hand forward at shoulder height (holds a tool, points at a screen); `wave`: raised. Default `point`. */
  pose?: "point" | "wave" | undefined;
  skin?: IllustrationSkinTone | undefined;
  /** Shirt and sleeves. Default `main`. */
  shirt?: IllustrationBrandTone | undefined;
  /** `short`, `bun` (short with a bun on top) or `long` (falls behind the shoulders). Default `short`. */
  hair?: "short" | "bun" | "long" | undefined;
}

/**
 * A standing person, front view, about 6 heads tall (head 36, feet at y 314): `ink` trousers,
 * shoes and hair, the shirt in a brand tone, skin from the skin tones.
 */
/* @__NO_SIDE_EFFECTS__ */
export function person({
  x = 240,
  pose = "point",
  skin = "skin-medium",
  shirt = "main",
  hair = "short",
}: PersonOptions = {}): IllustrationNode {
  const limb = (tone: IllustrationTone, stroke: number, d: string): IllustrationNode => ({
    tag: "path",
    tone,
    stroke,
    attrs: { d },
  });
  const hand = (cx: number, cy: number): IllustrationNode => ({
    tag: "circle",
    tone: skin,
    attrs: { cx, cy, r: 6 },
  });
  const wave = pose === "wave";
  const [ex, ey, hx, hy] = wave ? [x + 44, 188, x + 52, 144] : [x + 46, 180, x + 74, 162];
  const nodes: IllustrationNode[] = [
    limb("ink", 17, `M${x - 10} 228L${x - 13} 308`),
    limb("ink", 17, `M${x + 10} 228L${x + 13} 308`),
    { tag: "rect", tone: "ink", attrs: { x: x - 23, y: 216, width: 46, height: 26, rx: 8 } },
    { tag: "ellipse", tone: "ink", attrs: { cx: x - 17, cy: 314, rx: 14, ry: 6 } },
    { tag: "ellipse", tone: "ink", attrs: { cx: x + 17, cy: 314, rx: 14, ry: 6 } },
    limb(skin, 10, `M${x - 33} 204L${x - 35} 236`),
    limb(shirt, 14, `M${x - 24} 172L${x - 33} 206`),
    hand(x - 35, 240),
    limb(skin, 10, `M${ex} ${ey}L${hx} ${hy}`),
    limb(shirt, 14, `M${x + 24} 172L${ex} ${ey}`),
    hand(hx, hy),
    {
      tag: "path",
      tone: shirt,
      attrs: { d: `M${x - 29} 180q0-18 16-18h26q16 0 16 18l-5 44h-48Z` },
    },
    { tag: "rect", tone: skin, attrs: { x: x - 6, y: 148, width: 12, height: 16, rx: 4 } },
    { tag: "path", tone: "shade", attrs: { d: `M${x - 6} 156h12v8h-12Z` } },
    { tag: "circle", tone: skin, attrs: { cx: x, cy: 136, r: 18 } },
  ];
  if (hair === "bun")
    nodes.push({ tag: "circle", tone: "ink", attrs: { cx: x + 4, cy: 112, r: 10 } });
  if (hair === "long")
    nodes.unshift({
      tag: "path",
      tone: "ink",
      attrs: { d: `M${x - 21} 134c-2 26 2 46 -4 58h50c-6-12-2-32-4-58Z` },
    });
  nodes.push({
    tag: "path",
    tone: "ink",
    attrs: { d: `M${x - 19} 138c-4-20 8-32 22-31 14 1 21 12 16 26-6-9-16-12-38 5Z` },
  });
  return { part: "person", tag: "g", attrs: {}, children: nodes };
}
