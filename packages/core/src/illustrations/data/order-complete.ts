import type { Illustration } from "../../illustration/illustration.js";

/** Order complete: a shopping bag with a check mark and confetti. Original artwork (MIT). */
export const orderComplete: Illustration = {
  name: "order-complete",
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
    { tag: "path", tone: "ink", stroke: 10, attrs: { d: "M200 132v-22a40 40 0 0 1 80 0v22" } },
    {
      tag: "path",
      tone: "main",
      attrs: {
        d: "M164 124h152a10 10 0 0 1 10 9l14 160a10 10 0 0 1-10 11H150a10 10 0 0 1-10-11l14-160a10 10 0 0 1 10-9Z",
      },
    },
    {
      tag: "path",
      tone: "dark",
      attrs: { d: "M240 124h76a10 10 0 0 1 10 9l14 160a10 10 0 0 1-10 11h-90Z" },
    },
    { tag: "circle", tone: "ink", attrs: { cx: 200, cy: 140, r: 6 } },
    { tag: "circle", tone: "ink", attrs: { cx: 280, cy: 140, r: 6 } },
    { tag: "circle", tone: "white", attrs: { cx: 240, cy: 222, r: 42 } },
    { tag: "path", tone: "main", stroke: 12, attrs: { d: "M220 222l14 14 26-28" } },
    {
      tag: "rect",
      tone: "accent-main",
      attrs: { x: 96, y: 90, width: 14, height: 8, rx: 2, transform: "rotate(30 103 94)" },
    },
    {
      tag: "rect",
      tone: "light",
      attrs: { x: 360, y: 70, width: 14, height: 8, rx: 2, transform: "rotate(-24 367 74)" },
    },
    {
      tag: "rect",
      tone: "dark",
      attrs: { x: 380, y: 180, width: 12, height: 7, rx: 2, transform: "rotate(50 386 184)" },
    },
    {
      tag: "rect",
      tone: "accent-dark",
      attrs: { x: 80, y: 200, width: 12, height: 7, rx: 2, transform: "rotate(-40 86 204)" },
    },
    { tag: "path", tone: "light", stroke: 5, attrs: { d: "M118 150c10-10 0-20 10-30" } },
    { tag: "path", tone: "accent-main", stroke: 5, attrs: { d: "M352 128c10 6 20-4 30 2" } },
    {
      tag: "path",
      tone: "accent-main",
      attrs: { d: "M140 50Q140 60 150 60Q140 60 140 70Q140 60 130 60Q140 60 140 50Z" },
    },
    {
      tag: "path",
      tone: "light",
      attrs: { d: "M340 32Q340 40 348 40Q340 40 340 48Q340 40 332 40Q340 40 340 32Z" },
    },
    { tag: "circle", tone: "accent-light", attrs: { cx: 410, cy: 260, r: 5 } },
    { tag: "circle", tone: "light", attrs: { cx: 70, cy: 260, r: 5 } },
  ],
};
