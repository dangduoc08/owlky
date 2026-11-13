import { Button, Card, CardActions, CardContent, Label, Typography } from "@owlky/react";
import { type StyleName, styleNames, styles } from "@owlky/tokens";
import type { ReactNode } from "react";

/*
 * Live samples for Foundations › Styles: the same few components inside a scope per style, so
 * each sample shows only what the style changes (fonts, shape, lines, shadows, colors, case).
 */

/** Google Fonts stylesheet URL of a style's families. */
export const fontLink = (id: StyleName) =>
  `https://fonts.googleapis.com/css2?${styles[id].fontLinks.map((family) => `family=${family}`).join("&")}&display=swap`;

/** What each style looks like, in one sentence (docs list and the samples' captions). */
export const STYLE_SUMMARIES: Record<StyleName, string> = {
  soft: "Rounded shapes, soft two-layer shadows and an indigo primary on zinc greys, set in Nunito. The default.",
  swiss: "Square shapes and 1px ink lines instead of shadows, with tight Inter headings.",
  bauhaus:
    "Square shapes, 2px black borders, pill chips and capital Montserrat headings and labels.",
  brutalism: "Square shapes and 1px lines, set entirely in IBM Plex Mono.",
  "neo-brutalism": "Rounded shapes with 2px borders and hard offset shadows, set in Space Grotesk.",
  editorial:
    "Square shapes and rules, black Noto Serif Display headings, Source Serif 4 text and spaced Archivo capitals for labels.",
  "minimal-mono": "Greys only: an ink primary, soft shadows and Inter.",
  corporate: "Small radii, subtle shadows and IBM Plex Sans.",
  nordic: "Rounded shapes, soft shadows tinted with warm greys, a teal primary and Manrope.",
};

/** A style scope with the page background behind its sample. */
export function StyleScope({
  id,
  children,
  ...axes
}: {
  id: StyleName;
  children: ReactNode;
  "data-ok-density"?: string;
  "data-ok-contrast"?: string;
  "data-ok-surface"?: string;
}) {
  return (
    <div
      data-ok-style={id}
      {...axes}
      className="flex min-w-0 flex-col gap-3 p-4"
      style={{
        backgroundColor: "var(--ok-bg-default)",
        color: "var(--ok-text-primary)",
        fontFamily: "var(--ok-font-family)",
      }}
    >
      {children}
    </div>
  );
}

/** The sample: a card with a heading, text, a label and two buttons. */
export function StyleSample({ id, title }: { id: StyleName; title?: string }) {
  const name = styles[id].name;
  return (
    <Card>
      <CardContent>
        <Label variant="soft" color="primary">
          {id === "soft" ? "Default" : "Opt-in"}
        </Label>
        <Typography variant="h5" component="h3">
          {title ?? name}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Revenue grew 12% this month.
        </Typography>
      </CardContent>
      <CardActions>
        <Button variant="contained" color="primary" size="sm">
          Export
        </Button>
        <Button variant="outlined" color="inherit" size="sm">
          Share
        </Button>
      </CardActions>
    </Card>
  );
}

/** Every style side by side. */
export function AllStyles() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {styleNames.map((id) => (
        <StyleScope key={id} id={id}>
          <StyleSample id={id} />
        </StyleScope>
      ))}
    </div>
  );
}

/** One style with each axis switched on: compact density, contrast surface, high contrast. */
export function StyleAxes({ id = "soft" }: { id?: StyleName }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StyleScope id={id}>
        <StyleSample id={id} title="Default" />
      </StyleScope>
      <StyleScope id={id} data-ok-density="compact">
        <StyleSample id={id} title="Compact" />
      </StyleScope>
      <StyleScope id={id} data-ok-surface="contrast">
        <StyleSample id={id} title="Contrast surface" />
      </StyleScope>
      <StyleScope id={id} data-ok-contrast="high">
        <StyleSample id={id} title="High contrast" />
      </StyleScope>
    </div>
  );
}
