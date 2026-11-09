import type { Illustration } from "../../illustration/illustration.js";

/** Page not found: a large 404 among clouds and a plant. Original artwork (MIT). */
export const error404: Illustration = {
  name: "error-404",
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
      tone: "neutral",
      attrs: {
        d: "M64 92h63a16.2 16.2 0 0 0 0-32.4a23.4 23.4 0 0 0-43.2-9a18 18 0 0 0-30.6 12.6a14.4 14.4 0 0 0 10.8 28.8Z",
      },
    },
    {
      tag: "path",
      tone: "neutral",
      attrs: {
        d: "M356 70h77a19.8 19.8 0 0 0 0-39.6a28.6 28.6 0 0 0-52.8-11a22 22 0 0 0-37.4 15.4a17.6 17.6 0 0 0 13.2 35.2Z",
      },
    },
    {
      tag: "g",
      attrs: { transform: "translate(7 7)" },
      children: [
        { tag: "path", tone: "dark", stroke: 28, attrs: { d: "M130 258V108L66 208H154" } },
        {
          tag: "rect",
          tone: "dark",
          stroke: 28,
          attrs: { x: 190, y: 108, width: 80, height: 150, rx: 40 },
        },
        { tag: "path", tone: "dark", stroke: 28, attrs: { d: "M370 258V108L306 208H394" } },
      ],
    },
    { tag: "path", tone: "main", stroke: 28, attrs: { d: "M130 258V108L66 208H154" } },
    {
      tag: "rect",
      tone: "main",
      stroke: 28,
      attrs: { x: 190, y: 108, width: 80, height: 150, rx: 40 },
    },
    { tag: "path", tone: "main", stroke: 28, attrs: { d: "M370 258V108L306 208H394" } },
    {
      tag: "g",
      attrs: {},
      children: [
        {
          tag: "path",
          tone: "light",
          attrs: {
            d: "M0 0C-11.1 -15.8 -8.4 -36.2 0 -46.4C8.4 -36.2 11.1 -15.8 0 0Z",
            transform: "translate(442 292) rotate(-32)",
          },
        },
        {
          tag: "path",
          tone: "main",
          attrs: {
            d: "M0 0C-10.4 -14.7 -7.8 -33.7 0 -43.2C7.8 -33.7 10.4 -14.7 0 0Z",
            transform: "translate(442 292) rotate(30)",
          },
        },
        {
          tag: "path",
          tone: "dark",
          attrs: {
            d: "M0 0C-13.8 -19.6 -10.4 -44.9 0 -57.6C10.4 -44.9 13.8 -19.6 0 0Z",
            transform: "translate(442 292) rotate(-4)",
          },
        },
        { tag: "path", tone: "ink", attrs: { d: "M422 286h40l-6 34h-28Z" } },
      ],
    },
    {
      tag: "path",
      tone: "accent-main",
      attrs: { d: "M60 190Q60 200 70 200Q60 200 60 210Q60 200 50 200Q60 200 60 190Z" },
    },
    {
      tag: "path",
      tone: "light",
      attrs: { d: "M430 142Q430 150 438 150Q430 150 430 158Q430 150 422 150Q430 150 430 142Z" },
    },
    { tag: "circle", tone: "light", attrs: { cx: 200, cy: 60, r: 5 } },
    { tag: "circle", tone: "accent-light", attrs: { cx: 300, cy: 300, r: 4 } },
  ],
};
