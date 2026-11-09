import type { Illustration, IllustrationNode } from "../../illustration/illustration.js";
import { backdrop, dot, groundShadow, paper, sparkle } from "../parts.js";

/** One hidden character of the password field. */
const bullet = (cx: number): IllustrationNode => ({
  tag: "circle",
  tone: "ink",
  attrs: { cx, cy: 292, r: 6 },
});

/** Reset password: a padlock, a key and a hidden password. Original artwork (MIT). */
export const resetPassword: Illustration = {
  name: "reset-password",
  viewBox: "0 0 480 360",
  nodes: [
    backdrop(),
    groundShadow(),
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
    ...paper({ x: 112, y: 270, width: 256, height: 44, radius: 12 }),
    ...[150, 176, 202, 228, 254, 280].map(bullet),
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
    sparkle(90, 100, 10),
    dot(96, 220, 5),
    dot(420, 260, 4, "accent-light"),
  ],
};
