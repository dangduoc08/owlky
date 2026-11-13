import { fontStack, monoStack, type StyleDefinition } from "../style-definition.js";

/**
 * Brutalism (ADR-0070 § 1): the raw web page. Square shapes, 1px ink lines instead of shadows,
 * IBM Plex Mono for every family (100–700, so `extrabold` is 700), link blue and an orange
 * secondary on warm greys (`stone`).
 */
export const brutalism: StyleDefinition = {
  id: "brutalism",
  name: "Brutalism",
  hues: {
    primary: "blue",
    secondary: "orange",
    info: "cyan",
    success: "green",
    warning: "yellow",
    error: "red",
    neutral: "stone",
  },
  chart: ["blue", "orange", "stone", "green", "red", "cyan", "yellow", "violet"],
  fonts: {
    text: fontStack("IBM Plex Mono", monoStack),
    heading: fontStack("IBM Plex Mono", monoStack),
    label: fontStack("IBM Plex Mono", monoStack),
    mono: fontStack("IBM Plex Mono", monoStack),
  },
  fontLinks: ["IBM+Plex+Mono:wght@400;500;600;700"],
  heading: { weight: 700, weightSmall: 600, textTransform: "none", letterSpacing: "normal" },
  label: { textTransform: "none", letterSpacing: "normal" },
  fontWeight: { extrabold: 700 },
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
