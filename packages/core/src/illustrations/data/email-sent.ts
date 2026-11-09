import type { Illustration } from "../../illustration/illustration.js";

/** Email sent: an envelope with a letter and a paper plane. Original artwork (MIT). */
export const emailSent: Illustration = {
  name: "email-sent",
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
    { tag: "ellipse", tone: "shadow", attrs: { cx: 240, cy: 310, rx: 140, ry: 10 } },
    { tag: "rect", tone: "dark", attrs: { x: 130, y: 138, width: 220, height: 150, rx: 14 } },
    { tag: "rect", tone: "paper", attrs: { x: 150, y: 96, width: 180, height: 150, rx: 10 } },
    {
      tag: "rect",
      tone: "outline",
      stroke: 3,
      attrs: { x: 150, y: 96, width: 180, height: 150, rx: 10 },
    },
    { tag: "path", tone: "line", stroke: 8, attrs: { d: "M172 124h96M172 144h136M172 164h112" } },
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
    {
      tag: "path",
      tone: "accent-main",
      attrs: { d: "M90 80Q90 90 100 90Q90 90 90 100Q90 90 80 90Q90 90 90 80Z" },
    },
    {
      tag: "path",
      tone: "light",
      attrs: { d: "M410 192Q410 200 418 200Q410 200 410 208Q410 200 402 200Q410 200 410 192Z" },
    },
    { tag: "circle", tone: "accent-light", attrs: { cx: 100, cy: 230, r: 5 } },
  ],
};
