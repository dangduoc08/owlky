import { fontStack, monoStack, type StyleDefinition } from "../style-definition.js";

/**
 * Corporate (ADR-0070 § 1): radius 4 / 8px, one short subtle shadow, IBM Plex Sans (100–700, so
 * `extrabold` is 700), a blue primary on cool slate greys.
 */
export const corporate: StyleDefinition = {
  id: "corporate",
  name: "Corporate",
  hues: {
    primary: "blue",
    secondary: "slate",
    info: "sky",
    success: "green",
    warning: "amber",
    error: "red",
    neutral: "slate",
  },
  chart: ["blue", "teal", "amber", "slate", "indigo", "orange", "green", "rose"],
  fonts: {
    text: fontStack("IBM Plex Sans"),
    heading: fontStack("IBM Plex Sans"),
    label: fontStack("IBM Plex Sans"),
    mono: monoStack,
  },
  fontLinks: ["IBM+Plex+Sans:wght@400..700"],
  heading: { weight: 700, weightSmall: 600, textTransform: "none", letterSpacing: "normal" },
  label: { textTransform: "none", letterSpacing: "normal" },
  fontWeight: { extrabold: 700 },
  radius: {
    control: "4px",
    "control-sm": "4px",
    inner: "2px",
    surface: "8px",
    "surface-md": "8px",
    "surface-sm": "6px",
    chip: "4px",
  },
  surfaceBorder: { width: "0px", ink: false },
  shadows: "subtle",
  shadowTint: { hue: "neutral", step: 900 },
  iconStroke: 1.5,
};
