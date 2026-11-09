import type { Illustration } from "../../illustration/illustration.js";
import { backdrop, cloud, dot, sparkle } from "../parts.js";

/** Coming soon: a rocket taking off above the clouds. Original artwork (MIT). */
export const comingSoon: Illustration = {
  name: "coming-soon",
  viewBox: "0 0 480 360",
  nodes: [
    backdrop(),
    sparkle(90, 80, 12),
    sparkle(400, 120, 9),
    sparkle(150, 190, 7, "light"),
    dot(360, 50, 5),
    dot(420, 210, 4, "accent-light"),
    dot(70, 150, 4),
    {
      tag: "g",
      attrs: { transform: "translate(250 168) rotate(36)" },
      children: [
        {
          tag: "path",
          tone: "accent-main",
          attrs: { d: "M-26 44c0 40 26 58 26 84 0-26 26-44 26-84Z" },
        },
        {
          tag: "path",
          tone: "accent-light",
          attrs: { d: "M-12 44c0 24 12 34 12 50 0-16 12-26 12-50Z" },
        },
        { tag: "path", tone: "dark", attrs: { d: "M-38 4-70 56l34-6Z" } },
        { tag: "path", tone: "dark", attrs: { d: "M38 4l32 52-34-6Z" } },
        {
          tag: "path",
          tone: "paper",
          attrs: { d: "M0-112c42 30 50 92 40 156h-80c-10-64-2-126 40-156Z" },
        },
        {
          tag: "path",
          tone: "outline",
          stroke: 3,
          attrs: { d: "M0-112c42 30 50 92 40 156h-80c-10-64-2-126 40-156Z" },
        },
        {
          tag: "path",
          tone: "main",
          attrs: { d: "M0-112c22 16 34 38 39 62h-78c5-24 17-46 39-62Z" },
        },
        { tag: "circle", tone: "main", attrs: { cx: 0, cy: 0, r: 19 } },
        { tag: "circle", tone: "lighter", attrs: { cx: 0, cy: 0, r: 12 } },
        { tag: "rect", tone: "main", attrs: { x: -40, y: 40, width: 80, height: 10, rx: 5 } },
      ],
    },
    // Sky scene: a bank of clouds on the ground line replaces the ground shadow.
    cloud(40, 330, 1.6),
    cloud(170, 340, 2),
    cloud(330, 332, 1.5),
  ],
};
