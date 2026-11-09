import type { Illustration } from "../../illustration/illustration.js";

/** Reset password: a padlock, a key and a hidden password. Original artwork (MIT). */
export const resetPassword: Illustration = {
  name: "reset-password",
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
      tone: "grey-600",
      stroke: 22,
      attrs: { d: "M188 156v-40a52 52 0 0 1 104 0v40" },
    },
    { tag: "rect", tone: "main", attrs: { x: 160, y: 146, width: 160, height: 120, rx: 24 } },
    {
      tag: "path",
      tone: "dark",
      attrs: { d: "M240 146h56a24 24 0 0 1 24 24v72a24 24 0 0 1-24 24h-56Z" },
    },
    { tag: "circle", tone: "darker", attrs: { cx: 240, cy: 196, r: 15 } },
    { tag: "rect", tone: "darker", attrs: { x: 233, y: 200, width: 14, height: 36, rx: 7 } },
    { tag: "rect", tone: "paper", attrs: { x: 112, y: 270, width: 256, height: 44, rx: 12 } },
    {
      tag: "rect",
      tone: "outline",
      stroke: 3,
      attrs: { x: 112, y: 270, width: 256, height: 44, rx: 12 },
    },
    { tag: "circle", tone: "ink", attrs: { cx: 150, cy: 292, r: 6 } },
    { tag: "circle", tone: "ink", attrs: { cx: 176, cy: 292, r: 6 } },
    { tag: "circle", tone: "ink", attrs: { cx: 202, cy: 292, r: 6 } },
    { tag: "circle", tone: "ink", attrs: { cx: 228, cy: 292, r: 6 } },
    { tag: "circle", tone: "ink", attrs: { cx: 254, cy: 292, r: 6 } },
    { tag: "circle", tone: "ink", attrs: { cx: 280, cy: 292, r: 6 } },
    {
      tag: "g",
      attrs: { transform: "rotate(-30 392 120)" },
      children: [
        {
          tag: "path",
          tone: "accent-main",
          stroke: 12,
          attrs: { d: "M392 96a22 22 0 1 1 0 44 22 22 0 1 1 0-44Z" },
        },
        { tag: "path", tone: "accent-main", stroke: 10, attrs: { d: "M392 140v72" } },
        { tag: "path", tone: "accent-main", stroke: 10, attrs: { d: "M392 186h18M392 204h12" } },
      ],
    },
    {
      tag: "path",
      tone: "accent-main",
      attrs: { d: "M90 90Q90 100 100 100Q90 100 90 110Q90 100 80 100Q90 100 90 90Z" },
    },
    { tag: "circle", tone: "light", attrs: { cx: 96, cy: 220, r: 5 } },
    { tag: "circle", tone: "accent-light", attrs: { cx: 420, cy: 260, r: 4 } },
  ],
};
