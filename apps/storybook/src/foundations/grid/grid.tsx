const ITEMS = Array.from({ length: 12 }, (_, i) => i + 1);

function Item({ children, className = "" }: { children: number; className?: string }) {
  return (
    <div
      className={`rounded-md bg-paper py-6 text-center text-subtitle1 text-text-secondary shadow-z8 ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export interface SpacingDemoProps {
  /** Spacing step: n × 8px, i.e. `calc(var(--mt-spacing) * 2n)`. */
  spacing: 0 | 1 | 2 | 3 | 4 | 5;
}

/** Gap between items for a spacing step. */
export function SpacingDemo({ spacing }: SpacingDemoProps) {
  return (
    <div
      data-testid="spacing-demo"
      className="flex flex-wrap justify-center"
      style={{ gap: `calc(var(--mt-spacing) * ${spacing * 2})` }}
    >
      {ITEMS.map((item) => (
        <Item key={item} className="w-12">
          {item}
        </Item>
      ))}
    </div>
  );
}

export interface ColumnDemoProps {
  /** Number of equal columns. */
  columns: 1 | 2 | 3 | 4 | 6 | 12;
}

/** Twelve items laid out in equal columns. */
export function ColumnDemo({ columns }: ColumnDemoProps) {
  return (
    <div
      data-testid="column-demo"
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {ITEMS.map((item) => (
        <Item key={item}>{item}</Item>
      ))}
    </div>
  );
}
