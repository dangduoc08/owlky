import { Label, Typography } from "@owlky/react";
import { Fragment, type ReactNode } from "react";

/* Shared pieces of the home page's sections. */

/** Text with `code` spans written between backticks (content data stays plain strings). */
export function InlineCode({ children }: { children: string }) {
  return children.split("`").map((part, index) =>
    index % 2 ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: parts of a static string.
      <code key={index} data-landing-code="">
        {part}
      </code>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: parts of a static string.
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

/** A section's tag, `h2` and introduction, centered. */
export function SectionHeading({
  id,
  tag,
  icon,
  title,
  children,
}: {
  id: string;
  tag: string;
  icon?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto mb-12 flex max-w-[45rem] flex-col items-center gap-4 text-center md:mb-16">
      <Label color="primary" startIcon={icon}>
        {tag}
      </Label>
      <Typography variant="h2" component="h2" id={id} className="m-0" data-landing-title="">
        {title}
      </Typography>
      {children ? (
        <Typography
          variant="body1"
          color="textSecondary"
          component="p"
          className="m-0"
          data-landing-lead=""
        >
          {children}
        </Typography>
      ) : null}
    </div>
  );
}

/** The page's content width: 1200px, with 16px side gutters on phones and 24px from 600px. */
export const CONTAINER = "mx-auto w-full max-w-[75rem] px-4 sm:px-6";
