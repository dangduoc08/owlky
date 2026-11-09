import type { Illustration } from "../../illustration/illustration.js";

/** Under maintenance: a person with a wrench beside two gears. Original artwork (MIT). */
export const maintenance: Illustration = {
  name: "maintenance",
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
      tag: "polygon",
      tone: "main",
      attrs: {
        points:
          "388.8,150 404.9,163.5 401.8,176.6 381.3,181.2 375.7,190.4 380.8,210.8 370.5,219.6 351.2,211.3 341.3,215.4 333.5,234.9 320,236 309.2,218 298.7,215.4 281,226.6 269.5,219.6 271.4,198.6 264.3,190.4 243.4,189 238.2,176.6 252,160.8 251.2,150 235.1,136.5 238.2,123.4 258.7,118.8 264.3,109.6 259.2,89.2 269.5,80.4 288.8,88.7 298.7,84.6 306.5,65.1 320,64 330.8,82 341.3,84.6 359,73.4 370.5,80.4 368.6,101.4 375.7,109.6 396.6,111 401.8,123.4 388,139.2",
      },
    },
    { tag: "circle", tone: "paper", attrs: { cx: 320, cy: 150, r: 30 } },
    {
      tag: "polygon",
      tone: "light",
      attrs: {
        points:
          "444.8,250 453.1,259 450.5,267.6 438.6,270.4 434,276 433.6,288.2 425.6,292.5 415.2,286.1 408,286.8 399,295.1 390.4,292.5 387.6,280.6 382,276 369.8,275.6 365.5,267.6 371.9,257.2 371.2,250 362.9,241 365.5,232.4 377.4,229.6 382,224 382.4,211.8 390.4,207.5 400.8,213.9 408,213.2 417,204.9 425.6,207.5 428.4,219.4 434,224 446.2,224.4 450.5,232.4 444.1,242.8",
      },
    },
    { tag: "circle", tone: "paper", attrs: { cx: 408, cy: 250, r: 16 } },
    {
      tag: "g",
      attrs: {},
      children: [
        { tag: "path", tone: "ink", stroke: 17, attrs: { d: "M160 228L157 308" } },
        { tag: "path", tone: "ink", stroke: 17, attrs: { d: "M180 228L183 308" } },
        { tag: "rect", tone: "ink", attrs: { x: 147, y: 216, width: 46, height: 26, rx: 8 } },
        { tag: "ellipse", tone: "ink", attrs: { cx: 153, cy: 314, rx: 14, ry: 6 } },
        { tag: "ellipse", tone: "ink", attrs: { cx: 187, cy: 314, rx: 14, ry: 6 } },
        { tag: "path", tone: "skin-medium", stroke: 10, attrs: { d: "M137 204L135 236" } },
        { tag: "path", tone: "light", stroke: 14, attrs: { d: "M146 172L137 206" } },
        { tag: "circle", tone: "skin-medium", attrs: { cx: 135, cy: 240, r: 6 } },
        { tag: "path", tone: "skin-medium", stroke: 10, attrs: { d: "M216 180L244 162" } },
        { tag: "path", tone: "light", stroke: 14, attrs: { d: "M194 172L216 180" } },
        { tag: "circle", tone: "skin-medium", attrs: { cx: 244, cy: 162, r: 6 } },
        {
          tag: "path",
          tone: "light",
          attrs: { d: "M141 180q0-18 16-18h26q16 0 16 18l-5 44h-48Z" },
        },
        {
          tag: "rect",
          tone: "skin-medium",
          attrs: { x: 164, y: 148, width: 12, height: 16, rx: 4 },
        },
        { tag: "path", tone: "shade", attrs: { d: "M164 156h12v8h-12Z" } },
        { tag: "circle", tone: "skin-medium", attrs: { cx: 170, cy: 136, r: 18 } },
        {
          tag: "path",
          tone: "ink",
          attrs: { d: "M151 138c-4-20 8-32 22-31 14 1 21 12 16 26-6-9-16-12-38 5Z" },
        },
      ],
    },
    { tag: "path", tone: "accent-main", attrs: { d: "M150 132a20 20 0 0 1 40 0Z" } },
    { tag: "rect", tone: "accent-dark", attrs: { x: 144, y: 130, width: 52, height: 6, rx: 3 } },
    { tag: "path", tone: "grey-600", stroke: 8, attrs: { d: "M244 162l34-14" } },
    { tag: "circle", tone: "grey-600", attrs: { cx: 284, cy: 145, r: 11 } },
    { tag: "circle", tone: "paper", attrs: { cx: 290, cy: 141, r: 5 } },
    { tag: "rect", tone: "accent-dark", attrs: { x: 52, y: 278, width: 72, height: 40, rx: 6 } },
    { tag: "path", tone: "ink", stroke: 6, attrs: { d: "M74 278v-10h28v10" } },
    { tag: "rect", tone: "shade", attrs: { x: 52, y: 290, width: 72, height: 6 } },
    {
      tag: "path",
      tone: "light",
      attrs: { d: "M70 110Q70 120 80 120Q70 120 70 130Q70 120 60 120Q70 120 70 110Z" },
    },
    { tag: "circle", tone: "accent-light", attrs: { cx: 230, cy: 60, r: 5 } },
  ],
};
