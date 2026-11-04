export interface CodeBlockProps {
  /** Accessible name of the scrollable region. */
  label: string;
  children: string;
  className?: string;
}

/** Code sample. Scrolls horizontally on narrow screens, so it is keyboard-focusable (WCAG 2.1.1). */
export function CodeBlock({ label, children, className = "" }: CodeBlockProps) {
  return (
    <section
      aria-label={label}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable regions must be keyboard-reachable.
      tabIndex={0}
      className={`overflow-x-auto rounded-lg bg-grey-200 p-4 dark:bg-grey-800 ${className}`.trim()}
    >
      <pre className="m-0 font-mono text-[0.875rem] leading-[1.5714] text-grey-600 dark:text-grey-400">
        {children}
      </pre>
    </section>
  );
}
