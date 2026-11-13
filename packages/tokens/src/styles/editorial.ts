import { fontStack, monoStack, type StyleDefinition } from "../style-definition.js";

const serif = 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';

/**
 * Editorial (ADR-0070 § 1): a magazine page. Square shapes, no shadows, Noto Serif Display 900
 * headings, Source Serif 4 text, Archivo labels in capitals tracked 0.12em, warm greys and one
 * rose accent. Rules instead of side borders need Paper to draw per-side borders (a component
 * change, not part of this definition): until then surfaces draw a full 1px ink edge.
 */
export const editorial: StyleDefinition = {
  id: "editorial",
  name: "Editorial",
  hues: {
    primary: "rose",
    secondary: "stone",
    info: "sky",
    success: "emerald",
    warning: "amber",
    error: "red",
    neutral: "stone",
  },
  chart: ["rose", "stone", "teal", "amber", "sky", "orange", "emerald", "violet"],
  fonts: {
    text: fontStack("Source Serif 4", serif),
    heading: fontStack("Noto Serif Display", serif),
    label: fontStack("Archivo"),
    mono: monoStack,
  },
  fontLinks: [
    "Noto+Serif+Display:wght@400..900",
    "Source+Serif+4:wght@400..900",
    "Archivo:wght@400..900",
  ],
  heading: { weight: 900, weightSmall: 700, textTransform: "none", letterSpacing: "normal" },
  label: { textTransform: "uppercase", letterSpacing: "0.12em" },
  // The three families go to 900: `extrabold` is the headings' black weight.
  fontWeight: { extrabold: 900 },
  radius: {
    control: "0px",
    "control-sm": "0px",
    inner: "0px",
    surface: "0px",
    "surface-md": "0px",
    "surface-sm": "0px",
    chip: "0px",
  },
  surfaceBorder: { width: "1px", ink: true },
  shadows: "flat",
  shadowTint: { hue: "neutral", step: 950 },
  iconStroke: 1.25,
};
