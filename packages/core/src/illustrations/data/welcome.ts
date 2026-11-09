import type { Illustration } from "../../illustration/illustration.js";
import { backdrop, dot, groundShadow, paper, person, sparkle } from "../parts.js";

/** Welcome: a person waving beside a board with charts. Original artwork (MIT). */
export const welcome: Illustration = {
  name: "welcome",
  viewBox: "0 0 480 360",
  nodes: [
    backdrop(),
    groundShadow(),
    { tag: "path", tone: "grey-600", stroke: 8, attrs: { d: "M262 230l-14 88M376 230l14 88" } },
    ...paper({
      x: 204,
      y: 56,
      width: 232,
      height: 176,
      radius: 16,
      lines: { x: 228, y: 82, lengths: [70] },
    }),
    { tag: "rect", tone: "light", attrs: { x: 232, y: 150, width: 22, height: 56, rx: 6 } },
    { tag: "rect", tone: "main", attrs: { x: 266, y: 120, width: 22, height: 86, rx: 6 } },
    { tag: "rect", tone: "light", attrs: { x: 300, y: 166, width: 22, height: 40, rx: 6 } },
    { tag: "rect", tone: "main", attrs: { x: 334, y: 104, width: 22, height: 102, rx: 6 } },
    { tag: "path", tone: "dark", stroke: 6, attrs: { d: "M370 186l14-30 14 12 20-48" } },
    { tag: "circle", tone: "dark", attrs: { cx: 418, cy: 120, r: 6 } },
    person({ x: 130, pose: "wave", skin: "skin-light", shirt: "dark", hair: "long" }),
    sparkle(70, 80, 10),
    sparkle(180, 40, 7, "light"),
    dot(450, 270, 5, "accent-light"),
  ],
};
