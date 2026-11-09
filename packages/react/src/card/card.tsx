import { cardActionsAttributes, isCardMediaElement } from "@owlky/core";
import {
  type AllHTMLAttributes,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  createElement,
  type ElementType,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { Paper, type PaperProps } from "../paper/paper.js";
import { Typography, type TypographyProps } from "../typography/typography.js";

export interface CardProps extends PaperProps {
  /** The shadow of elevation 8, whatever `elevation` says. Ignored by `outlined`. */
  raised?: boolean | undefined;
}

/**
 * Card — spec: specs/components/card.md. A Paper surface (`data-ok-paper` + `data-ok-card`) for
 * content and actions about one subject: Paper's options, the card's radius and shadow.
 */
export const Card = forwardRef<HTMLElement, CardProps>(function Card({ raised, ...props }, ref) {
  return (
    <Paper
      ref={ref}
      data-ok-card=""
      {...(raised === true ? { "data-ok-raised": "" } : {})}
      {...props}
    />
  );
});

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** An `Avatar` at the start. */
  avatar?: ReactNode;
  /** An action at the end, such as an `IconButton`. */
  action?: ReactNode;
  /** The main line: a Typography `h6`. */
  title?: ReactNode;
  /** The second line: a Typography `body2` in the secondary text color. */
  subheader?: ReactNode;
  /** Renders `title` and `subheader` as given, without Typography. */
  disableTypography?: boolean | undefined;
  /** Props of the title's Typography (`variant`, `component`…). */
  titleProps?: TypographyProps | undefined;
  /** Props of the subheader's Typography. */
  subheaderProps?: TypographyProps | undefined;
  /** The root element. Default `"div"`. */
  component?: ElementType | undefined;
}

/** The card's header: avatar, title and subheader, action. */
export const CardHeader = forwardRef<HTMLElement, CardHeaderProps>(function CardHeader(
  {
    avatar,
    action,
    title,
    subheader,
    disableTypography,
    titleProps,
    subheaderProps,
    component = "div",
    children,
    ...props
  },
  ref,
) {
  const typography = disableTypography !== true;
  return createElement(
    component,
    { ref, "data-ok-card-header": "", ...props },
    avatar != null && <div data-ok-card-header-avatar="">{avatar}</div>,
    <div data-ok-card-header-content="">
      {title != null &&
        (typography ? (
          <Typography variant="h6" component="span" {...titleProps} data-ok-card-header-title="">
            {title}
          </Typography>
        ) : (
          title
        ))}
      {subheader != null &&
        (typography ? (
          <Typography
            variant="body2"
            color="textSecondary"
            component="span"
            {...subheaderProps}
            data-ok-card-header-subheader=""
          >
            {subheader}
          </Typography>
        ) : (
          subheader
        ))}
    </div>,
    action != null && <div data-ok-card-header-action="">{action}</div>,
    children,
  );
});

export interface CardContentProps extends HTMLAttributes<HTMLElement> {
  /** The root element. Default `"div"`. */
  component?: ElementType | undefined;
}

/** The card's padded content. */
export const CardContent = forwardRef<HTMLElement, CardContentProps>(function CardContent(
  { component = "div", ...props },
  ref,
) {
  return createElement(component, { ref, "data-ok-card-content": "", ...props });
});

export type CardMediaProps = Omit<AllHTMLAttributes<HTMLElement>, "src"> & {
  /**
   * The element: `"img"`, `"video"`, `"picture"`, `"iframe"` and `"audio"` show the media
   * themselves (`src`); other elements hold a cover image; a component (such as `Image`) gets
   * `src`. Default `"div"`.
   */
  component?: ElementType | undefined;
  /** The media URL. */
  image?: string | undefined;
  /** An alias of `image`. */
  src?: string | undefined;
  /** Other props of a `component` (such as Image's `ratio`). */
  [prop: string]: unknown;
};

/**
 * Media at the card's edge. A media element (`img`, `video`…) or a component gets `src`; any
 * other element holds the picture as a decorative cover `img` (it needs a height).
 */
export const CardMedia = forwardRef<HTMLElement, CardMediaProps>(function CardMedia(
  { component, image, src, children, ...props },
  ref,
) {
  const type = (component ?? "div") as ElementType;
  const url = (image ?? src) as string | undefined;
  const content = children as ReactNode;
  if (isCardMediaElement(type) || typeof type !== "string")
    return createElement(type, { ref, "data-ok-card-media": "", src: url, ...props }, content);
  return createElement(
    type,
    { ref, "data-ok-card-media": "", ...props },
    url !== undefined && <img data-ok-card-media-image="" src={url} alt="" />,
    content,
  );
});

export interface CardActionsProps extends HTMLAttributes<HTMLDivElement> {
  /** No space between the actions. */
  disableSpacing?: boolean | undefined;
}

/** A row of actions, usually at the bottom of the card. */
export const CardActions = forwardRef<HTMLDivElement, CardActionsProps>(function CardActions(
  { disableSpacing, ...props },
  ref,
) {
  return <div ref={ref} {...cardActionsAttributes({ disableSpacing })} {...props} />;
});

export type CardActionAreaAsButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "href"> & {
  href?: undefined;
};

export type CardActionAreaAsLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** Renders an `<a>`: the area is a link. */
  href: string;
  /** Removes `href` and sets `aria-disabled`, so the link can't be followed. */
  disabled?: boolean | undefined;
};

export type CardActionAreaProps = CardActionAreaAsButtonProps | CardActionAreaAsLinkProps;

/**
 * The card's main action: a `<button type="button">` (or an `<a>` with `href`) around media and
 * content, tinted on hover and focus.
 */
export const CardActionArea = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  CardActionAreaProps
>(function CardActionArea(props, ref) {
  if (props.href !== undefined) {
    const { href, disabled, ...anchor } = props as CardActionAreaAsLinkProps;
    return (
      <a
        ref={ref as Ref<HTMLAnchorElement>}
        data-ok-card-action-area=""
        {...anchor}
        href={disabled === true ? undefined : href}
        role={disabled === true ? "link" : anchor.role}
        aria-disabled={disabled === true ? true : anchor["aria-disabled"]}
      />
    );
  }
  const { type = "button", ...button } = props as CardActionAreaAsButtonProps;
  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type={type}
      data-ok-card-action-area=""
      {...button}
    />
  );
});
