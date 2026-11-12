// --- TextField --------------------------------------------------------------------------------

export const textFieldVariants = ["outlined", "filled", "standard"] as const;
export const textFieldMargins = ["none", "dense", "normal"] as const;
export type TextFieldVariant = (typeof textFieldVariants)[number];
export type TextFieldMargin = (typeof textFieldMargins)[number];
