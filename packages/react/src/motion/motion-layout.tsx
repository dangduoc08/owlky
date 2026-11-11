"use client";
/*
 * Layout animations — spec: specs/components/motion.md (Layout), ADR-0062 (5.4). Framer Motion's
 * `layout`, `layoutId`, `layoutDependency`, `onLayoutAnimationStart` / `-Complete` on Motion and
 * `LayoutGroup`. A class component takes the box before React changes the DOM
 * (`getSnapshotBeforeUpdate`), core `createLayoutNode` measures after the commit and animates.
 */
import {
  type LayoutGroup as CoreLayoutGroup,
  createLayoutGroup,
  createLayoutNode,
  type LayoutMode,
  type LayoutNode,
  type LayoutNodeOptions,
  type LayoutTransition,
  motionLayoutAttributes,
} from "@owlky/core";
import {
  Component,
  createContext,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

/** Layout props of Motion (Framer Motion's names). */
export interface MotionLayoutProps {
  /**
   * Animates changes of its position and size when it re-renders: `true` (both), `"position"`
   * (the size changes at once) or `"size"` (the position changes at once).
   */
  layout?: LayoutMode | undefined;
  /**
   * Shared element: when a Motion with this id mounts as another one with the same id unmounts
   * (or while it is still there), it animates from that Motion's box. Implies `layout`.
   */
  layoutId?: string | undefined;
  /** Measures only when this value changes, not on every render. */
  layoutDependency?: unknown;
  /** A layout animation of its own box started. */
  onLayoutAnimationStart?: (() => void) | undefined;
  /** That layout animation ended (not when another one interrupted it). */
  onLayoutAnimationComplete?: (() => void) | undefined;
}

export const LAYOUT_PROPS = [
  "layout",
  "layoutId",
  "layoutDependency",
  "onLayoutAnimationStart",
  "onLayoutAnimationComplete",
] as const satisfies readonly (keyof MotionLayoutProps)[];

/** Splits `props` into the layout props and the others. */
export function splitLayoutProps<P extends MotionLayoutProps>(
  props: P,
): [MotionLayoutProps, Omit<P, (typeof LAYOUT_PROPS)[number]>] {
  const layout: Record<string, unknown> = {};
  const rest = { ...props } as Record<string, unknown>;
  for (const key of LAYOUT_PROPS) {
    if (key in rest) {
      layout[key] = rest[key];
      delete rest[key];
    }
  }
  return [layout as MotionLayoutProps, rest as Omit<P, (typeof LAYOUT_PROPS)[number]>];
}

const LayoutGroupContext = createContext<CoreLayoutGroup | undefined>(undefined);

export interface LayoutGroupProps {
  /** Prefixes the `layoutId`s inside it, so two groups can use the same ids. */
  id?: string | undefined;
  /**
   * `true` (default): joins an enclosing group (its id and its snapshots); `"id"`: only its id;
   * `false`: neither.
   */
  inherit?: boolean | "id" | undefined;
  children?: ReactNode;
}

/**
 * LayoutGroup — spec: specs/components/motion.md (Framer Motion's `LayoutGroup`). Motions with
 * `layout` inside it animate together: when one of them re-renders, every other one (without a
 * `layoutDependency`) is measured too, so siblings that move because of it animate as well.
 * Renders no element.
 */
export function LayoutGroup({ id, inherit = true, children }: LayoutGroupProps): ReactElement {
  const parent = useContext(LayoutGroupContext);
  const joined = inherit !== false && parent?.id;
  const groupId = joined ? (id ? `${parent.id}-${id}` : parent.id) : id;
  const share = inherit === true ? parent : undefined;
  const group = useMemo(() => createLayoutGroup(groupId, share), [groupId, share]);
  return <LayoutGroupContext.Provider value={group}>{children}</LayoutGroupContext.Provider>;
}

interface MeasureProps {
  node: RefObject<LayoutNode | null>;
  dependency: unknown;
}

/** Takes the layout snapshot before React changes the DOM (the class lifecycle runs then). */
class LayoutMeasure extends Component<MeasureProps> {
  override getSnapshotBeforeUpdate(previous: MeasureProps): null {
    const node = this.props.node.current;
    const { dependency } = this.props;
    if (node && (dependency === undefined || !Object.is(dependency, previous.dependency)))
      node.snapshot();
    return null;
  }

  override componentDidUpdate(): void {
    // Required next to getSnapshotBeforeUpdate; core measures after the commit.
  }

  override render(): null {
    return null;
  }
}

/**
 * Runs a core layout node on `ref` while `layout` or `layoutId` is set. Returns the attributes
 * the HTML markup carries and the element that takes the snapshots (render it next to the root).
 */
export function useMotionLayout(
  ref: RefObject<HTMLElement | null>,
  props: MotionLayoutProps,
  transition: LayoutTransition | undefined,
): { attributes: ReturnType<typeof motionLayoutAttributes>; measure: ReactElement } {
  const group = useContext(LayoutGroupContext);
  const node = useRef<LayoutNode | null>(null);
  const latest = useRef({ props, transition });
  latest.current = { props, transition };
  const active = Boolean(props.layout) || Boolean(props.layoutId);
  const options = (): LayoutNodeOptions => {
    const { props: p, transition: t } = latest.current;
    return {
      layout: p.layout,
      layoutId: p.layoutId,
      group,
      dependent: p.layoutDependency !== undefined,
      transition: t,
      onLayoutAnimationStart: () => latest.current.props.onLayoutAnimationStart?.(),
      onLayoutAnimationComplete: () => latest.current.props.onLayoutAnimationComplete?.(),
    };
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: options() reads the latest props.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!active || !element) return;
    const made = createLayoutNode(element, options());
    node.current = made;
    return () => {
      made.destroy();
      node.current = null;
    };
  }, [ref, active, props.layoutId, group]);
  // The latest props after every render.
  useLayoutEffect(() => {
    node.current?.setOptions(options());
  });
  return {
    attributes: motionLayoutAttributes({
      layout: props.layout,
      layoutId: props.layoutId,
      transition,
    }),
    measure: <LayoutMeasure node={node} dependency={props.layoutDependency} />,
  };
}
