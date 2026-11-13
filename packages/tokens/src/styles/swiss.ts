import { fontStack, monoStack, type StyleDefinition } from "../style-definition.js";

/**
 * Swiss (ADR-0070 § 1): the International Typographic Style. Square shapes, 1px ink lines
 * instead of shadows, Inter 800 headings tracked −0.03em, pure greys and one blue accent (a red
 * primary would read as the error color).
 */
export const swiss: StyleDefinition = {
  id: "swiss",
  name: "Swiss",
  hues: {
    primary: "blue",
    secondary: "neutral",
    info: "sky",
    success: "green",
    warning: "amber",
    error: "red",
    neutral: "neutral",
  },
  chart: ["blue", "red", "neutral", "amber", "teal", "indigo", "orange", "green"],
  fonts: {
    text: fontStack("Inter"),
    heading: fontStack("Inter"),
    label: fontStack("Inter"),
    mono: monoStack,
  },
  fontLinks: ["Inter:wght@400..800"],
  heading: { weight: 800, weightSmall: 700, textTransform: "none", letterSpacing: "-0.03em" },
  label: { textTransform: "none", letterSpacing: "normal" },
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
  iconStroke: 1.5,
};
