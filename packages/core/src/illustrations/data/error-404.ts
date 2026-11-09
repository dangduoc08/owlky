import type { Illustration } from "../../illustration/illustration.js";
import { backdrop, cloud, dot, groundShadow, plant, sparkle } from "../parts.js";

const FOUR = "M130 258V108L66 208H154";
const ZERO = { x: 190, y: 108, width: 80, height: 150, rx: 40 };
const FOUR_RIGHT = "M370 258V108L306 208H394";

/** Page not found: a large 404 among clouds and a plant. Original artwork (MIT). */
export const error404: Illustration = {
  name: "error-404",
  viewBox: "0 0 480 360",
  nodes: [
    backdrop(),
    groundShadow(),
    cloud(64, 92, 0.9),
    cloud(356, 70, 1.1),
    // The digits are thick strokes: a `dark` copy offset down-right gives them depth.
    {
      tag: "g",
      attrs: { transform: "translate(7 7)" },
      children: [
        { tag: "path", tone: "dark", stroke: 28, attrs: { d: FOUR } },
        { tag: "rect", tone: "dark", stroke: 28, attrs: ZERO },
        { tag: "path", tone: "dark", stroke: 28, attrs: { d: FOUR_RIGHT } },
      ],
    },
    { tag: "path", tone: "main", stroke: 28, attrs: { d: FOUR } },
    { tag: "rect", tone: "main", stroke: 28, attrs: ZERO },
    { tag: "path", tone: "main", stroke: 28, attrs: { d: FOUR_RIGHT } },
    plant(442, 292),
    sparkle(60, 200, 10),
    sparkle(430, 150, 8, "light"),
    dot(200, 60, 5),
    dot(300, 300, 4, "accent-light"),
  ],
};
