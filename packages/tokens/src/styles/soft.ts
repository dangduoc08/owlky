import { fontStack, monoStack, type StyleDefinition } from "../style-definition.js";

/** Soft, the default (ADR-0070 § 1): rounded, borderless, two-layer tinted shadows, Nunito. */
export const soft: StyleDefinition = {
  id: "soft",
  name: "Soft",
  hues: {
    primary: "indigo",
    secondary: "violet",
    info: "sky",
    success: "green",
    warning: "amber",
    error: "red",
    neutral: "zinc",
  },
  chart: ["indigo", "teal", "orange", "sky", "pink", "amber", "green", "violet"],
  fonts: {
    text: fontStack("Nunito"),
    heading: fontStack("Nunito"),
    label: fontStack("Nunito"),
    mono: monoStack,
  },
  fontLinks: ["Nunito:wght@400..800"],
  heading: { weight: 800, weightSmall: 700, textTransform: "none", letterSpacing: "normal" },
  label: { textTransform: "none", letterSpacing: "normal" },
  radius: {
    control: "10px",
    "control-sm": "6px",
    inner: "4px",
    surface: "18px",
    "surface-md": "14px",
    "surface-sm": "10px",
    chip: "9999px",
  },
  surfaceBorder: { width: "0px", ink: false },
  shadows: "soft",
  shadowTint: { hue: "primary", step: 950 },
  iconStroke: 1.5,
};
