/*
 * Shadow geometry per treatment (ADR-0070 § 4.4, ADR-0073). A treatment, not a style, owns its
 * geometry: every style with the same treatment draws the same layers, and its tint
 * (`shadowTint`, the scheme's `--ok-shadow-color`) is what differs. That keeps an opt-in style
 * sheet's shadow block identical across styles (one switch over four treatments).
 */
import type { ShadowLayer, ShadowName, ShadowTreatment } from "./types.js";

const layer = (x: number, y: number, blur: number, spread: number, alpha: number): ShadowLayer => ({
  x,
  y,
  blur,
  spread,
  alpha,
});

export interface TreatmentShadows {
  shadows: Record<ShadowName, ShadowLayer[]>;
  /** Under filled components (`--ok-shadow-<color>`); empty = none. */
  colorShadow: ShadowLayer[];
  /** `colorShadow` takes the scheme's shadow color (ink) instead of the palette color. */
  colorInk: boolean;
}

/*
 * Soft: two layers each, a tight contact shadow and a long, soft one. z1–z8 have no spread: they
 * double as `--ok-drop-shadow-*` filters.
 */
const SOFT: Record<ShadowName, ShadowLayer[]> = {
  z1: [layer(0, 1, 2, 0, 10), layer(0, 1, 3, 0, 8)],
  z4: [layer(0, 1, 2, 0, 10), layer(0, 4, 10, 0, 10)],
  z8: [layer(0, 1, 3, 0, 10), layer(0, 8, 20, 0, 12)],
  z12: [layer(0, 2, 4, 0, 10), layer(0, 12, 30, -4, 12)],
  z16: [layer(0, 2, 6, 0, 10), layer(0, 16, 40, -6, 14)],
  z20: [layer(0, 3, 8, 0, 10), layer(0, 20, 50, -8, 14)],
  z24: [layer(0, 4, 10, 0, 10), layer(0, 24, 60, -10, 16)],
  card: [layer(0, 0, 2, 0, 14), layer(0, 10, 30, -4, 12)],
  dropdown: [layer(0, 0, 2, 0, 18), layer(-16, 16, 40, -4, 18)],
  dialog: [layer(0, 0, 2, 0, 12), layer(-40, 40, 80, -8, 20)],
  dialogStart: [layer(0, 0, 2, 0, 12), layer(40, 40, 80, -8, 20)],
};

/* Subtle: one short layer each, at the alphas Soft already uses (no new private tokens). */
const SUBTLE: Record<ShadowName, ShadowLayer[]> = {
  z1: [layer(0, 1, 2, 0, 10)],
  z4: [layer(0, 1, 3, 0, 12)],
  z8: [layer(0, 2, 6, 0, 12)],
  z12: [layer(0, 3, 8, 0, 12)],
  z16: [layer(0, 4, 10, 0, 14)],
  z20: [layer(0, 5, 12, 0, 14)],
  z24: [layer(0, 6, 14, 0, 16)],
  card: [layer(0, 1, 3, 0, 12)],
  dropdown: [layer(0, 4, 12, 0, 14)],
  dialog: [layer(0, 8, 24, 0, 16)],
  dialogStart: [layer(0, 8, 24, 0, 16)],
};

/* Hard: offsets of 2 / 4 / 6 / 8px without blur, in the ink color (n steps of 2px). */
const HARD_STEPS: Record<ShadowName, number> = {
  z1: 1,
  z4: 2,
  z8: 2,
  z12: 3,
  z16: 3,
  z20: 4,
  z24: 4,
  card: 2,
  dropdown: 2,
  dialog: 4,
  dialogStart: 4,
};
const hard = (step: number): ShadowLayer[] => [layer(step * 2, step * 2, 0, 0, 100)];

const none = () =>
  Object.fromEntries(Object.keys(HARD_STEPS).map((name) => [name, []])) as unknown as Record<
    ShadowName,
    ShadowLayer[]
  >;

/** The shadows of a treatment. */
export function treatmentShadows(treatment: ShadowTreatment): TreatmentShadows {
  switch (treatment) {
    case "soft":
      return { shadows: SOFT, colorShadow: [layer(0, 8, 20, -2, 28)], colorInk: false };
    case "subtle":
      return { shadows: SUBTLE, colorShadow: [layer(0, 2, 6, 0, 20)], colorInk: false };
    case "flat":
      return { shadows: none(), colorShadow: [], colorInk: false };
    case "hard": {
      const shadows = none();
      for (const [name, step] of Object.entries(HARD_STEPS))
        shadows[name as ShadowName] = hard(step);
      return { shadows, colorShadow: hard(1), colorInk: true };
    }
  }
}

/**
 * The named shadow each elevation 1–24 aliases: the nearest one, so Paper's 25 levels follow
 * every treatment (1 → z1, 2–4 → z4, 5–8 → z8 … 21–24 → z24).
 */
export const elevationShadows: readonly ShadowName[] = [
  "z1",
  "z4",
  "z4",
  "z4",
  "z8",
  "z8",
  "z8",
  "z8",
  "z12",
  "z12",
  "z12",
  "z12",
  "z16",
  "z16",
  "z16",
  "z16",
  "z20",
  "z20",
  "z20",
  "z20",
  "z24",
  "z24",
  "z24",
  "z24",
];
