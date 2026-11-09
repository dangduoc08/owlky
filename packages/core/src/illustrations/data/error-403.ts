import type { Illustration, IllustrationNode } from "../../illustration/illustration.js";
import { backdrop, dot, groundShadow, sparkle } from "../parts.js";

/** One slanted stripe of the barrier. */
const stripe = (x: number): IllustrationNode => ({
  tag: "path",
  tone: "ink",
  attrs: { d: `M${x} 250h22l-18 30h-22Z` },
});

/** Access denied: a shield with a padlock behind a barrier. Original artwork (MIT). */
export const error403: Illustration = {
  name: "error-403",
  viewBox: "0 0 480 360",
  nodes: [
    backdrop(),
    groundShadow(),
    {
      tag: "path",
      tone: "main",
      attrs: { d: "M240 52 330 86v80c0 66-38 106-90 130-52-24-90-64-90-130V86Z" },
    },
    { tag: "path", tone: "dark", attrs: { d: "M240 52 330 86v80c0 66-38 106-90 130Z" } },
    { tag: "path", tone: "white", stroke: 10, attrs: { d: "M220 166v-18a20 20 0 0 1 40 0v18" } },
    { tag: "rect", tone: "white", attrs: { x: 204, y: 162, width: 72, height: 58, rx: 12 } },
    { tag: "circle", tone: "darker", attrs: { cx: 240, cy: 186, r: 8 } },
    { tag: "rect", tone: "darker", attrs: { x: 236, y: 188, width: 8, height: 18, rx: 4 } },
    { tag: "rect", tone: "grey-600", attrs: { x: 120, y: 262, width: 12, height: 56, rx: 4 } },
    { tag: "rect", tone: "grey-600", attrs: { x: 348, y: 262, width: 12, height: 56, rx: 4 } },
    { tag: "rect", tone: "accent-main", attrs: { x: 92, y: 250, width: 296, height: 30, rx: 8 } },
    ...[116, 164, 212, 260, 308, 356].map(stripe),
    sparkle(98, 112, 10, "light"),
    sparkle(392, 150, 12),
    dot(380, 80, 5, "accent-light"),
    dot(84, 200, 4),
  ],
};
