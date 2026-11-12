import {
  type DataAttributes,
  defineOptions,
  flag,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Transfer list ------------------------------------------------------------------------------

export const transferListVariants = ["simple", "enhanced"] as const;
export type TransferListVariant = (typeof transferListVariants)[number];

export const transferListOptions = defineOptions("transfer-list", "data-ok-transfer-list", {
  variant: style(
    "data-ok-variant",
    transferListVariants,
    "simple",
    "`simple`: four move buttons; `enhanced`: titled lists with select-all and counts.",
  ),
  disabled: flag("data-ok-disabled", "Nothing can be selected or moved."),
  value: state("checked", "Items on each side (`left` / `right`).", "change"),
});

export interface TransferListAnatomyOptions {
  variant?: TransferListVariant | undefined;
  disabled?: boolean | undefined;
}

/** `data-ok-*` attributes of a transfer list. */
export const transferListAttributes = (options: TransferListAnatomyOptions = {}): DataAttributes =>
  optionAttributes(transferListOptions, { ...options });
