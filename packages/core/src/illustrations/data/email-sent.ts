import type { Illustration } from "../../illustration/illustration.js";
import { backdrop, dot, groundShadow, paper, sparkle } from "../parts.js";

/** Email sent: an envelope with a letter and a paper plane. Original artwork (MIT). */
export const emailSent: Illustration = {
  name: "email-sent",
  viewBox: "0 0 480 360",
  nodes: [
    backdrop(),
    groundShadow({ cy: 310, rx: 140, ry: 10 }),
    { tag: "rect", tone: "dark", attrs: { x: 130, y: 138, width: 220, height: 150, rx: 14 } },
    ...paper({
      x: 150,
      y: 96,
      width: 180,
      height: 150,
      radius: 10,
      lines: { x: 172, y: 124, lengths: [96, 136, 112], width: 8 },
    }),
    {
      tag: "path",
      tone: "main",
      attrs: {
        d: "M130 160l90 64a32 32 0 0 0 40 0l90-64v114a14 14 0 0 1-14 14H144a14 14 0 0 1-14-14Z",
      },
    },
    { tag: "path", tone: "light", attrs: { d: "M136 284l84-60a32 32 0 0 1 40 0l84 60Z" } },
    {
      tag: "path",
      tone: "line",
      stroke: 3,
      attrs: { d: "M330 88c-30 20-60 10-90-10", "stroke-dasharray": "8 10" },
    },
    { tag: "polygon", tone: "lighter", attrs: { points: "340,80 430,40 404,120" } },
    { tag: "polygon", tone: "main", attrs: { points: "340,80 430,40 382,96" } },
    { tag: "polygon", tone: "dark", attrs: { points: "382,96 430,40 390,118" } },
    sparkle(90, 90, 10),
    sparkle(410, 200, 8, "light"),
    dot(100, 230, 5, "accent-light"),
  ],
};
