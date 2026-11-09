import type { Illustration, IllustrationNode } from "../../illustration/illustration.js";
import { backdrop, dot, groundShadow, person, screen, sparkle } from "../parts.js";

/** One hidden character of the password field. */
const bullet = (cx: number): IllustrationNode => ({
  tag: "circle",
  tone: "grey-500",
  attrs: { cx, cy: 189, r: 3 },
});

/** Sign in: a person next to a phone with a sign-in form and a shield. Original artwork (MIT). */
export const signIn: Illustration = {
  name: "sign-in",
  viewBox: "0 0 480 360",
  nodes: [
    backdrop(),
    groundShadow(),
    ...screen({ x: 236, y: 44, width: 150, height: 266, radius: 24, bezel: [10, 12] }),
    { tag: "rect", tone: "ink", attrs: { x: 291, y: 62, width: 40, height: 8, rx: 4 } },
    { tag: "circle", tone: "lighter", attrs: { cx: 311, cy: 108, r: 20 } },
    { tag: "circle", tone: "main", attrs: { cx: 311, cy: 102, r: 8 } },
    { tag: "path", tone: "main", attrs: { d: "M297 124a14 12 0 0 1 28 0Z" } },
    { tag: "rect", tone: "neutral", attrs: { x: 264, y: 146, width: 94, height: 22, rx: 6 } },
    { tag: "rect", tone: "neutral", attrs: { x: 264, y: 178, width: 94, height: 22, rx: 6 } },
    ...[276, 288, 300, 312, 324].map(bullet),
    { tag: "rect", tone: "main", attrs: { x: 264, y: 218, width: 94, height: 26, rx: 8 } },
    { tag: "path", tone: "line", stroke: 6, attrs: { d: "M286 266h50" } },
    {
      tag: "path",
      tone: "main",
      attrs: { d: "M400 70l40 14v32c0 26-16 42-40 52-24-10-40-26-40-52V84Z" },
    },
    { tag: "path", tone: "dark", attrs: { d: "M400 70l40 14v32c0 26-16 42-40 52Z" } },
    { tag: "path", tone: "white", stroke: 7, attrs: { d: "M386 116l10 10 18-20" } },
    person({ x: 150, skin: "skin-deep", shirt: "main", hair: "bun" }),
    sparkle(80, 90, 10),
    dot(200, 50, 5),
  ],
};
