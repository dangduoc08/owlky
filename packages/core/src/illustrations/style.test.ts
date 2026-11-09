/*
 * Style rules of the illustration set (docs/illustrations-style.md): every scene must follow them,
 * so a new picture that breaks the guide fails here. `styleViolations` lists what a picture breaks;
 * the last tests prove that it catches each rule.
 */
import { describe, expect, it } from "vitest";
import type { Illustration, IllustrationNode } from "../illustration/illustration.js";
import { illustrations } from "./index.js";
import { backdrop, cloud, dot, groundShadow, person, sparkle } from "./parts.js";

/** Limits from the guide (measured on the first 16 pictures, with some headroom). */
const STYLE = {
  canvas: "0 0 480 360",
  /** Every node, groups included (measured: 15 to 40). */
  maxNodes: 48,
  /** Four-point stars (`sparkle()`) and round sparkles (`dot()`), each and together. */
  maxSparkles: 4,
  maxDots: 4,
  sparklesAndDots: [2, 6],
  /** Share of shapes in accent tones (measured: 0 to 26%). */
  maxAccentShare: 0.3,
  /** Share of shapes in brand tones (measured: 22 to 67%). */
  minBrandShare: 0.2,
  /** Effective outline width (`outline` tone), after group scales. */
  outlineWidth: [2, 3],
  /** No hairlines: the thinnest effective stroke. */
  minStroke: 2,
  /** A sky scene's cloud bank sits on the ground line: its base at y ≥ this. */
  groundLine: 300,
} as const;

/** Art composed into a component that paints its own surface (the Upload drop zone). */
const NO_BACKDROP = new Set(["upload"]);

const BRAND = new Set(["lighter", "light", "main", "dark", "darker"]);
const STAR = /^M-?[\d.]+ -?[\d.]+Q/;

interface Visit {
  node: IllustrationNode;
  /** Product of the `scale()`s of the groups above. */
  scale: number;
  /** The part this node belongs to (the nearest part above it, itself included). */
  inPart: string | undefined;
  depth: number;
}

function visit(nodes: readonly IllustrationNode[]): Visit[] {
  const out: Visit[] = [];
  const walk = (
    list: readonly IllustrationNode[],
    scale: number,
    inPart: string | undefined,
    depth: number,
  ) => {
    for (const node of list) {
      const part = node.part ?? inPart;
      out.push({ node, scale, inPart: part, depth });
      if (node.children) {
        const match = /scale\(([\d.]+)\)/.exec(String(node.attrs?.transform ?? ""));
        walk(node.children, scale * (match ? Number(match[1]) : 1), part, depth + 1);
      }
    }
  };
  walk(nodes, 1, undefined, 0);
  return out;
}

/** What a scene breaks in the guide (empty: it follows the guide). */
function styleViolations(item: Illustration): string[] {
  const problems: string[] = [];
  if (item.viewBox !== STYLE.canvas) problems.push(`viewBox ${item.viewBox}`);
  const all = visit(item.nodes);
  const parts = (name: string) => all.filter(({ node }) => node.part === name);
  const shapes = all.filter(({ node }) => node.tag !== "g");

  if (all.length > STYLE.maxNodes) problems.push(`${all.length} nodes (max ${STYLE.maxNodes})`);

  // Composition: one backdrop, drawn first; one ground (shadow, or a cloud bank in the sky).
  const backdrops = parts("backdrop");
  if (!NO_BACKDROP.has(item.name)) {
    if (backdrops.length !== 1) problems.push(`${backdrops.length} backdrops (exactly 1)`);
    else if (item.nodes[0] !== backdrops[0]?.node) problems.push("backdrop is not drawn first");
  }
  const shadows = parts("ground-shadow");
  const groundClouds = parts("cloud").filter(
    ({ node }) =>
      Number(/^M-?[\d.]+ (-?[\d.]+)/.exec(String(node.attrs?.d))?.[1]) >= STYLE.groundLine,
  );
  if (shadows.length > 1) problems.push(`${shadows.length} ground shadows (exactly 1)`);
  if (shadows.length === 0 && groundClouds.length === 0)
    problems.push("no ground: a ground shadow, or clouds on the ground line");
  const firstShape = shapes.find(({ node }) => node.part !== "backdrop");
  if (shadows.length === 1 && firstShape?.node !== shadows[0]?.node)
    problems.push("ground shadow is not drawn behind every other shape");

  // Sparkles.
  const sparkles = parts("sparkle").length;
  const dots = parts("dot").length;
  if (sparkles > STYLE.maxSparkles)
    problems.push(`${sparkles} sparkles (max ${STYLE.maxSparkles})`);
  if (dots > STYLE.maxDots) problems.push(`${dots} dots (max ${STYLE.maxDots})`);
  const [low, high] = STYLE.sparklesAndDots;
  if (sparkles + dots < low || sparkles + dots > high)
    problems.push(`${sparkles + dots} sparkles and dots (${low} to ${high})`);

  // Shared details come from the parts, never redrawn by hand.
  for (const { node, inPart } of shapes) {
    if (inPart) continue;
    const d = String(node.attrs?.d ?? "");
    if (node.tag === "path" && STAR.test(d)) problems.push(`hand-drawn star ${d}: use sparkle()`);
    if (node.tone === "shadow") problems.push("hand-drawn shadow: use groundShadow()");
    if (node.tag === "path" && node.attrs?.opacity === 0.08)
      problems.push("hand-drawn backdrop: use backdrop()");
    if (node.tone?.startsWith("skin-")) problems.push("skin outside a person(): use person()");
  }

  // Palette balance.
  const share = (test: (tone: string) => boolean) =>
    shapes.filter(({ node }) => test(node.tone ?? "")).length / shapes.length;
  const accent = share((tone) => tone.startsWith("accent-"));
  if (accent > STYLE.maxAccentShare)
    problems.push(
      `accent tones on ${Math.round(accent * 100)}% of shapes (max ${STYLE.maxAccentShare * 100}%)`,
    );
  const brand = share((tone) => BRAND.has(tone));
  if (brand < STYLE.minBrandShare)
    problems.push(
      `brand tones on ${Math.round(brand * 100)}% of shapes (min ${STYLE.minBrandShare * 100}%)`,
    );

  // Strokes: no hairlines, outlines all the same weight.
  for (const { node, scale } of shapes) {
    if (node.stroke === undefined) continue;
    const width = Math.round(node.stroke * scale * 100) / 100;
    if (width < STYLE.minStroke) problems.push(`stroke ${width} (min ${STYLE.minStroke})`);
    const [thin, thick] = STYLE.outlineWidth;
    if (node.tone === "outline" && (width < thin || width > thick))
      problems.push(`outline ${width} (${thin} to ${thick})`);
  }
  return problems;
}

const scenes = illustrations.filter((item) => !item.name.endsWith("-shape"));

describe("illustration style rules", () => {
  it.each(scenes.map((item) => [item.name, item] as const))("%s follows the guide", (_, item) => {
    expect(styleViolations(item)).toEqual([]);
  });

  it("covers every scene of the set", () => {
    expect(scenes.length).toBe(illustrations.length - 1);
  });
});

/** A scene that follows the guide, then variants that each break one rule. */
const base = (nodes: IllustrationNode[]): Illustration => ({
  name: "test",
  viewBox: STYLE.canvas,
  nodes,
});
const hero: IllustrationNode = {
  tag: "rect",
  tone: "main",
  attrs: { x: 180, y: 120, width: 120, height: 180, rx: 16 },
};
const good = () => [backdrop(), groundShadow(), hero, sparkle(90, 80, 10), dot(400, 100, 5)];

describe("styleViolations", () => {
  it("accepts a scene built from the parts", () => {
    expect(styleViolations(base(good()))).toEqual([]);
    // Sky scenes stand on clouds instead of a ground shadow.
    expect(
      styleViolations(
        base([backdrop(), hero, cloud(40, 330, 1.6), sparkle(90, 80, 10), dot(1, 1, 4)]),
      ),
    ).toEqual([]);
  });

  it("rejects another canvas, missing or extra backdrops and grounds", () => {
    expect(styleViolations({ ...base(good()), viewBox: "0 0 400 300" })).toEqual([
      "viewBox 0 0 400 300",
    ]);
    expect(styleViolations(base(good().slice(1)))).toContain("0 backdrops (exactly 1)");
    expect(styleViolations(base([backdrop(), ...good()]))).toContain("2 backdrops (exactly 1)");
    expect(
      styleViolations(base([groundShadow(), backdrop(), hero, sparkle(1, 1, 9), dot(1, 1, 3)])),
    ).toEqual(["backdrop is not drawn first"]);
    expect(
      styleViolations(base([backdrop(), hero, groundShadow(), sparkle(1, 1, 9), dot(1, 1, 3)])),
    ).toEqual(["ground shadow is not drawn behind every other shape"]);
    const noGround = good().filter((node) => node.part !== "ground-shadow");
    expect(styleViolations(base(noGround))).toEqual([
      "no ground: a ground shadow, or clouds on the ground line",
    ]);
    // A cloud in the sky is no ground.
    expect(styleViolations(base([...noGround, cloud(40, 120)]))).toEqual([
      "no ground: a ground shadow, or clouds on the ground line",
    ]);
    expect(styleViolations(base([...good(), groundShadow()]))).toContain(
      "2 ground shadows (exactly 1)",
    );
  });

  it("limits sparkles, nodes and the accent share", () => {
    const stars = [1, 2, 3, 4, 5].map((n) => sparkle(n * 60, 60, 8, "light"));
    expect(styleViolations(base([...good().slice(0, 3), ...stars]))).toEqual([
      "5 sparkles (max 4)",
    ]);
    const dots = [1, 2, 3, 4, 5].map((n) => dot(n * 60, 60, 4));
    expect(styleViolations(base([...good().slice(0, 3), ...dots]))).toEqual(["5 dots (max 4)"]);
    expect(styleViolations(base(good().slice(0, 4)))).toEqual(["1 sparkles and dots (2 to 6)"]);
    const many = Array.from({ length: 50 }, () => hero);
    expect(styleViolations(base([...good(), ...many]))).toEqual(["55 nodes (max 48)"]);
    const accents = Array.from(
      { length: 3 },
      (): IllustrationNode => ({ ...hero, tone: "accent-main" }),
    );
    expect(styleViolations(base([...good(), ...accents]))).toContain(
      "accent tones on 50% of shapes (max 30%)",
    );
    const greys = Array.from(
      { length: 12 },
      (): IllustrationNode => ({ ...hero, tone: "grey-600" }),
    );
    expect(styleViolations(base([...good(), ...greys]))).toContain(
      "brand tones on 18% of shapes (min 20%)",
    );
  });

  it("rejects hand-drawn copies of the parts", () => {
    const { part: _sparkle, ...star } = sparkle(90, 80, 10, "light");
    const { part: _shadow, ...shadow } = groundShadow();
    const { part: _backdrop, ...blob } = backdrop();
    expect(styleViolations(base([...good(), star]))).toEqual([
      "hand-drawn star M90 70Q90 80 100 80Q90 80 90 90Q90 80 80 80Q90 80 90 70Z: use sparkle()",
    ]);
    expect(styleViolations(base([...good(), shadow]))).toContain(
      "hand-drawn shadow: use groundShadow()",
    );
    expect(styleViolations(base([...good(), blob]))).toContain(
      "hand-drawn backdrop: use backdrop()",
    );
    expect(
      styleViolations(
        base([...good(), { tag: "circle", tone: "skin-deep", attrs: { cx: 1, cy: 1, r: 9 } }]),
      ),
    ).toEqual(["skin outside a person(): use person()"]);
    expect(styleViolations(base([...good(), person()]))).toEqual([]);
  });

  it("rejects hairlines and outlines of another weight, after group scales", () => {
    const outline = (stroke: number): IllustrationNode => ({ ...hero, tone: "outline", stroke });
    expect(styleViolations(base([...good(), outline(3)]))).toEqual([]);
    expect(styleViolations(base([...good(), outline(6)]))).toEqual(["outline 6 (2 to 3)"]);
    expect(
      styleViolations(
        base([...good(), { tag: "g", attrs: { transform: "scale(0.5)" }, children: [outline(3)] }]),
      ),
    ).toEqual(["stroke 1.5 (min 2)", "outline 1.5 (2 to 3)"]);
    // The Upload picture: outlines of 1 in a group scaled by 2.4.
    expect(
      styleViolations(
        base([...good(), { tag: "g", attrs: { transform: "scale(2.4)" }, children: [outline(1)] }]),
      ),
    ).toEqual([]);
  });
});
