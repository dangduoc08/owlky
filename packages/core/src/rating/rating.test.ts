import { describe, expect, it } from "vitest";
import { defaultRatingLabel, nextRating, ratingValues, roundRating } from "./rating.js";

describe("rating helpers", () => {
  it("labels values like MUI", () => {
    expect(defaultRatingLabel(1)).toBe("1 Star");
    expect(defaultRatingLabel(2.5)).toBe("2.5 Stars");
  });

  it("lists the values for max and precision; invalid inputs use 5 and 1", () => {
    expect(ratingValues()).toEqual([1, 2, 3, 4, 5]);
    expect(ratingValues(3, 0.5)).toEqual([0.5, 1, 1.5, 2, 2.5, 3]);
    expect(ratingValues(1, 0.25)).toEqual([0.25, 0.5, 0.75, 1]);
    expect(ratingValues(0, 2)).toEqual([1, 2, 3, 4, 5]);
    expect(ratingValues(2.5, -1)).toEqual([1, 2, 3, 4, 5]);
  });

  it("rounds to the precision; non-numbers → null", () => {
    expect(roundRating(2.3, 0.5)).toBe(2.5);
    expect(roundRating(2.3)).toBe(2);
    expect(roundRating(2.6, 3)).toBe(3);
    expect(roundRating(Number.NaN)).toBeNull();
    expect(roundRating("2")).toBeNull();
    expect(roundRating(null)).toBeNull();
  });

  it("clicking the current value clears it", () => {
    expect(nextRating(3, 3)).toBeNull();
    expect(nextRating(3, 4)).toBe(4);
    expect(nextRating(null, 1)).toBe(1);
  });
});
