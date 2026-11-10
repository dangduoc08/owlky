"use client";

import {
  type AvatarColor,
  type AvatarGroupSpacing,
  type AvatarVariant,
  avatarAttributes,
  avatarGroupAttributes,
  avatarGroupStyle,
  avatarOptions,
  parseNumber,
  progressSize,
} from "@owlky/core";
import {
  Children,
  type CSSProperties,
  cloneElement,
  forwardRef,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useState,
} from "react";

/** Fallback when there is no image, text or children (decorative). */
function PersonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6z" fill="currentColor" />
    </svg>
  );
}

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, "color"> {
  /** Image URL. If it fails to load, the avatar shows `children`, the first letter of `alt` or an icon. */
  src?: string | undefined;
  /** Candidate pictures for `src` at other resolutions (the `srcset` of the `img`). */
  srcSet?: string | undefined;
  /** The `sizes` of the `img`, with `srcSet`. */
  sizes?: string | undefined;
  /** Text alternative of the image (also the source of the fallback letter). */
  alt?: string | undefined;
  /** Circle (default), 12px corners or square. */
  variant?: AvatarVariant | undefined;
  /** Background for letters and icons. Default `"default"` (grey). */
  color?: AvatarColor | undefined;
  /** Width and height: a number in px, or a CSS length. Default `40`. */
  size?: number | string | undefined;
  /** Other attributes of the `<img>`. */
  imgProps?: ImgHTMLAttributes<HTMLImageElement> | undefined;
}

/**
 * Avatar — spec: specs/components/avatar.md. An image, letters or an icon in a circle. Name a
 * letters avatar for assistive technology with `aria-label` (and `role="img"`) when it matters.
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, srcSet, sizes, alt, variant, color, size, imgProps, children, style, ...props },
  ref,
) {
  const [failed, setFailed] = useState<string | null>(null);
  const validSize = parseNumber(avatarOptions.options.size, size);
  const showImage = (src !== undefined || srcSet !== undefined) && failed !== (src ?? srcSet);
  const custom = validSize !== undefined ? { "--_ok-avatar-size": progressSize(validSize) } : {};
  let content: ReactNode = children;
  if (showImage) {
    content = (
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt ?? ""}
        {...imgProps}
        onError={(event) => {
          setFailed(src ?? srcSet ?? null);
          imgProps?.onError?.(event);
        }}
      />
    );
  } else if (content == null) {
    content = alt?.trim() ? alt.trim()[0]?.toUpperCase() : <PersonIcon />;
  }
  return (
    <span
      ref={ref}
      {...avatarAttributes({ variant, color, size: validSize })}
      data-ok-runtime="off"
      style={{ ...(custom as CSSProperties), ...style }}
      {...props}
    >
      {content}
    </span>
  );
});

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Avatars shown at most, the surplus avatar included. Default `5` (at least 2). */
  max?: number | undefined;
  /** Total count (default: the number of children), for the surplus. */
  total?: number | undefined;
  /** Overlap: `medium` (8px, default), `small` (16px) or a number in px. */
  spacing?: AvatarGroupSpacing | number | undefined;
  /** Shape of every avatar. */
  variant?: AvatarVariant | undefined;
  /** Content of the surplus avatar. Default `+N`. */
  renderSurplus?: ((surplus: number) => ReactNode) | undefined;
}

/** AvatarGroup — overlapping avatars with a "+N" surplus when there are more than `max`. */
export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(function AvatarGroup(
  { max = 5, total, spacing, variant, renderSurplus, children, style, ...props },
  ref,
) {
  const avatars = Children.toArray(children).filter(isValidElement) as ReactElement<AvatarProps>[];
  const limit = Math.max(2, Number.isFinite(max) ? Math.floor(max) : 5);
  const count = total ?? avatars.length;
  const shown = count > limit ? limit - 1 : Math.min(avatars.length, limit);
  const surplus = Math.max(0, count - shown);
  const first = avatars[0]?.props;
  return (
    <div
      ref={ref}
      {...avatarGroupAttributes({ spacing })}
      style={{ ...(avatarGroupStyle(spacing) as CSSProperties), ...style }}
      {...props}
    >
      {avatars
        .slice(0, shown)
        .map((avatar) => (variant ? cloneElement(avatar, { variant }) : avatar))}
      {surplus > 0 && (
        <Avatar data-ok-avatar-surplus="" variant={variant ?? first?.variant} size={first?.size}>
          {renderSurplus ? renderSurplus(surplus) : `+${surplus}`}
        </Avatar>
      )}
    </div>
  );
});
