"use client";

import { type MarkdownRoot, markdownTreeAsync } from "@owlky/core/markdown";
import { forwardRef, type ReactNode, useEffect, useState } from "react";
import { type MarkdownProps, renderMarkdownRoot, splitMarkdownProps } from "./markdown.js";

export interface MarkdownHooksProps extends MarkdownProps {
  /** Shown while the Markdown is processed. */
  fallback?: ReactNode;
  /** Called when processing fails (the fallback stays). */
  onError?: ((error: unknown) => void) | undefined;
}

/**
 * Markdown with asynchronous plugins in the browser: processes in an effect, shows `fallback`
 * meanwhile (react-markdown's `MarkdownHooks`).
 */
export const MarkdownHooks = forwardRef<HTMLDivElement, MarkdownHooksProps>(function MarkdownHooks(
  { fallback, onError, ...props },
  ref,
) {
  const { options, rest } = splitMarkdownProps(props);
  const [tree, setTree] = useState<MarkdownRoot | null>(null);
  const {
    children,
    remarkPlugins,
    rehypePlugins,
    remarkRehypeOptions,
    allowedElements,
    disallowedElements,
    allowElement,
    unwrapDisallowed,
    skipHtml,
    urlTransform,
    gfm,
    rawHtml,
    sanitizeSchema,
    externalLinks,
    highlighter,
  } = options;

  // biome-ignore lint/correctness/useExhaustiveDependencies: every pipeline option is listed.
  useEffect(() => {
    let current = true;
    markdownTreeAsync(children, options).then(
      (next) => {
        if (current) setTree(next);
      },
      (error: unknown) => {
        if (current) onError?.(error);
      },
    );
    return () => {
      current = false;
    };
  }, [
    children,
    remarkPlugins,
    rehypePlugins,
    remarkRehypeOptions,
    allowedElements,
    disallowedElements,
    allowElement,
    unwrapDisallowed,
    skipHtml,
    urlTransform,
    gfm,
    rawHtml,
    sanitizeSchema,
    externalLinks,
    highlighter,
  ]);

  return renderMarkdownRoot(tree, options, rest, ref, fallback);
});
