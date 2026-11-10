import { createElement, type ElementType, type ReactNode, type Ref } from "react";

/** The element props shared by Button, IconButton and Fab (MUI ButtonBase). */
export interface ButtonBaseProps {
  /**
   * The element or component to render, such as a router link. Default: a `<button>`, or the
   * `LinkComponent` when `href` is set.
   */
  component?: ElementType | undefined;
  /** The element or component that renders a link (`href` set, no `component`). Default `"a"`. */
  LinkComponent?: ElementType | undefined;
}

interface RenderOptions extends ButtonBaseProps {
  ref: Ref<unknown>;
  href: string | undefined;
  /** Disabled or loading: links lose `href` (`aria-disabled`), buttons get `disabled`. */
  inactive: boolean;
  /** `aria-busy` while loading (`undefined`: the caller's own). */
  busy: boolean;
  type: string | undefined;
  attributes: Record<string, string | undefined>;
  rest: Record<string, unknown>;
  children?: ReactNode;
}

/**
 * The root of a button-like component (internal): a native `<button type="button">`, an `<a>`
 * when `href` is set (or the `LinkComponent`), or the `component`. Every element but a native
 * button is a link: inactive links lose their `href` and get `role="link"` + `aria-disabled`; a
 * component (a router link) keeps its `href` (it may need it), leaves the tab order and gets
 * `aria-disabled` (the CSS turns pointer events off).
 */
export function renderButtonBase({
  ref,
  component,
  LinkComponent,
  href,
  inactive,
  busy,
  type,
  attributes,
  rest,
  children,
}: RenderOptions) {
  const element: ElementType =
    component !== undefined && !(component === "button" && href !== undefined)
      ? component
      : href !== undefined
        ? (LinkComponent ?? "a")
        : "button";
  if (element === "button") {
    return createElement(
      "button",
      {
        ref,
        type: type ?? "button",
        ...attributes,
        ...rest,
        disabled: inactive,
        "aria-busy": busy ? true : rest["aria-busy"],
      },
      children,
    );
  }
  const intrinsic = typeof element === "string";
  return createElement(
    element,
    {
      ref,
      ...attributes,
      ...rest,
      // Only a given `href`: a router link's own one (from `to`) must not be overwritten.
      ...(href === undefined ? {} : { href: inactive && intrinsic ? undefined : href }),
      role: inactive && intrinsic ? "link" : rest["role"],
      "aria-disabled": inactive ? true : rest["aria-disabled"],
      "aria-busy": busy ? true : rest["aria-busy"],
      ...(inactive && !intrinsic ? { tabIndex: -1 } : {}),
    },
    children,
  );
}
