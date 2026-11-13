import { fontStack, monoStack, type StyleDefinition } from "../style-definition.js";

/**
 * Nordic (ADR-0070 § 1): radius 10 / 16px, soft shadows tinted with the warm greys, Manrope 800
 * headings, a calm teal primary with a sky secondary on stone greys.
 */
export const nordic: StyleDefinition = {
  id: "nordic",
  name: "Nordic",
  hues: {
    primary: "teal",
    secondary: "sky",
    info: "blue",
    success: "emerald",
    warning: "amber",
    error: "rose",
    neutral: "stone",
  },
  chart: ["teal", "sky", "amber", "rose", "emerald", "indigo", "orange", "stone"],
  fonts: {
    text: fontStack("Manrope"),
    heading: fontStack("Manrope"),
    label: fontStack("Manrope"),
    mono: monoStack,
  },
  fontLinks: ["Manrope:wght@400..800"],
  heading: { weight: 800, weightSmall: 700, textTransform: "none", letterSpacing: "-0.01em" },
  label: { textTransform: "none", letterSpacing: "normal" },
  radius: {
    control: "10px",
    "control-sm": "6px",
    inner: "4px",
    surface: "16px",
    "surface-md": "12px",
    "surface-sm": "10px",
    chip: "9999px",
  },
  surfaceBorder: { width: "0px", ink: false },
  shadows: "soft",
  shadowTint: { hue: "neutral", step: 900 },
  iconStroke: 1.5,
};
