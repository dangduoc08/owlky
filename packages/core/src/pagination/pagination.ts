/*
 * Which items a pagination shows (pages, ellipses, previous / next / first / last) — the same
 * ranges as MUI's `usePagination`, shared by React and the HTML runtime.
 */

export type PaginationItemType =
  | "page"
  | "first"
  | "last"
  | "next"
  | "previous"
  | "start-ellipsis"
  | "end-ellipsis";

export interface PaginationItemData {
  type: PaginationItemType;
  /** Target page (1-based); `null` for ellipses. */
  page: number | null;
  selected: boolean;
  disabled: boolean;
}

export interface PaginationRangeOptions {
  /** Total pages. Default 1. */
  count?: number | undefined;
  /** Current page, 1-based. Default 1. */
  page?: number | undefined;
  /** Pages always shown at each end. Default 1. */
  boundaryCount?: number | undefined;
  /** Pages always shown on each side of the current one. Default 1. */
  siblingCount?: number | undefined;
  showFirstButton?: boolean | undefined;
  showLastButton?: boolean | undefined;
  hidePrevButton?: boolean | undefined;
  hideNextButton?: boolean | undefined;
  disabled?: boolean | undefined;
}

const range = (start: number, end: number) =>
  Array.from({ length: Math.max(end - start + 1, 0) }, (_, i) => start + i);

/** A whole number ≥ `min`, else the fallback (untrusted input). */
const whole = (value: number | undefined, fallback: number, min: number) =>
  Number.isInteger(value) && (value as number) >= min ? (value as number) : fallback;

/** The items of a pagination, in order. */
export function paginationItems(options: PaginationRangeOptions = {}): PaginationItemData[] {
  const count = whole(options.count, 1, 0);
  const page = Math.min(whole(options.page, 1, 1), Math.max(count, 1));
  const boundary = whole(options.boundaryCount, 1, 0);
  const siblings = whole(options.siblingCount, 1, 0);
  const disabled = options.disabled === true;

  const startPages = range(1, Math.min(boundary, count));
  const endPages = range(Math.max(count - boundary + 1, boundary + 1), count);
  const siblingsStart = Math.max(
    Math.min(page - siblings, count - boundary - siblings * 2 - 1),
    boundary + 2,
  );
  const siblingsEnd = Math.min(
    Math.max(page + siblings, boundary + siblings * 2 + 2),
    endPages.length > 0 ? (endPages[0] as number) - 2 : count - 1,
  );

  const list: (Exclude<PaginationItemType, "page"> | number)[] = [
    ...(options.showFirstButton ? (["first"] as const) : []),
    ...(options.hidePrevButton ? [] : (["previous"] as const)),
    ...startPages,
    ...(siblingsStart > boundary + 2
      ? (["start-ellipsis"] as const)
      : boundary + 1 < count - boundary
        ? [boundary + 1]
        : []),
    ...range(siblingsStart, siblingsEnd),
    ...(siblingsEnd < count - boundary - 1
      ? (["end-ellipsis"] as const)
      : count - boundary > boundary
        ? [count - boundary]
        : []),
    ...endPages,
    ...(options.hideNextButton ? [] : (["next"] as const)),
    ...(options.showLastButton ? (["last"] as const) : []),
  ];

  const target: Record<"first" | "previous" | "next" | "last", number> = {
    first: 1,
    previous: page - 1,
    next: page + 1,
    last: count,
  };

  return list.map((item) => {
    if (typeof item === "number")
      return { type: "page", page: item, selected: item === page, disabled };
    if (item === "start-ellipsis" || item === "end-ellipsis")
      return { type: item, page: null, selected: false, disabled };
    const forward = item === "next" || item === "last";
    return {
      type: item,
      page: target[item],
      selected: false,
      disabled: disabled || (forward ? page >= count : page <= 1),
    };
  });
}

/** Default accessible names, as MUI: "Go to page 3", "page 2" (current), "Go to next page". */
export function defaultPaginationItemLabel(
  type: PaginationItemType,
  page: number | null,
  selected: boolean,
): string {
  if (type === "page") return `${selected ? "" : "Go to "}page ${page}`;
  return `Go to ${type} page`;
}
