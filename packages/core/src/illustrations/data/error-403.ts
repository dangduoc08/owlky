import type { Illustration } from "../../illustration/illustration.js";

/** Access denied: a shield with a padlock behind a barrier. Original artwork (MIT). */
export const error403: Illustration = {
  name: "error-403",
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
    { tag: "path", tone: "ink", attrs: { d: "M116 250h22l-18 30h-22Z" } },
    { tag: "path", tone: "ink", attrs: { d: "M164 250h22l-18 30h-22Z" } },
    { tag: "path", tone: "ink", attrs: { d: "M212 250h22l-18 30h-22Z" } },
    { tag: "path", tone: "ink", attrs: { d: "M260 250h22l-18 30h-22Z" } },
    { tag: "path", tone: "ink", attrs: { d: "M308 250h22l-18 30h-22Z" } },
    { tag: "path", tone: "ink", attrs: { d: "M356 250h22l-18 30h-22Z" } },
    {
      tag: "path",
      tone: "light",
      attrs: { d: "M98 102Q98 112 108 112Q98 112 98 122Q98 112 88 112Q98 112 98 102Z" },
    },
    {
      tag: "path",
      tone: "accent-main",
      attrs: { d: "M392 138Q392 150 404 150Q392 150 392 162Q392 150 380 150Q392 150 392 138Z" },
    },
    { tag: "circle", tone: "accent-light", attrs: { cx: 380, cy: 80, r: 5 } },
    { tag: "circle", tone: "light", attrs: { cx: 84, cy: 200, r: 4 } },
  ],
};
