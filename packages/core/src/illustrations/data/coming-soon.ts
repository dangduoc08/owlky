import type { Illustration } from "../../illustration/illustration.js";

/** Coming soon: a rocket taking off above the clouds. Original artwork (MIT). */
export const comingSoon: Illustration = {
  name: "coming-soon",
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
    {
      tag: "path",
      tone: "accent-main",
      attrs: { d: "M90 68Q90 80 102 80Q90 80 90 92Q90 80 78 80Q90 80 90 68Z" },
    },
    {
      tag: "path",
      tone: "accent-main",
      attrs: { d: "M400 111Q400 120 409 120Q400 120 400 129Q400 120 391 120Q400 120 400 111Z" },
    },
    {
      tag: "path",
      tone: "light",
      attrs: { d: "M150 183Q150 190 157 190Q150 190 150 197Q150 190 143 190Q150 190 150 183Z" },
    },
    { tag: "circle", tone: "light", attrs: { cx: 360, cy: 50, r: 5 } },
    { tag: "circle", tone: "accent-light", attrs: { cx: 420, cy: 210, r: 4 } },
    { tag: "circle", tone: "light", attrs: { cx: 70, cy: 150, r: 4 } },
    {
      tag: "g",
      attrs: { transform: "translate(250 168) rotate(36)" },
      children: [
        {
          tag: "path",
          tone: "accent-main",
          attrs: { d: "M-26 44c0 40 26 58 26 84 0-26 26-44 26-84Z" },
        },
        {
          tag: "path",
          tone: "accent-light",
          attrs: { d: "M-12 44c0 24 12 34 12 50 0-16 12-26 12-50Z" },
        },
        { tag: "path", tone: "dark", attrs: { d: "M-38 4-70 56l34-6Z" } },
        { tag: "path", tone: "dark", attrs: { d: "M38 4l32 52-34-6Z" } },
        {
          tag: "path",
          tone: "paper",
          attrs: { d: "M0-112c42 30 50 92 40 156h-80c-10-64-2-126 40-156Z" },
        },
        {
          tag: "path",
          tone: "outline",
          stroke: 3,
          attrs: { d: "M0-112c42 30 50 92 40 156h-80c-10-64-2-126 40-156Z" },
        },
        {
          tag: "path",
          tone: "main",
          attrs: { d: "M0-112c22 16 34 38 39 62h-78c5-24 17-46 39-62Z" },
        },
        { tag: "circle", tone: "main", attrs: { cx: 0, cy: 0, r: 19 } },
        { tag: "circle", tone: "lighter", attrs: { cx: 0, cy: 0, r: 12 } },
        { tag: "rect", tone: "main", attrs: { x: -40, y: 40, width: 80, height: 10, rx: 5 } },
      ],
    },
    {
      tag: "path",
      tone: "neutral",
      attrs: {
        d: "M40 330h112a28.8 28.8 0 0 0 0-57.6a41.6 41.6 0 0 0-76.8-16a32 32 0 0 0-54.4 22.4a25.6 25.6 0 0 0 19.2 51.2Z",
      },
    },
    {
      tag: "path",
      tone: "neutral",
      attrs: {
        d: "M170 340h140a36 36 0 0 0 0-72a52 52 0 0 0-96-20a40 40 0 0 0-68 28a32 32 0 0 0 24 64Z",
      },
    },
    {
      tag: "path",
      tone: "neutral",
      attrs: {
        d: "M330 332h105a27 27 0 0 0 0-54a39 39 0 0 0-72-15a30 30 0 0 0-51 21a24 24 0 0 0 18 48Z",
      },
    },
  ],
};
