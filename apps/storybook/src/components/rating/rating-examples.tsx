import { ratingOptions } from "@owlky/core";
import { Rating, type RatingSize } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { DemoIcon, type DemoIconName } from "../shared/demo-icon.js";
import type { GroupFiles } from "../shared/snippets.js";

/** A solid heart (decorative), filled with the rating color. */
export function HeartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 20.5 4.2 12.9A5 5 0 0 1 12 6.6a5 5 0 0 1 7.8 6.3Z" />
    </svg>
  );
}

const FACES: DemoIconName[] = ["faceVeryBad", "faceBad", "faceNeutral", "faceGood", "faceVeryGood"];
const FACE_LABELS = ["Very dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very satisfied"];
const SIZES: RatingSize[] = ["xxSmall", "xSmall", "small", "medium", "large"];

/**
 * Story groups — the same examples as `packages/html/src/components/rating/examples/`. Each
 * rating has its own `name`, so the radio ids are stable.
 */
export const ratingStories: Record<string, ReactGroup[]> = {
  controlled: [
    { title: "Controlled", content: <Rating name="rating-controlled" defaultValue={2} /> },
  ],
  "read-only": [
    { title: "Read only", content: <Rating name="rating-read-only" defaultValue={2} readOnly /> },
  ],
  disabled: [
    { title: "Disabled", content: <Rating name="rating-disabled" defaultValue={2} disabled /> },
  ],
  custom: [
    {
      title: "Custom icon and color",
      content: (
        <>
          <Rating
            name="rating-hearts"
            defaultValue={2}
            precision={0.5}
            color="info"
            size="small"
            icon={<HeartIcon />}
            getLabelText={(value) => `${value} Heart${value !== 1 ? "s" : ""}`}
          />
          <Rating
            name="rating-faces"
            defaultValue={2}
            size="small"
            highlightSelectedOnly
            renderIcon={(value) => <DemoIcon name={FACES[value - 1] as DemoIconName} />}
            getLabelText={(value) => FACE_LABELS[value - 1] as string}
          />
        </>
      ),
    },
  ],
  "ten-stars": [
    { title: "10 stars", content: <Rating name="rating-ten" defaultValue={2} max={10} /> },
  ],
  half: [
    {
      title: "Half ratings",
      content: (
        <>
          <Rating name="rating-half" defaultValue={2.5} precision={0.5} />
          <Rating name="rating-half-read-only" defaultValue={2.5} precision={0.5} readOnly />
        </>
      ),
    },
  ],
  sizes: [
    {
      title: "Sizes",
      content: SIZES.map((size) => (
        <Rating key={size} name={`rating-${size}`} defaultValue={2} size={size} />
      )),
    },
  ],
};

export const RATING_FILES: Record<string, GroupFiles> = {
  ...Object.fromEntries(
    Object.entries(ratingStories).map(([story, groups]) => [
      story,
      groups.map((group) => [group.title, "group"] as const),
    ]),
  ),
  hover: [["Hover feedback", "group"]],
};

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const RATING_CONTROLS = { schema: ratingOptions, keys: ["size", "color"] } as const;
