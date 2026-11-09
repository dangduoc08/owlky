import type { Illustration } from "../../illustration/illustration.js";

/** Empty content: an open, empty box with a floating page. Original artwork (MIT). */
export const emptyContent: Illustration = {
  name: "empty-content",
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
      attrs: { transform: "rotate(-10 240 96)" },
      children: [
        { tag: "rect", tone: "paper", attrs: { x: 204, y: 40, width: 72, height: 92, rx: 8 } },
        {
          tag: "rect",
          tone: "outline",
          stroke: 3,
          attrs: { x: 204, y: 40, width: 72, height: 92, rx: 8 },
        },
        { tag: "path", tone: "line", stroke: 6, attrs: { d: "M218 64h44M218 80h32M218 96h40" } },
      ],
    },
    { tag: "path", tone: "darker", attrs: { d: "M150 168h180l-14 26H164Z" } },
    { tag: "path", tone: "light", attrs: { d: "M150 168 98 136l14 52 38 10Z" } },
    { tag: "path", tone: "light", attrs: { d: "M330 168l52-32-14 52-38 10Z" } },
    {
      tag: "path",
      tone: "main",
      attrs: { d: "M150 180h180v108a12 12 0 0 1-12 12H162a12 12 0 0 1-12-12Z" },
    },
    { tag: "path", tone: "dark", attrs: { d: "M240 180h90v108a12 12 0 0 1-12 12h-78Z" } },
    {
      tag: "rect",
      tone: "lighter",
      attrs: { x: 214, y: 210, width: 52, height: 10, rx: 5, opacity: 0.6 },
    },
    {
      tag: "path",
      tone: "accent-main",
      attrs: { d: "M110 82Q110 92 120 92Q110 92 110 102Q110 92 100 92Q110 92 110 82Z" },
    },
    {
      tag: "path",
      tone: "light",
      attrs: { d: "M380 92Q380 100 388 100Q380 100 380 108Q380 100 372 100Q380 100 380 92Z" },
    },
    { tag: "circle", tone: "accent-light", attrs: { cx: 410, cy: 240, r: 5 } },
    { tag: "circle", tone: "light", attrs: { cx: 80, cy: 240, r: 4 } },
  ],
};
