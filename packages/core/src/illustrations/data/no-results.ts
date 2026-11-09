import type { Illustration } from "../../illustration/illustration.js";

/** No results: a magnifying glass over an empty list. Original artwork (MIT). */
export const noResults: Illustration = {
  name: "no-results",
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
      tag: "g",
      attrs: { transform: "rotate(-6 200 190)" },
      children: [
        { tag: "rect", tone: "neutral", attrs: { x: 112, y: 70, width: 180, height: 220, rx: 16 } },
      ],
    },
    { tag: "rect", tone: "paper", attrs: { x: 124, y: 66, width: 180, height: 226, rx: 16 } },
    {
      tag: "rect",
      tone: "outline",
      stroke: 3,
      attrs: { x: 124, y: 66, width: 180, height: 226, rx: 16 },
    },
    { tag: "circle", tone: "lighter", attrs: { cx: 156, cy: 104, r: 14 } },
    { tag: "path", tone: "line", stroke: 10, attrs: { d: "M184 98h88M184 116h52" } },
    {
      tag: "path",
      tone: "line",
      stroke: 10,
      attrs: { d: "M148 160h132M148 186h96M148 212h120M148 238h70" },
    },
    { tag: "circle", tone: "main", attrs: { cx: 318, cy: 178, r: 58, opacity: 0.12 } },
    {
      tag: "path",
      tone: "main",
      stroke: 18,
      attrs: { d: "M318 120a58 58 0 1 1 0 116 58 58 0 1 1 0-116Z" },
    },
    { tag: "path", tone: "ink", stroke: 22, attrs: { d: "M362 224l44 44" } },
    { tag: "path", tone: "dark", stroke: 10, attrs: { d: "M302 162l32 32M334 162l-32 32" } },
    {
      tag: "path",
      tone: "accent-main",
      attrs: { d: "M410 86Q410 96 420 96Q410 96 410 106Q410 96 400 96Q410 96 410 86Z" },
    },
    { tag: "circle", tone: "light", attrs: { cx: 84, cy: 120, r: 5 } },
    { tag: "circle", tone: "accent-light", attrs: { cx: 92, cy: 270, r: 4 } },
  ],
};
