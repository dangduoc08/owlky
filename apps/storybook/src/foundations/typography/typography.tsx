import {
  defaultTheme,
  type PaletteColorName,
  paletteColorNames,
  type TypographyVariant,
} from "@owlky/tokens";
import type { CSSProperties } from "react";
import { CodeBlock } from "../shared/code-block.js";

const ROOT_FONT_SIZE = 16;
const withPx = (rem: string) => `${rem} (${Number.parseFloat(rem) * ROOT_FONT_SIZE}px)`;

/** The variant's definition as JSON (sizes annotated in px, responsive sizes as media queries). */
export function variantDefinition(variant: TypographyVariant): string {
  const style = defaultTheme.typography.variants[variant];
  const json: Record<string, unknown> = {
    fontFamily:
      style.fontFamily === "secondary"
        ? "var(--ok-font-family-secondary)"
        : "var(--ok-font-family)",
    fontWeight: style.fontWeight,
    fontSize: withPx(style.fontSize),
    lineHeight: Number(Number(style.lineHeight).toFixed(2)),
  };
  if (style.textTransform && style.textTransform !== "none")
    json["textTransform"] = style.textTransform;
  for (const [breakpoint, size] of Object.entries(style.responsiveFontSize ?? {})) {
    const minWidth = defaultTheme.breakpoints[breakpoint as keyof typeof defaultTheme.breakpoints];
    json[`@media (min-width:${minWidth}px)`] = { fontSize: withPx(size) };
  }
  return JSON.stringify(json, null, 2);
}

/** Inline style rendering a variant from its CSS variables (so it is responsive). */
export const variantStyle = (variant: TypographyVariant): CSSProperties => ({
  margin: 0,
  fontFamily: `var(--ok-typography-${variant}-font-family)`,
  fontSize: `var(--ok-typography-${variant}-font-size)`,
  fontWeight: `var(--ok-typography-${variant}-font-weight)`,
  lineHeight: `var(--ok-typography-${variant}-line-height)`,
  textTransform: `var(--ok-typography-${variant}-text-transform)` as CSSProperties["textTransform"],
});

export interface TypographySampleProps {
  variant: TypographyVariant;
  /** Sample text. */
  text?: string;
}

/** A typography variant rendered from its tokens, next to its definition. */
export function TypographySample({
  variant,
  text = "How can you choose a typeface?",
}: TypographySampleProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
      <p data-variant={variant} className="min-w-60 flex-1" style={variantStyle(variant)}>
        {text}
      </p>
      <CodeBlock label={`${variant} definition`} className="w-full sm:w-96">
        {variantDefinition(variant)}
      </CodeBlock>
    </div>
  );
}

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

const TEXT_COLORS = [
  ["Text primary", "--ok-text-primary"],
  ["Text secondary", "--ok-text-secondary"],
  ["Text disabled", "--ok-text-disabled"],
] as const;

function ColorParagraph({ title, variable }: { title: string; variable: string }) {
  return (
    <div
      style={{ color: `var(${variable})` }}
      data-demo-disabled={variable === "--ok-text-disabled" || undefined}
    >
      <h3 className="m-0 mb-1 text-subtitle1">{title}</h3>
      <p className="m-0 mb-1 text-body2">{LOREM}</p>
      <code className="text-caption">{variable}</code>
    </div>
  );
}

/** Text colors: the neutral text tokens and the AA-safe text tone of each palette color. */
export function TextColors() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <div className="flex flex-col gap-6">
        {TEXT_COLORS.map(([title, variable]) => (
          <ColorParagraph key={variable} title={title} variable={variable} />
        ))}
      </div>
      <div className="flex flex-col gap-6">
        {paletteColorNames.map((name: PaletteColorName) => (
          <ColorParagraph
            key={name}
            title={name.charAt(0).toUpperCase() + name.slice(1)}
            variable={`--ok-palette-${name}-text`}
          />
        ))}
      </div>
    </div>
  );
}
