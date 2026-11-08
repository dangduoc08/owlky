/*
 * Rating rules (MUI Rating), shared by React and the HTML runtime. Pure.
 */

/** Default accessible label of a value: "1 Star", "2.5 Stars". */
export const defaultRatingLabel = (value: number): string =>
  `${value} Star${value !== 1 ? "s" : ""}`;

/** The values a rating offers: `precision`, 2 × `precision`, …, `max` (MUI: 0.5 → 0.5, 1, 1.5…). */
export function ratingValues(max = 5, precision = 1): number[] {
  const count = Number.isInteger(max) && max > 0 ? max : 5;
  const step = precision > 0 && precision <= 1 ? precision : 1;
  const values: number[] = [];
  for (let value = step; value <= count + 1e-9; value += step)
    values.push(Math.round(value / step) * step);
  return values;
}

/** `value` rounded to the nearest `precision` (MUI `roundValueToPrecision`); invalid → null. */
export function roundRating(value: unknown, precision = 1): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const step = precision > 0 && precision <= 1 ? precision : 1;
  return Math.round(value / step) * step;
}

/** The value after a click: clicking the current value clears it (MUI). */
export const nextRating = (current: number | null, clicked: number): number | null =>
  current === clicked ? null : clicked;
