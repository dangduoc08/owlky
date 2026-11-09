import {
  type OrganizationChartLineColor,
  type OrganizationChartLineStyle,
  organizationChartAttributes,
  organizationChartStyle,
} from "@owlky/core";
import {
  Children,
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type ReactNode,
} from "react";

/** The children list, only when there are children to show. */
function NodeChildren({ children }: { children?: ReactNode }) {
  if (Children.toArray(children).length === 0) return null;
  return <ul data-ok-organization-chart-children="">{children}</ul>;
}

export interface OrganizationChartProps extends Omit<HTMLAttributes<HTMLUListElement>, "children"> {
  /** Content of the root node, such as a card. */
  label: ReactNode;
  /** The root's children: `OrganizationChartNode` elements. */
  children?: ReactNode;
  /** Height of the connectors between two levels: px, or a CSS length. Default `40`. */
  lineHeight?: number | string | undefined;
  /** Thickness of the connectors: px, or a CSS length. Default `1`. */
  lineWidth?: number | string | undefined;
  /** `divider` (default), `inherit` (the text color) or a palette color (its light tone). */
  lineColor?: OrganizationChartLineColor | undefined;
  /** `solid` (default), `dashed` or `dotted`. */
  lineStyle?: OrganizationChartLineStyle | undefined;
  /** Corner radius where a connector turns: px, or a CSS length. Default `24`. */
  lineBorderRadius?: number | string | undefined;
  /** Space on each side of every node: px, or a CSS length. Default `4`. */
  nodePadding?: number | string | undefined;
}

/**
 * OrganizationChart — spec: specs/components/organization-chart.md. A hierarchy drawn as nested
 * lists (`ul` › `li`) with connector lines. CSS only; the lengths become private custom
 * properties on the root. Name it with `aria-label` / `aria-labelledby`.
 */
export const OrganizationChart = forwardRef<HTMLUListElement, OrganizationChartProps>(
  function OrganizationChart(
    {
      label,
      children,
      lineHeight,
      lineWidth,
      lineColor,
      lineStyle,
      lineBorderRadius,
      nodePadding,
      style,
      ...props
    },
    ref,
  ) {
    const lengths = { lineHeight, lineWidth, lineBorderRadius, nodePadding };
    return (
      <ul
        ref={ref}
        {...organizationChartAttributes({ ...lengths, lineColor, lineStyle })}
        data-ok-runtime="off"
        style={{ ...(organizationChartStyle(lengths) as CSSProperties), ...style }}
        {...props}
      >
        <li data-ok-organization-chart-node="">
          <div data-ok-organization-chart-label="">{label}</div>
          <NodeChildren>{children}</NodeChildren>
        </li>
      </ul>
    );
  },
);

export interface OrganizationChartNodeProps
  extends Omit<LiHTMLAttributes<HTMLLIElement>, "children"> {
  /** Content of the node, such as a card. */
  label: ReactNode;
  /** Child nodes: `OrganizationChartNode` elements. */
  children?: ReactNode;
}

/** OrganizationChartNode — one node (`li`): its label and, below it, its children. */
export const OrganizationChartNode = forwardRef<HTMLLIElement, OrganizationChartNodeProps>(
  function OrganizationChartNode({ label, children, ...props }, ref) {
    return (
      <li ref={ref} data-ok-organization-chart-node="" {...props}>
        <div data-ok-organization-chart-label="">{label}</div>
        <NodeChildren>{children}</NodeChildren>
      </li>
    );
  },
);
