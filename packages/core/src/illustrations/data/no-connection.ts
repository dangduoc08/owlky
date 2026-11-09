import type { Illustration } from "../../illustration/illustration.js";
import { backdrop, cloud, dot, groundShadow, sparkle } from "../parts.js";

/** No connection: an unplugged cable under a cloud. Original artwork (MIT). */
export const noConnection: Illustration = {
  name: "no-connection",
  viewBox: "0 0 480 360",
  nodes: [
    backdrop(),
    groundShadow(),
    cloud(170, 150, 1.9),
    { tag: "path", tone: "main", stroke: 9, attrs: { d: "M196 128a62 62 0 0 1 88 0" } },
    { tag: "path", tone: "main", stroke: 9, attrs: { d: "M213 146a38 38 0 0 1 54 0" } },
    { tag: "circle", tone: "main", attrs: { cx: 240, cy: 166, r: 7 } },
    { tag: "path", tone: "dark", stroke: 9, attrs: { d: "M198 100l84 76" } },
    { tag: "path", tone: "ink", stroke: 10, attrs: { d: "M40 282c50 0 80-16 110-16" } },
    { tag: "rect", tone: "main", attrs: { x: 146, y: 250, width: 50, height: 32, rx: 8 } },
    { tag: "rect", tone: "grey-600", attrs: { x: 196, y: 256, width: 22, height: 6, rx: 3 } },
    { tag: "rect", tone: "grey-600", attrs: { x: 196, y: 270, width: 22, height: 6, rx: 3 } },
    { tag: "path", tone: "ink", stroke: 10, attrs: { d: "M440 282c-50 0-80-16-110-16" } },
    { tag: "rect", tone: "dark", attrs: { x: 284, y: 248, width: 50, height: 36, rx: 8 } },
    { tag: "rect", tone: "darker", attrs: { x: 276, y: 258, width: 8, height: 16, rx: 3 } },
    {
      tag: "path",
      tone: "accent-main",
      stroke: 5,
      attrs: { d: "M240 236v-12M222 244l-8-8M258 244l8-8" },
    },
    sparkle(400, 90, 10),
    dot(80, 120, 5),
  ],
};
