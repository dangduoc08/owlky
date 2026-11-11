import { Avatar, AvatarGroup } from "@owlky/react";

const COLORS = [
  { name: "Orange", value: "#FF9800" },
  { name: "Deep purple", value: "#673AB7" },
  { name: "Light green", value: "#8BC34A" },
  { name: "Teal", value: "#009688" },
  { name: "Indigo", value: "#3F51B5" },
  { name: "Light blue", value: "#03A9F4" },
  { name: "Blue grey", value: "#607D8B" },
  { name: "Green", value: "#4CAF50" },
  { name: "Cyan", value: "#00BCD4" },
  { name: "Lime", value: "#CDDC39" },
  { name: "Pink", value: "#E91E63" },
  { name: "Amber", value: "#FFC107" },
  { name: "Purple", value: "#9C27B0" },
  { name: "Deep orange", value: "#FF5722" },
  { name: "Brown", value: "#795548" },
  { name: "Blue", value: "#2196F3" },
  { name: "Red", value: "#F44336" },
  { name: "Yellow", value: "#FFEB3B" },
  { name: "Grey", value: "#9E9E9E" },
];
const SHOWN = 6;

/** A product's colors: the first six as overlapping dots, then how many more. */
export function ColorPreviewDemo() {
  const names = COLORS.slice(0, SHOWN).map((color) => color.name);
  const label = `${COLORS.length} colors: ${names.join(", ")} and ${COLORS.length - SHOWN} more`;
  return (
    <AvatarGroup max={SHOWN + 1} spacing={6} role="img" aria-label={label}>
      {COLORS.map(({ value }) => (
        <Avatar key={value} swatch={value} size={16} />
      ))}
    </AvatarGroup>
  );
}
