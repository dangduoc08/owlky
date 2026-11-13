import { fontStack, monoStack, type StyleDefinition } from "../style-definition.js";

/**
 * Neo-Brutalism (ADR-0070 § 1): radius 8 / 12px, 2px ink borders, hard offset shadows in the
 * ink color, Space Grotesk (300–700, so `extrabold` is 700) and bright hues.
 */
export const neoBrutalism: StyleDefinition = {
  id: "neo-brutalism",
  name: "Neo-Brutalism",
  hues: {
    primary: "violet",
    secondary: "pink",
    info: "cyan",
    success: "emerald",
    warning: "yellow",
    error: "red",
    neutral: "neutral",
  },
  chart: ["violet", "pink", "cyan", "yellow", "emerald", "orange", "blue", "lime"],
  fonts: {
    text: fontStack("Space Grotesk"),
    heading: fontStack("Space Grotesk"),
    label: fontStack("Space Grotesk"),
    mono: monoStack,
  },
  fontLinks: ["Space+Grotesk:wght@400..700"],
  heading: { weight: 700, weightSmall: 700, textTransform: "none", letterSpacing: "-0.01em" },
  label: { textTransform: "none", letterSpacing: "normal" },
  fontWeight: { extrabold: 700 },
  radius: {
    control: "8px",
    "control-sm": "6px",
    inner: "4px",
    surface: "12px",
    "surface-md": "12px",
    "surface-sm": "8px",
    chip: "9999px",
  },
  borderWidth: { default: "2px", strong: "3px", heavy: "4px" },
  surfaceBorder: { width: "2px", ink: true },
  shadows: "hard",
  shadowTint: { hue: "neutral", step: 950 },
  iconStroke: 2,
};
