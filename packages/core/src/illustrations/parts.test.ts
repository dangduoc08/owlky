import { describe, expect, it } from "vitest";
import {
  type IllustrationNode,
  illustrationNodeAttributes,
  illustrationTones,
} from "../illustration/illustration.js";
import * as entry from "./index.js";
import {
  backdrop,
  cloud,
  dot,
  groundShadow,
  illustrationParts,
  lines,
  paper,
  person,
  plant,
  screen,
  sparkle,
} from "./parts.js";

const walk = (nodes: readonly IllustrationNode[], visit: (node: IllustrationNode) => void) => {
  for (const node of nodes) {
    visit(node);
    if (node.children) walk(node.children, visit);
  }
};

/** Every variant of every part. */
const samples: Record<string, IllustrationNode[]> = {
  backdrop: [backdrop()],
  groundShadow: [groundShadow(), groundShadow({ cx: 100, cy: 138, rx: 76, ry: 7 })],
  sparkle: [sparkle(90, 80, 12), sparkle(150, 190, 7, "light")],
  dot: [dot(360, 50, 5), dot(420, 210, 4, "accent-light")],
  cloud: [cloud(40, 330), cloud(170, 340, 1.9)],
  plant: [plant(442, 292)],
  lines: [lines({ x: 10, y: 20, lengths: [30, 40] })],
  paper: [
    ...paper({ x: 1, y: 2, width: 3, height: 4, radius: 5 }),
    ...paper({
      x: 1,
      y: 2,
      width: 3,
      height: 4,
      radius: 5,
      tone: "neutral",
      transform: "rotate(5)",
    }),
  ],
  screen: [
    ...screen({ x: 104, y: 62, width: 272, height: 178, radius: 18 }),
    ...screen({ x: 236, y: 44, width: 150, height: 266, radius: 24, bezel: [10, 12] }),
  ],
  person: [
    person(),
    person({ x: 130, pose: "wave", skin: "skin-light", shirt: "dark", hair: "long" }),
    person({ hair: "bun" }),
  ],
};

describe("illustration parts", () => {
  it("are exported from @owlky/core/illustrations", () => {
    for (const name of [
      "backdrop",
      "groundShadow",
      "sparkle",
      "dot",
      "cloud",
      "plant",
      "lines",
      "paper",
      "screen",
      "person",
    ])
      expect(entry).toHaveProperty(name);
    expect(entry.illustrationParts).toBe(illustrationParts);
  });

  it.each(Object.entries(samples))(
    "%s: valid nodes, a known part name, nothing rendered from it",
    (_, nodes) => {
      const roots = nodes.filter((node) => node.part !== undefined);
      expect(roots.length).toBeGreaterThan(0);
      for (const root of roots) expect(illustrationParts).toContain(root.part);
      walk(nodes, (node) => {
        const written = illustrationNodeAttributes(node);
        // `part` never reaches the DOM; every geometry value passes the safety filter.
        expect(Object.keys(written)).not.toContain("part");
        for (const name of Object.keys(node.attrs ?? {})) expect(written).toHaveProperty(name);
        if (node.tag !== "g") expect(illustrationTones).toContain(node.tone);
      });
    },
  );

  it("draw the shapes the pictures share", () => {
    expect(backdrop().attrs?.opacity).toBe(0.08);
    expect(groundShadow().attrs).toEqual({ cx: 240, cy: 320, rx: 190, ry: 12 });
    expect(sparkle(90, 80, 12).attrs?.d).toBe(
      "M90 68Q90 80 102 80Q90 80 90 92Q90 80 78 80Q90 80 90 68Z",
    );
    expect(sparkle(1, 1, 1).tone).toBe("accent-main");
    expect(dot(1, 1, 1).tone).toBe("light");
    // Clouds keep one shape at every scale (round numbers, two decimals at most).
    expect(cloud(64, 92, 0.9).attrs?.d).toBe(
      "M64 92h63a16.2 16.2 0 0 0 0-32.4a23.4 23.4 0 0 0-43.2-9a18 18 0 0 0-30.6 12.6a14.4 14.4 0 0 0 10.8 28.8Z",
    );
    expect(cloud(0, 0).attrs?.d).toBe(
      "M0 0h70a18 18 0 0 0 0-36a26 26 0 0 0-48-10a20 20 0 0 0-34 14a16 16 0 0 0 12 32Z",
    );
    expect(lines({ x: 10, y: 20, lengths: [30, 40] })).toEqual({
      part: "lines",
      tag: "path",
      tone: "line",
      stroke: 6,
      attrs: { d: "M10 20h30M10 40h40" },
    });
  });

  it("paper: fill and outline, optional lines, grouped when transformed", () => {
    const flat = paper({ x: 1, y: 2, width: 3, height: 4, radius: 5 });
    expect(flat.map((node) => [node.tag, node.tone, node.stroke])).toEqual([
      ["rect", "paper", undefined],
      ["rect", "outline", 3],
    ]);
    const turned = paper({
      x: 1,
      y: 2,
      width: 3,
      height: 4,
      radius: 5,
      tone: "neutral",
      outline: 1,
      lines: { x: 1, y: 1, lengths: [2], gap: 10, width: 4 },
      transform: "rotate(5)",
    });
    expect(turned).toHaveLength(1);
    expect(turned[0]?.attrs).toEqual({ transform: "rotate(5)" });
    expect(turned[0]?.children?.map((node) => [node.tone, node.stroke])).toEqual([
      ["neutral", undefined],
      ["outline", 1],
      ["line", 4],
    ]);
  });

  it("screen: an ink frame around a paper screen 8 rounder inside", () => {
    const [frame, inner] = screen({
      x: 236,
      y: 44,
      width: 150,
      height: 266,
      radius: 24,
      bezel: [10, 12],
    });
    expect(frame?.tone).toBe("ink");
    expect(inner?.attrs).toEqual({ x: 246, y: 56, width: 130, height: 242, rx: 16 });
    const [, square] = screen({ x: 0, y: 0, width: 100, height: 80, radius: 18 });
    expect(square?.attrs).toEqual({ x: 14, y: 14, width: 72, height: 52, rx: 10 });
  });

  it("person: poses, hair and tones", () => {
    const tones = (node: IllustrationNode) => node.children?.map((child) => child.tone);
    const standing = person();
    expect(standing.children).toHaveLength(16);
    expect(tones(standing)).toContain("skin-medium");
    expect(tones(standing)).toContain("main");
    // Pointing: the right hand at shoulder height; waving: raised.
    const hands = (node: IllustrationNode) =>
      node.children?.filter((child) => child.tag === "circle" && child.attrs?.r === 6);
    expect(hands(standing)?.[1]?.attrs).toEqual({ cx: 314, cy: 162, r: 6 });
    const waving = person({ x: 130, pose: "wave", hair: "long", skin: "skin-deep", shirt: "dark" });
    expect(hands(waving)?.[1]?.attrs).toEqual({ cx: 182, cy: 144, r: 6 });
    // Long hair falls behind the body (drawn first); a bun sits on top of the head.
    expect(waving.children?.[0]?.attrs?.d).toMatch(/^M109 134c/);
    expect(tones(waving)).toContain("skin-deep");
    const bun = person({ hair: "bun" });
    expect(bun.children?.at(-2)).toEqual({
      tag: "circle",
      tone: "ink",
      attrs: { cx: 244, cy: 112, r: 10 },
    });
  });

  it("plant: three leaves and a pot under them", () => {
    const { children } = plant(442, 292);
    expect(children?.map((node) => node.tone)).toEqual(["light", "main", "dark", "ink"]);
    expect(children?.[3]?.attrs?.d).toBe("M422 286h40l-6 34h-28Z");
    expect(children?.[0]?.attrs?.transform).toBe("translate(442 292) rotate(-32)");
  });

  it("unsafe input (outside the types) never reaches the markup", () => {
    const star = sparkle('0"/><script>alert(1)</script>' as unknown as number, 0, 1);
    expect(illustrationNodeAttributes(star)).not.toHaveProperty("d");
    const spot = dot(1, 1, 1, "url(#x)" as never);
    expect(illustrationNodeAttributes(spot)).not.toHaveProperty("data-ok-tone");
    const sheet = paper({ x: 0, y: 0, width: 1, height: 1, radius: 0, transform: "url(evil)" });
    expect(illustrationNodeAttributes(sheet[0] as IllustrationNode)).not.toHaveProperty(
      "transform",
    );
  });
});
