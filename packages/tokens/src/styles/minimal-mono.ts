import { fontStack, monoStack, type StyleDefinition } from "../style-definition.js";

/**
 * Minimal Mono (ADR-0070 § 1): greys only. `primary` and `secondary` come from neutral scales;
 * status colors keep their hues because they carry meaning. Radius 8 / 14px, soft shadows
 * tinted grey, Inter.
 */
export const minimalMono: StyleDefinition = {
  id: "minimal-mono",
  name: "Minimal Mono",
  hues: {
    primary: "zinc",
    secondary: "slate",
    info: "sky",
    success: "green",
    warning: "amber",
    error: "red",
    neutral: "zinc",
  },
  chart: ["zinc", "slate", "sky", "teal", "amber", "rose", "violet", "lime"],
  fonts: {
    text: fontStack("Inter"),
    heading: fontStack("Inter"),
    label: fontStack("Inter"),
    mono: monoStack,
  },
  fontLinks: ["Inter:wght@400..800"],
  heading: { weight: 700, weightSmall: 600, textTransform: "none", letterSpacing: "-0.02em" },
  label: { textTransform: "none", letterSpacing: "normal" },
  radius: {
    control: "8px",
    "control-sm": "6px",
    inner: "4px",
    surface: "14px",
    "surface-md": "12px",
    "surface-sm": "8px",
    chip: "9999px",
  },
  surfaceBorder: { width: "0px", ink: false },
  shadows: "soft",
  shadowTint: { hue: "neutral", step: 950 },
  iconStroke: 1.5,
};
