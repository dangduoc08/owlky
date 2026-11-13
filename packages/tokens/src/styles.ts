/*
 * The style registry (ADR-0070, ADR-0073). Every style but the default ships as an opt-in sheet,
 * `@owlky/styles/styles/<id>.css` (CDN `owlky-style-<id>.css`), generated from its definition.
 * Adding a style: its file in `styles/`, one import, one `styleNames` entry and one `styles`
 * entry here, and its size budget (`scripts/check-size.mjs`). Tests, sheets, the package export
 * and Storybook pick it up from this list.
 */
import type { StyleDefinition } from "./style-definition.js";
import { bauhaus } from "./styles/bauhaus.js";
import { brutalism } from "./styles/brutalism.js";
import { corporate } from "./styles/corporate.js";
import { editorial } from "./styles/editorial.js";
import { minimalMono } from "./styles/minimal-mono.js";
import { neoBrutalism } from "./styles/neo-brutalism.js";
import { nordic } from "./styles/nordic.js";
import { soft } from "./styles/soft.js";
import { swiss } from "./styles/swiss.js";

export { fontStack, monoStack, type StyleDefinition } from "./style-definition.js";
export type { ShadowTreatment } from "./types.js";
export { bauhaus, brutalism, corporate, editorial, minimalMono, neoBrutalism, nordic, soft, swiss };

/**
 * Style ids (`data-ok-style`), the default first. A literal list (not `Object.keys(styles)`), so
 * code that only needs the names doesn't bundle the definitions.
 */
export const styleNames = [
  "soft",
  "swiss",
  "bauhaus",
  "brutalism",
  "neo-brutalism",
  "editorial",
  "minimal-mono",
  "corporate",
  "nordic",
] as const;
export type StyleName = (typeof styleNames)[number];

/** The default style (no `data-ok-style`, the core sheet). */
export const defaultStyleName: StyleName = "soft";

export const styles: Record<StyleName, StyleDefinition> = {
  soft,
  swiss,
  bauhaus,
  brutalism,
  "neo-brutalism": neoBrutalism,
  editorial,
  "minimal-mono": minimalMono,
  corporate,
  nordic,
};
