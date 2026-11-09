import type { Illustration } from "../../illustration/illustration.js";

/** Welcome: a person waving beside a board with charts. Original artwork (MIT). */
export const welcome: Illustration = {
  name: "welcome",
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
    { tag: "path", tone: "grey-600", stroke: 8, attrs: { d: "M262 230l-14 88M376 230l14 88" } },
    { tag: "rect", tone: "paper", attrs: { x: 204, y: 56, width: 232, height: 176, rx: 16 } },
    {
      tag: "rect",
      tone: "outline",
      stroke: 3,
      attrs: { x: 204, y: 56, width: 232, height: 176, rx: 16 },
    },
    { tag: "path", tone: "line", stroke: 6, attrs: { d: "M228 82h70" } },
    { tag: "rect", tone: "light", attrs: { x: 232, y: 150, width: 22, height: 56, rx: 6 } },
    { tag: "rect", tone: "main", attrs: { x: 266, y: 120, width: 22, height: 86, rx: 6 } },
    { tag: "rect", tone: "light", attrs: { x: 300, y: 166, width: 22, height: 40, rx: 6 } },
    { tag: "rect", tone: "main", attrs: { x: 334, y: 104, width: 22, height: 102, rx: 6 } },
    { tag: "path", tone: "dark", stroke: 6, attrs: { d: "M370 186l14-30 14 12 20-48" } },
    { tag: "circle", tone: "dark", attrs: { cx: 418, cy: 120, r: 6 } },
    {
      tag: "g",
      attrs: {},
      children: [
        { tag: "path", tone: "ink", attrs: { d: "M109 134c-2 26 2 46 -4 58h50c-6-12-2-32-4-58Z" } },
        { tag: "path", tone: "ink", stroke: 17, attrs: { d: "M120 228L117 308" } },
        { tag: "path", tone: "ink", stroke: 17, attrs: { d: "M140 228L143 308" } },
        { tag: "rect", tone: "ink", attrs: { x: 107, y: 216, width: 46, height: 26, rx: 8 } },
        { tag: "ellipse", tone: "ink", attrs: { cx: 113, cy: 314, rx: 14, ry: 6 } },
        { tag: "ellipse", tone: "ink", attrs: { cx: 147, cy: 314, rx: 14, ry: 6 } },
        { tag: "path", tone: "skin-light", stroke: 10, attrs: { d: "M97 204L95 236" } },
        { tag: "path", tone: "dark", stroke: 14, attrs: { d: "M106 172L97 206" } },
        { tag: "circle", tone: "skin-light", attrs: { cx: 95, cy: 240, r: 6 } },
        { tag: "path", tone: "skin-light", stroke: 10, attrs: { d: "M174 188L182 144" } },
        { tag: "path", tone: "dark", stroke: 14, attrs: { d: "M154 172L174 188" } },
        { tag: "circle", tone: "skin-light", attrs: { cx: 182, cy: 144, r: 6 } },
        { tag: "path", tone: "dark", attrs: { d: "M101 180q0-18 16-18h26q16 0 16 18l-5 44h-48Z" } },
        {
          tag: "rect",
          tone: "skin-light",
          attrs: { x: 124, y: 148, width: 12, height: 16, rx: 4 },
        },
        { tag: "path", tone: "shade", attrs: { d: "M124 156h12v8h-12Z" } },
        { tag: "circle", tone: "skin-light", attrs: { cx: 130, cy: 136, r: 18 } },
        {
          tag: "path",
          tone: "ink",
          attrs: { d: "M111 138c-4-20 8-32 22-31 14 1 21 12 16 26-6-9-16-12-38 5Z" },
        },
      ],
    },
    {
      tag: "path",
      tone: "accent-main",
      attrs: { d: "M70 70Q70 80 80 80Q70 80 70 90Q70 80 60 80Q70 80 70 70Z" },
    },
    {
      tag: "path",
      tone: "light",
      attrs: { d: "M180 33Q180 40 187 40Q180 40 180 47Q180 40 173 40Q180 40 180 33Z" },
    },
    { tag: "circle", tone: "accent-light", attrs: { cx: 450, cy: 270, r: 5 } },
  ],
};
