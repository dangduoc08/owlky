import { Button, Label, Typography } from "@owlky/react";
import type { CSSProperties, ReactNode } from "react";

/*
 * "Style components" (Foundations › Settings): the CSS of the guide's examples and the Styled
 * story, Owlky's answer to MUI's `sx`, `styled()` and `keyframes`: plain CSS that reads tokens,
 * state selectors and Tailwind utilities. The guide prints these strings in its code blocks, so
 * the previews and the code can't drift apart.
 */

/** The `style` prop of the upgrade button (MUI's `sx`). */
export const STYLED_UPGRADE: CSSProperties = {
  paddingInline: "calc(var(--ok-spacing) * 6)",
  borderRadius: "var(--ok-radius-full)",
  boxShadow: "var(--ok-shadow-primary)",
};

/** State selectors on a Button and a Popover (MUI's `styled()` with state), two-space indented. */
export const STYLED_STATES_CSS = `  .summary-button:focus-visible {
    outline: 2px solid var(--ok-palette-secondary-main);
    outline-offset: 2px;
  }
  .summary-button[aria-expanded="true"] {
    background-color: var(--ok-palette-primary-dark);
  }
  .summary-button:disabled {
    outline: 1px dashed var(--ok-divider);
  }
  .summary[data-ok-open] {
    border: 1px solid var(--ok-divider);
    box-shadow: var(--ok-shadow-dialog);
  }
`;

/** Keyframes timed with the motion tokens (MUI's `keyframes`), two-space indented. */
export const STYLED_KEYFRAMES_CSS = `  @keyframes new-pulse {
    from {
      box-shadow: 0 0 0 0 rgb(var(--ok-palette-primary-main-channel) / 0.48);
    }
    to {
      box-shadow: 0 0 0 12px rgb(var(--ok-palette-primary-main-channel) / 0);
    }
  }
  .new-label {
    animation: new-pulse var(--ok-duration-enter) var(--ok-easing-decelerate) 3;
  }
  @media (prefers-reduced-motion: reduce) {
    .new-label {
      animation: none;
    }
  }
`;

/** Tailwind classes of the upgrade button. */
export const STYLED_TAILWIND =
  "rounded-full px-6 shadow-z8 hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2";

const COLORS = ["primary", "secondary", "info", "success", "warning"] as const;

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <Typography variant="overline" component="h2" color="textSecondary">
        {title}
      </Typography>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

/**
 * The reference's Utilities › Styled sections with Owlky's tools: the `style` prop and tokens,
 * state selectors, keyframes with the motion tokens, and Tailwind utilities.
 */
export function Styled() {
  return (
    <div className="flex flex-col gap-8">
      <style>{STYLED_STATES_CSS + STYLED_KEYFRAMES_CSS}</style>
      <Group title="With the style prop and tokens">
        {COLORS.map((color) => (
          <Button
            key={color}
            variant="contained"
            color={color}
            style={{ ...STYLED_UPGRADE, boxShadow: `var(--ok-shadow-${color})` }}
          >
            {color.charAt(0).toUpperCase() + color.slice(1)}
          </Button>
        ))}
      </Group>
      <Group title="With state selectors">
        <Button className="summary-button" variant="contained" color="primary">
          Default
        </Button>
        <Button className="summary-button" variant="contained" color="primary" aria-expanded>
          Expanded
        </Button>
        <Button className="summary-button" variant="contained" color="primary" disabled>
          Disabled
        </Button>
      </Group>
      <Group title="With keyframes">
        <Label className="new-label" variant="soft" color="primary">
          New
        </Label>
        <Label className="new-label" variant="soft" color="secondary">
          Beta
        </Label>
      </Group>
      <Group title="With Tailwind CSS">
        <Button className={STYLED_TAILWIND} variant="contained" color="primary">
          Upgrade
        </Button>
      </Group>
    </div>
  );
}
