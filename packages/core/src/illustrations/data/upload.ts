import type { Illustration } from "../../illustration/illustration.js";
import { dot, groundShadow, paper } from "../parts.js";

/**
 * Upload: an open folder with two pages and an arrow (the Upload drop zone). Original artwork
 * (MIT). Drawn on a 200 × 150 grid scaled to the canvas; no backdrop, because the drop zone
 * paints its own surface.
 */
export const upload: Illustration = {
  name: "upload",
  viewBox: "0 0 480 360",
  nodes: [
    {
      tag: "g",
      attrs: { transform: "scale(2.4)" },
      children: [
        groundShadow({ cx: 100, cy: 138, rx: 76, ry: 7 }),
        dot(26, 34, 5),
        dot(176, 26, 4),
        dot(184, 96, 3),
        dot(14, 104, 3),
        {
          tag: "path",
          tone: "dark",
          attrs: {
            d: "M38 44h42l10 12h72a8 8 0 0 1 8 8v58a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8V52a8 8 0 0 1 8-8Z",
          },
        },
        ...paper({
          x: 58,
          y: 18,
          width: 62,
          height: 78,
          radius: 6,
          outline: 1,
          lines: { x: 68, y: 34, lengths: [34, 42, 26], gap: 10, width: 4 },
          transform: "rotate(-8 88 60)",
        }),
        ...paper({
          x: 88,
          y: 16,
          width: 62,
          height: 78,
          radius: 6,
          outline: 1,
          lines: { x: 98, y: 32, lengths: [40, 30, 36], gap: 10, width: 4 },
          transform: "rotate(7 118 56)",
        }),
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
