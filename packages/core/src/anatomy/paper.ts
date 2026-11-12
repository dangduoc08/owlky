import {
  type DataAttributes,
  defineOptions,
  flag,
  optionAttributes,
  style,
} from "../options/define.js";
import { paperElevations } from "./drawer.js";

// --- Paper ------------------------------------------------------------------------------------

export const paperVariants = ["elevation", "outlined"] as const;
export type PaperVariant = (typeof paperVariants)[number];

/** Paper (spec: paper.md). Card and other surfaces spread these options into their own schema. */
export const paperOptions = defineOptions("paper", "data-ok-paper", {
  variant: style(
    "data-ok-variant",
    paperVariants,
    "elevation",
    "`elevation`: a shadow; `outlined`: a 1px outline and no shadow.",
  ),
  elevation: style(
    "data-ok-elevation",
    paperElevations,
    "1",
    "Shadow depth from 0 (none) to 24 (`--ok-elevation-<n>`). Ignored by `outlined`.",
  ),
  square: flag("data-ok-square", "Square corners (no radius)."),
});

export interface PaperAnatomyOptions {
  variant?: PaperVariant | undefined;
  /** 0–24 (a number or its string). */
  elevation?: number | string | undefined;
  square?: boolean | undefined;
}

/** `data-ok-*` attributes of a paper (and of the surfaces built on it, such as Card). */
export const paperAttributes = ({
  elevation,
  ...options
}: PaperAnatomyOptions = {}): DataAttributes =>
  optionAttributes(paperOptions, {
    ...options,
    elevation: elevation === undefined ? undefined : String(elevation),
  });
