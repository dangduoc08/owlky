import { type DataAttributes, defineOptions, flag, optionAttributes } from "../options/define.js";
import { type PaperAnatomyOptions, paperOptions } from "./paper.js";

// --- Card -------------------------------------------------------------------------------------

/** Card (spec: card.md): a Paper root (`data-ok-paper` + `data-ok-card`) with Paper's options. */
export const cardOptions = defineOptions("card", "data-ok-card", {
  ...paperOptions.options,
  raised: flag(
    "data-ok-raised",
    "A raised card: the shadow of elevation 8, whatever `elevation` says. Ignored by `outlined`.",
  ),
});

export interface CardAnatomyOptions extends PaperAnatomyOptions {
  raised?: boolean | undefined;
}

/** `data-ok-*` attributes of a card: Paper's marker first, then the card's own options. */
export const cardAttributes = ({
  elevation,
  ...options
}: CardAnatomyOptions = {}): DataAttributes => ({
  "data-ok-paper": "",
  ...optionAttributes(cardOptions, {
    ...options,
    elevation: elevation === undefined ? undefined : String(elevation),
  }),
});

export const cardActionsOptions = defineOptions("card-actions", "data-ok-card-actions", {
  disableSpacing: flag("data-ok-disable-spacing", "No space between the actions."),
});

export const cardActionsAttributes = (
  options: { disableSpacing?: boolean | undefined } = {},
): DataAttributes => optionAttributes(cardActionsOptions, { ...options });

/** Elements that show media themselves: CardMedia gives them `src` (MUI's media components). */
export const cardMediaElements = ["video", "audio", "picture", "iframe", "img"] as const;

/** Whether CardMedia's element shows the media itself (`src`) or holds a cover `img`. */
export const isCardMediaElement = (element: unknown): boolean =>
  typeof element === "string" && (cardMediaElements as readonly string[]).includes(element);
