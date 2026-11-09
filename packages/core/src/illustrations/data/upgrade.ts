import type { Illustration } from "../../illustration/illustration.js";
import { backdrop, dot, groundShadow, paper, sparkle } from "../parts.js";

/** Upgrade: a gem on a pedestal with sparkles. Original artwork (MIT). */
export const upgrade: Illustration = {
  name: "upgrade",
  viewBox: "0 0 480 360",
  nodes: [
    backdrop(),
    groundShadow(),
    ...paper({ x: 160, y: 244, width: 160, height: 76, radius: 10, tone: "neutral" }),
    ...paper({ x: 148, y: 230, width: 184, height: 22, radius: 8, tone: "neutral" }),
    { tag: "polygon", tone: "light", attrs: { points: "190,92 290,92 326,132 154,132" } },
    { tag: "polygon", tone: "lighter", attrs: { points: "190,92 214,132 240,92" } },
    { tag: "polygon", tone: "lighter", attrs: { points: "240,92 266,132 290,92" } },
    { tag: "polygon", tone: "main", attrs: { points: "154,132 326,132 240,214" } },
    { tag: "polygon", tone: "dark", attrs: { points: "214,132 266,132 240,214" } },
    { tag: "path", tone: "main", stroke: 6, attrs: { d: "M110 220v-50m-14 14 14-14 14 14" } },
    { tag: "path", tone: "light", stroke: 6, attrs: { d: "M372 200v-40m-12 12 12-12 12 12" } },
    sparkle(150, 74, 12),
    sparkle(340, 60, 14),
    sparkle(372, 120, 7, "light"),
    dot(112, 120, 5, "accent-light"),
  ],
};
