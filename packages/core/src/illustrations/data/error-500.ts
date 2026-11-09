import type { Illustration } from "../../illustration/illustration.js";

/** Server error: a monitor showing 500, with smoke and sparks. Original artwork (MIT). */
export const error500: Illustration = {
  name: "error-500",
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
    { tag: "path", tone: "grey-600", attrs: { d: "M222 236h36l14 58h-64Z" } },
    { tag: "rect", tone: "ink", attrs: { x: 176, y: 288, width: 128, height: 14, rx: 7 } },
    { tag: "rect", tone: "ink", attrs: { x: 104, y: 62, width: 272, height: 178, rx: 18 } },
    { tag: "rect", tone: "paper", attrs: { x: 118, y: 76, width: 244, height: 150, rx: 10 } },
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
    {
      tag: "path",
      tone: "accent-main",
      attrs: { d: "M84 92Q84 104 96 104Q84 104 84 116Q84 104 72 104Q84 104 84 92Z" },
    },
    {
      tag: "path",
      tone: "accent-main",
      attrs: { d: "M410 191Q410 200 419 200Q410 200 410 209Q410 200 401 200Q410 200 410 191Z" },
    },
    { tag: "path", tone: "ink", stroke: 6, attrs: { d: "M272 292c40 0 60 8 92 20s50 8 72-2" } },
    { tag: "circle", tone: "light", attrs: { cx: 70, cy: 250, r: 5 } },
  ],
};
