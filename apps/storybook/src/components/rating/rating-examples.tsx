import { ratingOptions } from "@owlky/core";
import { Rating, type RatingSize } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { SolarIcon, type SolarName } from "../../helpers/solar-icons.js";
import type { GroupFiles } from "../shared/snippets.js";

const FACES: SolarName[] = [
  "confounded-circle-linear",
  "sad-circle-linear",
  "expressionless-circle-linear",
  "smile-circle-linear",
  "emoji-funny-circle-linear",
];
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
            icon={<SolarIcon name="heart-bold" />}
            getLabelText={(value) => `${value} Heart${value !== 1 ? "s" : ""}`}
          />
          <Rating
            name="rating-faces"
            defaultValue={2}
            size="small"
            highlightSelectedOnly
            renderIcon={(value) => <SolarIcon name={FACES[value - 1] as SolarName} />}
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
