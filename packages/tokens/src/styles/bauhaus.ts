import { fontStack, monoStack, type StyleDefinition } from "../style-definition.js";

/**
 * Bauhaus (ADR-0070 § 1): square shapes with pill chips, 2 / 3 / 4px lines and a 2px ink edge on
 * surfaces instead of shadows, Montserrat 800 headings and labels in capitals, and the school's
 * triad: a blue primary and a yellow secondary on warm paper greys (`stone`), red for errors.
 */
export const bauhaus: StyleDefinition = {
  id: "bauhaus",
  name: "Bauhaus",
  hues: {
    primary: "blue",
    secondary: "yellow",
    info: "sky",
    success: "green",
    warning: "orange",
    error: "red",
    neutral: "stone",
  },
  chart: ["blue", "red", "yellow", "stone", "orange", "sky", "green", "rose"],
  fonts: {
    text: fontStack("Montserrat"),
    heading: fontStack("Montserrat"),
    label: fontStack("Montserrat"),
    mono: monoStack,
  },
  fontLinks: ["Montserrat:wght@400..800"],
  heading: { weight: 800, weightSmall: 700, textTransform: "uppercase", letterSpacing: "0.02em" },
  label: { textTransform: "uppercase", letterSpacing: "0.04em" },
  radius: {
    control: "0px",
    "control-sm": "0px",
    inner: "0px",
    surface: "0px",
    "surface-md": "0px",
    "surface-sm": "0px",
    chip: "9999px",
  },
  borderWidth: { default: "2px", strong: "3px", heavy: "4px" },
  surfaceBorder: { width: "2px", ink: true },
  shadows: "flat",
  shadowTint: { hue: "neutral", step: 950 },
  iconStroke: 2,
};
