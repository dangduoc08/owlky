"use client";

import {
  type CollapseCallbacks,
  type CollapseController,
  type CollapseEasing,
  type CollapseOrientation,
  type CollapseTimeout,
  collapseAttributes,
  collapseStyle,
  createCollapseController,
} from "@owlky/core";
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
  forwardRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useMergedRefs } from "../utils/refs.js";

export interface CollapseOwnProps extends CollapseCallbacks {
  /** Open (`true`) or closed. The element carries `hidden` while closed. Default `false`. */
  in?: boolean | undefined;
  /** `"vertical"` (default) animates the height, `"horizontal"` the width. */
  orientation?: CollapseOrientation | undefined;
  /** Size kept while closed: a number in px, or a CSS length (`"2rem"`). Default 0. */
  collapsedSize?: number | string | undefined;
  /**
   * Duration in ms, `"auto"` (from the distance travelled), or `{ enter, exit }`. Default
   * `--ok-duration-standard`.
   */
  timeout?: CollapseTimeout | undefined;
  /** A CSS easing (`var(--ok-easing-*)` included) or `{ enter, exit }`. Default `--ok-easing-standard`. */
  easing?: CollapseEasing | undefined;
  /** Animates even when the user prefers reduced motion. */
  disablePrefersReducedMotion?: boolean | undefined;
  /** Renders the children only once it first opens. */
  mountOnEnter?: boolean | undefined;
  /** Removes the children once it has closed (and before it first opens). */
  unmountOnExit?: boolean | undefined;
  children?: ReactNode;
}

/**
 * Props of a Collapse rendered as `C` (default `"div"`): its own props plus those of `C` (for
 * example, `disablePadding` with `component={List}`).
 */
export type CollapseProps<C extends ElementType = "div"> = CollapseOwnProps & {
  /**
   * The element or component to render: `"div"` (default), `"ul"`, `List`… It must forward its
   * ref and the props it gets to its root element.
   */
  component?: C | undefined;
} & Omit<ComponentPropsWithoutRef<C>, keyof CollapseOwnProps | "component" | "hidden">;

type ImplementationProps = CollapseOwnProps &
  Omit<HTMLAttributes<HTMLElement>, "hidden" | "children"> & {
    component?: ElementType | undefined;
  };

/** The core controller watches `hidden` and animates the size. */
const CollapseImplementation = forwardRef<HTMLElement, ImplementationProps>(function Collapse(
  {
    in: inProp = false,
    orientation,
    collapsedSize,
    timeout,
    easing,
    disablePrefersReducedMotion,
    mountOnEnter,
    unmountOnExit,
    component: Component = "div",
    onEnter,
    onEntering,
    onEntered,
    onExit,
    onExiting,
    onExited,
    style,
    children,
    ...props
  },
  ref,
) {
  const node = useRef<HTMLElement | null>(null);
  const controller = useRef<CollapseController | null>(null);
  const merged = useMergedRefs<HTMLElement>(node, ref);
  const [rendered, setRendered] = useState(inProp || !(mountOnEnter || unmountOnExit));
  if (inProp && !rendered) setRendered(true);

  const latest = useRef({ inProp, unmountOnExit });
  latest.current = { inProp, unmountOnExit };
  const options = {
    orientation,
    collapsedSize,
    timeout,
    easing,
    onEnter,
    onEntering,
    onEntered,
    onExit,
    onExiting,
    onExited(element: HTMLElement) {
      if (latest.current.unmountOnExit && !latest.current.inProp) setRendered(false);
      onExited?.(element);
    },
  };

  const sizes = collapseStyle({ collapsedSize, orientation });
  const sizeStyle = Object.keys(sizes).length > 0 ? (sizes as CSSProperties) : undefined;

  useLayoutEffect(() => {
    const element = node.current as HTMLElement;
    const created = createCollapseController(element);
    controller.current = created;
    return () => {
      created.destroy();
      controller.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    controller.current?.update(options);
  });

  return (
    <Component
      ref={merged}
      {...collapseAttributes({
        orientation,
        collapsedSize,
        timeout,
        easing,
        disablePrefersReducedMotion,
      })}
      hidden={!inProp}
      data-ok-runtime="off"
      style={sizeStyle || style ? { ...sizeStyle, ...style } : undefined}
      {...props}
    >
      {rendered ? children : null}
    </Component>
  );
});

/**
 * Collapse — spec: specs/components/collapse.md, ADR-0044. Shows or hides its content by
 * animating its height (or width) from the collapsed size.
 */
export const Collapse = CollapseImplementation as <C extends ElementType = "div">(
  props: CollapseProps<C> & { ref?: Ref<HTMLElement> | undefined },
) => ReactElement | null;
