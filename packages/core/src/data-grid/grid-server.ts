/*
 * Server data helpers (MUI X `paginationMeta`, `rowCount: -1`, filter debounce), shared by React
 * and the HTML runtime. `-1` is the unknown row count (the Table pagination's own meaning).
 */

/** Extra pagination state from the server (MUI X `GridPaginationMeta`). */
export interface GridPaginationMeta {
  /** With an unknown row count: whether a page follows. `false` fixes the total. */
  hasNextPage?: boolean | undefined;
}

/**
 * The pagination total: `count`, or for an unknown count (`-1`) the rows seen up to this page once
 * the server says no page follows.
 */
export function gridPaginationCount(
  count: number,
  info: { hasNextPage?: boolean | undefined; page: number; pageSize: number; pageRows: number },
): number {
  if (count !== -1 || info.hasNextPage !== false) return count;
  return info.page * info.pageSize + info.pageRows;
}

/**
 * The "1–10 of …" pattern for an unknown total: the estimate while it's still ahead of the page's
 * last row (`to`), else "more than". The result keeps `{from}` and `{to}` for the pagination.
 */
export function gridUnknownCountPattern(
  pattern: string,
  labels: { paginationCountAround: string; paginationCountMoreThan: string },
  estimated: number | undefined,
  to: number,
): string {
  const count =
    estimated !== undefined && estimated > to
      ? labels.paginationCountAround.replaceAll("{count}", String(estimated))
      : labels.paginationCountMoreThan;
  return pattern.replaceAll("{count}", count);
}

export interface GridDebounce {
  /** Runs `fn` after `ms` (at once without a delay); a new run of the same key replaces it. */
  run(key: string, ms: number, fn: () => void): void;
  /** Drops every waiting run. */
  clear(): void;
}

/** One timer per key: each filter field debounces on its own. */
export function createGridDebounce(): GridDebounce {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  return {
    run(key, ms, fn) {
      const waiting = timers.get(key);
      if (waiting !== undefined) clearTimeout(waiting);
      if (ms <= 0) {
        timers.delete(key);
        fn();
        return;
      }
      timers.set(
        key,
        setTimeout(() => {
          timers.delete(key);
          fn();
        }, ms),
      );
    },
    clear() {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    },
  };
}
