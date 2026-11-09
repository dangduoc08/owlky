import type { Illustration } from "../../illustration/illustration.js";
import { backdrop, dot, groundShadow, paper, sparkle } from "../parts.js";

/** Empty content: an open, empty box with a floating page. Original artwork (MIT). */
export const emptyContent: Illustration = {
  name: "empty-content",
  viewBox: "0 0 480 360",
  nodes: [
    backdrop(),
    groundShadow(),
    ...paper({
      x: 204,
      y: 40,
      width: 72,
      height: 92,
      radius: 8,
      lines: { x: 218, y: 64, lengths: [44, 32, 40], gap: 16 },
      transform: "rotate(-10 240 96)",
    }),
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
    sparkle(110, 92, 10),
    sparkle(380, 100, 8, "light"),
    dot(410, 240, 5, "accent-light"),
    dot(80, 240, 4),
  ],
};
