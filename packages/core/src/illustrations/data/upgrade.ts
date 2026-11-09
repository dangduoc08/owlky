import type { Illustration } from "../../illustration/illustration.js";

/** Upgrade: a gem on a pedestal with sparkles. Original artwork (MIT). */
export const upgrade: Illustration = {
  name: "upgrade",
  viewBox: "0 0 480 360",
  nodes: [
    {
      tag: "path",
      tone: "main",
      attrs: {
        d: "M86 122C118 62 200 30 282 44c80 14 136 64 142 136 6 72-46 124-134 136-86 12-176-4-214-62-36-56-24-96 10-132Z",
        opacity: 0.08,
      },
    },
    { tag: "ellipse", tone: "shadow", attrs: { cx: 240, cy: 320, rx: 190, ry: 12 } },
    { tag: "rect", tone: "neutral", attrs: { x: 160, y: 244, width: 160, height: 76, rx: 10 } },
    {
      tag: "rect",
      tone: "outline",
      stroke: 3,
      attrs: { x: 160, y: 244, width: 160, height: 76, rx: 10 },
    },
    { tag: "rect", tone: "neutral", attrs: { x: 148, y: 230, width: 184, height: 22, rx: 8 } },
    {
      tag: "rect",
      tone: "outline",
      stroke: 3,
      attrs: { x: 148, y: 230, width: 184, height: 22, rx: 8 },
    },
    { tag: "polygon", tone: "light", attrs: { points: "190,92 290,92 326,132 154,132" } },
    { tag: "polygon", tone: "lighter", attrs: { points: "190,92 214,132 240,92" } },
    { tag: "polygon", tone: "lighter", attrs: { points: "240,92 266,132 290,92" } },
    { tag: "polygon", tone: "main", attrs: { points: "154,132 326,132 240,214" } },
    { tag: "polygon", tone: "dark", attrs: { points: "214,132 266,132 240,214" } },
    { tag: "path", tone: "main", stroke: 6, attrs: { d: "M110 220v-50m-14 14 14-14 14 14" } },
    { tag: "path", tone: "light", stroke: 6, attrs: { d: "M372 200v-40m-12 12 12-12 12 12" } },
    {
      tag: "path",
      tone: "accent-main",
      attrs: { d: "M150 62Q150 74 162 74Q150 74 150 86Q150 74 138 74Q150 74 150 62Z" },
    },
    {
      tag: "path",
      tone: "accent-main",
      attrs: { d: "M340 46Q340 60 354 60Q340 60 340 74Q340 60 326 60Q340 60 340 46Z" },
    },
    {
      tag: "path",
      tone: "light",
      attrs: { d: "M372 113Q372 120 379 120Q372 120 372 127Q372 120 365 120Q372 120 372 113Z" },
    },
    { tag: "circle", tone: "accent-light", attrs: { cx: 112, cy: 120, r: 5 } },
  ],
};
