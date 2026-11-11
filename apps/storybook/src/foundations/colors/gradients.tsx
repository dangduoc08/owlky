import { Paper, Typography } from "@owlky/react";
import { type PaletteColorName, paletteColorNames } from "@owlky/tokens";
import type { CSSProperties, ReactNode } from "react";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** Gradient text: the text gradient clipped to the glyphs, the text color transparent. */
const gradientText = (name: PaletteColorName): CSSProperties => ({
  color: "transparent",
  backgroundImage: `var(--ok-gradient-${name}-text)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
});

/** A gradient border: paper on the padding box, the fill gradient on the border box. */
const gradientBorder = (name: PaletteColorName, radius: string): CSSProperties => ({
  display: "grid",
  placeItems: "center",
  width: "10rem",
  height: "10rem",
  border: "4px solid transparent",
  borderRadius: radius,
  background: `linear-gradient(var(--ok-bg-paper), var(--ok-bg-paper)) padding-box, var(--ok-gradient-${name}) border-box`,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <Typography variant="overline" component="h2" color="textSecondary">
        {title}
      </Typography>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </section>
  );
}

/**
 * The gradient tokens (`--ok-gradient-*`) as the reference's Utilities › Gradient sections: text,
 * border, background and paper. They follow the toolbar's Theme and Preset.
 */
export function Gradients() {
  return (
    <div className="flex flex-col gap-8">
      <Section title="Text">
        <Typography variant="h2" component="p" style={gradientText("primary")}>
          Owlky UI
        </Typography>
        {paletteColorNames
          .filter((name) => name !== "primary")
          .map((name) => (
            <Typography key={name} variant="h5" component="p" style={gradientText(name)}>
              {capitalize(name)}
            </Typography>
          ))}
      </Section>
      <Section title="Border">
        <div style={gradientBorder("primary", "var(--ok-radius-lg)")}>
          <Typography variant="body2">Content</Typography>
        </div>
        <div style={gradientBorder("secondary", "50%")}>
          <Typography variant="body2">Content</Typography>
        </div>
      </Section>
      <Section title="Background">
        {paletteColorNames.map((name) => (
          <span
            key={name}
            role="img"
            aria-label={`${capitalize(name)} gradient`}
            className="h-24 w-36 rounded-xl"
            style={{ backgroundImage: `var(--ok-gradient-${name})` }}
          />
        ))}
      </Section>
      <Section title="Paper">
        <div className="relative grid w-full max-w-md p-6">
          <span
            aria-hidden="true"
            className="absolute top-0 left-4 size-28 rounded-full"
            style={{ backgroundImage: "var(--ok-gradient-warning)" }}
          />
          <span
            aria-hidden="true"
            className="absolute right-4 bottom-0 size-24 rounded-full"
            style={{ backgroundImage: "var(--ok-gradient-secondary)" }}
          />
          <Paper
            elevation={0}
            style={{
              display: "grid",
              placeItems: "center",
              height: "10rem",
              background: "var(--ok-gradient-paper)",
              WebkitBackdropFilter: "blur(20px)",
              backdropFilter: "blur(20px)",
            }}
          >
            <Typography variant="subtitle1">Paper</Typography>
          </Paper>
        </div>
      </Section>
    </div>
  );
}
