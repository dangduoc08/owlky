import type { Illustration } from "../../illustration/illustration.js";
import { backdrop, dot, groundShadow, screen, sparkle } from "../parts.js";

/** Server error: a monitor showing 500, with smoke and sparks. Original artwork (MIT). */
export const error500: Illustration = {
  name: "error-500",
  viewBox: "0 0 480 360",
  nodes: [
    backdrop(),
    groundShadow(),
    { tag: "path", tone: "grey-600", attrs: { d: "M222 236h36l14 58h-64Z" } },
    { tag: "rect", tone: "ink", attrs: { x: 176, y: 288, width: 128, height: 14, rx: 7 } },
    ...screen({ x: 104, y: 62, width: 272, height: 178, radius: 18 }),
    {
      tag: "g",
      attrs: { transform: "translate(142 106) scale(0.6)" },
      children: [
        {
          tag: "path",
          tone: "main",
          stroke: 26,
          attrs: {
            d: "M80 0H12L6 62c8-6 18-10 32-10 28 0 46 20 46 46s-20 50-46 50c-18 0-30-6-38-18",
          },
        },
        {
          tag: "rect",
          tone: "main",
          stroke: 26,
          attrs: { x: 124, y: 0, width: 80, height: 150, rx: 40 },
        },
        {
          tag: "rect",
          tone: "main",
          stroke: 26,
          attrs: { x: 244, y: 0, width: 80, height: 150, rx: 40 },
        },
      ],
    },
    { tag: "path", tone: "accent-main", stroke: 6, attrs: { d: "M346 76l-14 26 12 8-16 26" } },
    { tag: "circle", tone: "neutral", attrs: { cx: 368, cy: 64, r: 18 } },
    { tag: "circle", tone: "neutral", attrs: { cx: 394, cy: 46, r: 24 } },
    { tag: "circle", tone: "neutral", attrs: { cx: 420, cy: 70, r: 14 } },
    sparkle(84, 104, 12),
    sparkle(410, 200, 9),
    { tag: "path", tone: "ink", stroke: 6, attrs: { d: "M272 292c40 0 60 8 92 20s50 8 72-2" } },
    dot(70, 250, 5),
  ],
};
