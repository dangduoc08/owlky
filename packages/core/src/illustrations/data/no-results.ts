import type { Illustration } from "../../illustration/illustration.js";
import { backdrop, dot, groundShadow, lines, paper, sparkle } from "../parts.js";

/** No results: a magnifying glass over an empty list. Original artwork (MIT). */
export const noResults: Illustration = {
  name: "no-results",
  viewBox: "0 0 480 360",
  nodes: [
    backdrop(),
    groundShadow(),
    {
      tag: "g",
      attrs: { transform: "rotate(-6 200 190)" },
      children: [
        { tag: "rect", tone: "neutral", attrs: { x: 112, y: 70, width: 180, height: 220, rx: 16 } },
      ],
    },
    ...paper({ x: 124, y: 66, width: 180, height: 226, radius: 16 }),
    { tag: "circle", tone: "lighter", attrs: { cx: 156, cy: 104, r: 14 } },
    lines({ x: 184, y: 98, lengths: [88, 52], gap: 18, width: 10 }),
    lines({ x: 148, y: 160, lengths: [132, 96, 120, 70], gap: 26, width: 10 }),
    { tag: "circle", tone: "main", attrs: { cx: 318, cy: 178, r: 58, opacity: 0.12 } },
    {
      tag: "path",
      tone: "main",
      stroke: 18,
      attrs: { d: "M318 120a58 58 0 1 1 0 116 58 58 0 1 1 0-116Z" },
    },
    { tag: "path", tone: "ink", stroke: 22, attrs: { d: "M362 224l44 44" } },
    { tag: "path", tone: "dark", stroke: 10, attrs: { d: "M302 162l32 32M334 162l-32 32" } },
    sparkle(410, 96, 10),
    dot(84, 120, 5),
    dot(92, 270, 4, "accent-light"),
  ],
};
