import type { Illustration } from "../../illustration/illustration.js";

/** Upload: an open folder with two pages and an arrow (the Upload drop zone). Original artwork (MIT). */
export const upload: Illustration = {
  name: "upload",
  viewBox: "0 0 480 360",
  nodes: [
    {
      tag: "g",
      attrs: { transform: "scale(2.4)" },
      children: [
        { tag: "ellipse", tone: "shadow", attrs: { cx: 100, cy: 138, rx: 76, ry: 7 } },
        { tag: "circle", tone: "light", attrs: { cx: 26, cy: 34, r: 5 } },
        { tag: "circle", tone: "light", attrs: { cx: 176, cy: 26, r: 4 } },
        { tag: "circle", tone: "light", attrs: { cx: 184, cy: 96, r: 3 } },
        { tag: "circle", tone: "light", attrs: { cx: 14, cy: 104, r: 3 } },
        {
          tag: "path",
          tone: "dark",
          attrs: {
            d: "M38 44h42l10 12h72a8 8 0 0 1 8 8v58a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8V52a8 8 0 0 1 8-8Z",
          },
        },
        {
          tag: "g",
          attrs: { transform: "rotate(-8 88 60)" },
          children: [
            { tag: "rect", tone: "paper", attrs: { x: 58, y: 18, width: 62, height: 78, rx: 6 } },
            {
              tag: "rect",
              tone: "outline",
              stroke: 1,
              attrs: { x: 58, y: 18, width: 62, height: 78, rx: 6 },
            },
            { tag: "path", tone: "line", stroke: 4, attrs: { d: "M68 34h34M68 44h42M68 54h26" } },
          ],
        },
        {
          tag: "g",
          attrs: { transform: "rotate(7 118 56)" },
          children: [
            { tag: "rect", tone: "paper", attrs: { x: 88, y: 16, width: 62, height: 78, rx: 6 } },
            {
              tag: "rect",
              tone: "outline",
              stroke: 1,
              attrs: { x: 88, y: 16, width: 62, height: 78, rx: 6 },
            },
            { tag: "path", tone: "line", stroke: 4, attrs: { d: "M98 32h40M98 42h30M98 52h36" } },
          ],
        },
        {
          tag: "path",
          tone: "main",
          attrs: {
            d: "M26 78a8 8 0 0 1 8-8h132a8 8 0 0 1 8 8l-6 46a8 8 0 0 1-8 7H40a8 8 0 0 1-8-7Z",
          },
        },
        { tag: "circle", tone: "light", attrs: { cx: 100, cy: 104, r: 13 } },
        { tag: "path", tone: "darker", stroke: 3, attrs: { d: "M100 112v-15m-6 6 6-6 6 6" } },
      ],
    },
  ],
};
