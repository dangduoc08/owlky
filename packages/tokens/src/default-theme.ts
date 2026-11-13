import type { ColorScheme, GreyScale, Theme } from "./types.js";

/*
 * Default theme: soft greys, green primary, generous radius, soft tinted shadows. `contrastText`
 * is white on fills and dark on warning (ADR-0014); neutral text and `paletteText` (soft
 * variants) meet WCAG 2.2 AA.
 */

const grey: GreyScale = {
  50: "#FCFDFD",
  100: "#F9FAFB",
  200: "#F4F6F8",
  300: "#DFE3E8",
  400: "#C4CDD5",
  500: "#919EAB",
  600: "#637381",
  700: "#454F5B",
  800: "#1C252E",
  900: "#141A21",
};

const common = { white: "#FFFFFF", black: "#000000" };

/** Skin tones of the illustrations' people (decorative, ADR-0041). */
const illustration = { skin: { light: "#FFD8BF", medium: "#E0A47C", deep: "#8D5B3D" } };

/*
 * System elevations 1–24 as [y, blur, spread] for the umbra, penumbra and ambient layers
 * (Material elevation geometry; alphas 20 % / 14 % / 12 %). x is always 0.
 */
const ELEVATION: [number, number, number][][] = [
  [
    [2, 1, -1],
    [1, 1, 0],
    [1, 3, 0],
  ],
  [
    [3, 1, -2],
    [2, 2, 0],
    [1, 5, 0],
  ],
  [
    [3, 3, -2],
    [3, 4, 0],
    [1, 8, 0],
  ],
  [
    [2, 4, -1],
    [4, 5, 0],
    [1, 10, 0],
  ],
  [
    [3, 5, -1],
    [5, 8, 0],
    [1, 14, 0],
  ],
  [
    [3, 5, -1],
    [6, 10, 0],
    [1, 18, 0],
  ],
  [
    [4, 5, -2],
    [7, 10, 1],
    [2, 16, 1],
  ],
  [
    [5, 5, -3],
    [8, 10, 1],
    [3, 14, 2],
  ],
  [
    [5, 6, -3],
    [9, 12, 1],
    [3, 16, 2],
  ],
  [
    [6, 6, -3],
    [10, 14, 1],
    [4, 18, 3],
  ],
  [
    [6, 7, -4],
    [11, 15, 1],
    [4, 20, 3],
  ],
  [
    [7, 8, -4],
    [12, 17, 2],
    [5, 22, 4],
  ],
  [
    [7, 8, -4],
    [13, 19, 2],
    [5, 24, 4],
  ],
  [
    [7, 9, -4],
    [14, 21, 2],
    [5, 26, 4],
  ],
  [
    [8, 9, -5],
    [15, 22, 2],
    [6, 28, 5],
  ],
  [
    [8, 10, -5],
    [16, 24, 2],
    [6, 30, 5],
  ],
  [
    [8, 11, -5],
    [17, 26, 2],
    [6, 32, 5],
  ],
  [
    [9, 11, -5],
    [18, 28, 2],
    [7, 34, 6],
  ],
  [
    [9, 12, -6],
    [19, 29, 2],
    [7, 36, 6],
  ],
  [
    [10, 13, -6],
    [20, 31, 3],
    [8, 38, 7],
  ],
  [
    [10, 13, -6],
    [21, 33, 3],
    [8, 40, 7],
  ],
  [
    [10, 14, -6],
    [22, 35, 3],
    [8, 42, 7],
  ],
  [
    [11, 14, -7],
    [23, 36, 3],
    [9, 44, 8],
  ],
  [
    [11, 15, -7],
    [24, 38, 3],
    [9, 46, 8],
  ],
];
const ELEVATION_ALPHAS = [20, 14, 12] as const;

function elevationLayers() {
  return ELEVATION.map((layers) =>
    layers.map(([y, blur, spread], i) => ({
      x: 0,
      y,
      blur,
      spread,
      alpha: ELEVATION_ALPHAS[i] ?? 12,
    })),
  );
}

const mix = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;

const light: ColorScheme = {
  paletteText: {
    primary: "#007867",
    secondary: "#5119B7",
    info: "#006C9C",
    success: "#065E49",
    warning: "#7A4100",
    error: "#B71D18",
  },
  text: { primary: grey[800], secondary: grey[600], disabled: grey[500] },
  background: { default: common.white, paper: common.white, neutral: grey[200] },
  inherit: { main: grey[800], hover: grey[700], contrast: common.white },
  divider: mix(grey[500], 20),
  action: {
    hover: mix(grey[500], 8),
    selected: mix(grey[500], 16),
    focus: mix(grey[500], 24),
    disabled: mix(grey[500], 80),
    disabledBackground: mix(grey[500], 24),
  },
  shadowColor: grey[500],
  backdrop: mix(grey[800], 48),
};

const dark: ColorScheme = {
  paletteText: {
    primary: "#5BE49B",
    secondary: "#C684FF",
    info: "#61F3F3",
    success: "#77ED8B",
    warning: "#FFD666",
    error: "#FFAC82",
  },
  text: { primary: common.white, secondary: grey[500], disabled: grey[600] },
  background: { default: grey[900], paper: grey[800], neutral: "#28323D" },
  inherit: { main: common.white, hover: grey[400], contrast: grey[800] },
  divider: mix(grey[500], 20),
  action: {
    hover: mix(grey[500], 8),
    selected: mix(grey[500], 16),
    focus: mix(grey[500], 24),
    disabled: mix(grey[500], 80),
    disabledBackground: mix(grey[500], 24),
  },
  shadowColor: common.black,
  backdrop: mix(grey[900], 64),
};

export const defaultTheme: Theme = {
  palette: {
    primary: {
      lighter: "#C8FAD6",
      light: "#5BE49B",
      main: "#00A76F",
      dark: "#007867",
      darker: "#004B50",
      contrastText: common.white,
    },
    secondary: {
      lighter: "#EFD6FF",
      light: "#C684FF",
      main: "#8E33FF",
      dark: "#5119B7",
      darker: "#27097A",
      contrastText: common.white,
    },
    info: {
      lighter: "#CAFDF5",
      light: "#61F3F3",
      main: "#00B8D9",
      dark: "#006C9C",
      darker: "#003768",
      contrastText: common.white,
    },
    success: {
      lighter: "#D3FCD2",
      light: "#77ED8B",
      main: "#22C55E",
      dark: "#118D57",
      darker: "#065E49",
      contrastText: common.white,
    },
    warning: {
      lighter: "#FFF5CC",
      light: "#FFD666",
      main: "#FFAB00",
      dark: "#B76E00",
      darker: "#7A4100",
      contrastText: grey[800],
    },
    error: {
      lighter: "#FFE9D5",
      light: "#FFAC82",
      main: "#FF5630",
      dark: "#B71D18",
      darker: "#7A0916",
      contrastText: common.white,
    },
  },
  grey,
  common,
  illustration,
  schemes: { light, dark },
  typography: {
    fontFamily:
      '"Public Sans Variable", "Public Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontFamilyHeading:
      '"Barlow", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontFamilyLabel: "var(--ok-font-family)",
    fontFamilyMono:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    label: { textTransform: "none", letterSpacing: "normal" },
    fontWeight: { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
    fontSize: {
      "2xs": "0.6875rem",
      xs: "0.75rem",
      sm: "0.8125rem",
      md: "0.875rem",
      lg: "0.9375rem",
      xl: "1rem",
      "2xl": "1.0625rem",
      "3xl": "1.25rem",
      quote: "1.5rem",
      code: "0.875em",
    },
    quoteMarkSize: "4rem",
    variants: {
      h1: {
        fontSize: "2.5rem",
        responsiveFontSize: { sm: "3.25rem", md: "3.625rem", lg: "4rem" },
        lineHeight: "1.25",
        fontWeight: 800,
        fontFamily: "heading",
      },
      h2: {
        fontSize: "2rem",
        responsiveFontSize: { sm: "2.5rem", md: "2.75rem", lg: "3rem" },
        lineHeight: "1.3333",
        fontWeight: 800,
        fontFamily: "heading",
      },
      h3: {
        fontSize: "1.5rem",
        responsiveFontSize: { sm: "1.625rem", md: "1.875rem", lg: "2rem" },
        lineHeight: "1.5",
        fontWeight: 700,
        fontFamily: "heading",
      },
      h4: {
        fontSize: "1.25rem",
        responsiveFontSize: { md: "1.5rem" },
        lineHeight: "1.5",
        fontWeight: 700,
      },
      h5: {
        fontSize: "1.125rem",
        responsiveFontSize: { sm: "1.1875rem" },
        lineHeight: "1.5",
        fontWeight: 700,
      },
      h6: {
        fontSize: "1.0625rem",
        responsiveFontSize: { sm: "1.125rem" },
        lineHeight: "1.5556",
        fontWeight: 600,
      },
      subtitle1: { fontSize: "1rem", lineHeight: "1.5", fontWeight: 600 },
      subtitle2: { fontSize: "0.875rem", lineHeight: "1.5714", fontWeight: 600 },
      body1: { fontSize: "1rem", lineHeight: "1.5", fontWeight: 400 },
      body2: { fontSize: "0.875rem", lineHeight: "1.5714", fontWeight: 400 },
      caption: { fontSize: "0.75rem", lineHeight: "1.5", fontWeight: 400 },
      overline: {
        fontSize: "0.75rem",
        lineHeight: "1.5",
        fontWeight: 700,
        fontFamily: "label",
        textTransform: "uppercase",
      },
      button: { fontSize: "0.875rem", lineHeight: "1.7143", fontWeight: 700, fontFamily: "label" },
    },
  },
  radius: {
    "2xs": "2px",
    xs: "4px",
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "24px",
    full: "9999px",
  },
  radiusRole: {
    control: "8px",
    "control-sm": "6px",
    inner: "4px",
    surface: "16px",
    "surface-md": "12px",
    "surface-sm": "10px",
    chip: "10px",
  },
  borderWidth: { default: "1px", strong: "2px", heavy: "3px" },
  lineWidth: {
    hairline: "0.5px",
    "2xs": "0.75px",
    xs: "1px",
    sm: "1.5px",
    md: "2px",
    lg: "2.5px",
    xl: "3px",
    "2xl": "4px",
  },
  focusRing: {
    width: "2px",
    offset: "2px",
    inset: "-2px",
    offsetTight: "1px",
    color: "var(--ok-text-primary)",
    colorBrand: "var(--ok-palette-primary-main)",
  },
  // Comfortable sizes (rem: they follow the root font size like the spacing they replace).
  density: {
    "control-height-sm": "1.875rem",
    "control-height-md": "2.25rem",
    "control-height-lg": "3rem",
    "control-height-xl": "3.5rem",
    "control-padding-x-sm": "0.5rem",
    "control-padding-x-md": "0.75rem",
    "control-padding-x-lg": "1rem",
    "field-padding-y": "1rem",
    "field-padding-y-sm": "0.5rem",
    "field-padding-x": "0.875rem",
    "item-height": "2.125rem",
    "item-height-sm": "1.875rem",
    "item-padding-y": "0.5rem",
    "item-padding-x": "1rem",
    "chip-height": "2rem",
    "chip-height-sm": "1.5rem",
    "tab-height": "3rem",
    "cell-padding-y": "1rem",
    "cell-padding-y-sm": "0.375rem",
    "cell-padding-x": "1rem",
    "row-height": "3.25rem",
    "row-height-header": "3.5rem",
    "accordion-summary-height": "3.5rem",
    "switch-padding-x": "0.75rem",
    "switch-padding-y": "0.5625rem",
    "switch-padding-x-sm": "0.4375rem",
    "switch-padding-y-sm": "0.25rem",
  },
  icon: { stroke: "1.5" },
  spacing: "0.25rem",
  breakpoints: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  shadows: {
    z1: [{ x: 0, y: 1, blur: 2, spread: 0, alpha: 16 }],
    z4: [{ x: 0, y: 4, blur: 8, spread: 0, alpha: 16 }],
    z8: [{ x: 0, y: 8, blur: 16, spread: 0, alpha: 16 }],
    z12: [{ x: 0, y: 12, blur: 24, spread: -4, alpha: 16 }],
    z16: [{ x: 0, y: 16, blur: 32, spread: -4, alpha: 16 }],
    z20: [{ x: 0, y: 20, blur: 40, spread: -4, alpha: 16 }],
    z24: [{ x: 0, y: 24, blur: 48, spread: 0, alpha: 16 }],
    card: [
      { x: 0, y: 0, blur: 2, spread: 0, alpha: 20 },
      { x: 0, y: 12, blur: 24, spread: -4, alpha: 12 },
    ],
    dropdown: [
      { x: 0, y: 0, blur: 2, spread: 0, alpha: 24 },
      { x: -20, y: 20, blur: 40, spread: -4, alpha: 24 },
    ],
    dialog: [{ x: -40, y: 40, blur: 80, spread: -8, alpha: 24 }],
    // Mirror of `dialog` for surfaces attached to the inline start (left drawers).
    dialogStart: [{ x: 40, y: 40, blur: 80, spread: -8, alpha: 24 }],
  },
  elevation: elevationLayers(),
  colorShadow: { x: 0, y: 8, blur: 16, spread: 0, alpha: 24 },
  zIndex: { mobileStepper: 1000, dropdown: 1200, modal: 1300, toast: 1400, tooltip: 1500 },
  motion: {
    // `enter` / `exit`: entrance and exit animations (Motion); the others: UI transitions.
    duration: {
      shortest: "150ms",
      shorter: "200ms",
      short: "250ms",
      standard: "300ms",
      exit: "480ms",
      enter: "640ms",
      spin: "0.8s",
      spinReduced: "2.4s",
      spinSlow: "1.2s",
      progressRotate: "1.4s",
      progressRotateReduced: "2.8s",
      progressBar: "2.1s",
      progressBarDelay: "1.15s",
      progressBarReduced: "4.2s",
      progressBarReducedDelay: "2.3s",
      progressBuffer: "3s",
      hintDelay: "1s",
      caretBlink: "1.1s",
    },
    easing: {
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      decelerate: "cubic-bezier(0, 0, 0.2, 1)",
      accelerate: "cubic-bezier(0.4, 0, 1, 1)",
      expressive: "cubic-bezier(0.43, 0.13, 0.23, 0.96)",
      inOut: "ease-in-out",
      progress1: "cubic-bezier(0.65, 0.815, 0.735, 0.395)",
      progress2: "cubic-bezier(0.165, 0.84, 0.44, 1)",
    },
  },
};
