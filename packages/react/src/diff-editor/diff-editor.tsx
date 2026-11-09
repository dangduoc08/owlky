"use client";

import { diffEditorAttributes } from "@owlky/core";
import {
  type CodeEditorStatus,
  type CodeEditorTheme,
  createDiffEditorController,
  type DiffEditorController,
  type DiffEditorInstance,
  type DiffEditorOptions,
  type Monaco,
} from "@owlky/core/code-editor";
import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { optionsAttribute, sizeStyle } from "../code-editor/code-editor.js";

export type { DiffEditorInstance, DiffEditorOptions } from "@owlky/core/code-editor";

export interface DiffEditorProps {
  /** The original text. */
  original?: string | undefined;
  /** The modified text: a new value replaces it as one undoable edit. */
  modified?: string | undefined;
  /** Language of both models. */
  language?: string | undefined;
  /** Language of the original model (default `language`). */
  originalLanguage?: string | undefined;
  /** Language of the modified model (default `language`). */
  modifiedLanguage?: string | undefined;
  /** Path of the original model. */
  originalModelPath?: string | undefined;
  /** Path of the modified model. */
  modifiedModelPath?: string | undefined;
  /** Keeps the original model when the editor unmounts. */
  keepCurrentOriginalModel?: boolean | undefined;
  /** Keeps the modified model when the editor unmounts. */
  keepCurrentModifiedModel?: boolean | undefined;
  /** Default `"auto"`: Owlky's light or dark theme, after the scope's `data-ok-theme`. */
  theme?: CodeEditorTheme | undefined;
  /** Shown until Monaco is ready. Default "Loading...". */
  loading?: ReactNode;
  /** Monaco diff editor options (`IStandaloneDiffEditorConstructionOptions`). */
  options?: DiffEditorOptions | undefined;
  /** Default `"100%"`. A number is in pixels. */
  width?: number | string | undefined;
  /** Default `"100%"` (at least 300px when not given). A number is in pixels. */
  height?: number | string | undefined;
  /** Class of the element Monaco mounts on. */
  className?: string | undefined;
  /** Props of the root element. */
  wrapperProps?: HTMLAttributes<HTMLDivElement> | undefined;
  /** Called with Monaco before the diff editor is created. */
  beforeMount?: ((monaco: Monaco) => void) | undefined;
  /** Called with the diff editor and Monaco once mounted. */
  onMount?: ((editor: DiffEditorInstance, monaco: Monaco) => void) | undefined;
  /** Called when Monaco couldn't load (the two textareas are shown). */
  onError?: ((error: unknown) => void) | undefined;
}

/**
 * Diff editor — spec: specs/components/code-editor.md (ADR-0034). Monaco's diff editor through
 * the core controller shared with the HTML runtime; mirrors `@monaco-editor/react`'s `DiffEditor`.
 */
export const DiffEditor = forwardRef<HTMLDivElement, DiffEditorProps>(function DiffEditor(
  {
    original,
    modified,
    language,
    originalLanguage,
    modifiedLanguage,
    originalModelPath,
    modifiedModelPath,
    keepCurrentOriginalModel = false,
    keepCurrentModifiedModel = false,
    theme,
    loading = "Loading...",
    options,
    width,
    height,
    className,
    wrapperProps,
    beforeMount,
    onMount,
    onError,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<DiffEditorController | null>(null);
  const [status, setStatus] = useState<CodeEditorStatus>("loading");
  const callbacks = useRef({ beforeMount, onMount, onError });
  callbacks.current = { beforeMount, onMount, onError };
  const labels = {
    original: options?.originalAriaLabel ?? "Original",
    modified: options?.modifiedAriaLabel ?? "Modified",
  };
  const monacoOptions: DiffEditorOptions = {
    originalAriaLabel: labels.original,
    modifiedAriaLabel: labels.modified,
    ...options,
  };
  const initial = useRef({
    original,
    modified,
    language,
    originalLanguage,
    modifiedLanguage,
    originalModelPath,
    modifiedModelPath,
    keepCurrentOriginalModel,
    keepCurrentModifiedModel,
    theme: theme ?? "auto",
    options: monacoOptions,
  });
  const setRoot = (node: HTMLDivElement | null) => {
    rootRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  useEffect(() => {
    const controller = createDiffEditorController(
      contentRef.current as HTMLDivElement,
      {
        ...initial.current,
        beforeMount: (monaco) => callbacks.current.beforeMount?.(monaco),
        onMount: (mounted, monaco) => callbacks.current.onMount?.(mounted, monaco),
        onStatusChange(next, error) {
          setStatus(next);
          if (next === "error") callbacks.current.onError?.(error);
        },
      },
      rootRef.current as HTMLDivElement,
    );
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.update({ originalModelPath, modifiedModelPath });
  }, [originalModelPath, modifiedModelPath]);
  useEffect(() => {
    if (original !== undefined) controllerRef.current?.update({ original });
  }, [original]);
  useEffect(() => {
    if (modified !== undefined) controllerRef.current?.update({ modified });
  }, [modified]);
  useEffect(() => {
    controllerRef.current?.update({ language, originalLanguage, modifiedLanguage });
  }, [language, originalLanguage, modifiedLanguage]);
  useEffect(() => {
    controllerRef.current?.update({ theme: theme ?? "auto" });
  }, [theme]);
  const optionsKey = JSON.stringify(monacoOptions);
  // biome-ignore lint/correctness/useExhaustiveDependencies: compared by content (inline objects).
  useEffect(() => {
    controllerRef.current?.update({ options: monacoOptions });
  }, [optionsKey]);

  return (
    <div
      ref={setRoot}
      {...wrapperProps}
      {...diffEditorAttributes({
        language,
        originalLanguage,
        modifiedLanguage,
        theme,
        width,
        height,
        keepCurrentOriginalModel,
        keepCurrentModifiedModel,
      })}
      data-ok-original-model-path={originalModelPath || undefined}
      data-ok-modified-model-path={modifiedModelPath || undefined}
      data-ok-options={optionsAttribute(options)}
      data-ok-status={status}
      data-ok-runtime="off"
      style={{ ...sizeStyle(width, height), ...wrapperProps?.style }}
    >
      <textarea
        data-ok-diff-editor-original=""
        aria-label={labels.original}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        wrap="off"
        defaultValue={original ?? ""}
      />
      <textarea
        data-ok-diff-editor-modified=""
        aria-label={labels.modified}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        wrap="off"
        defaultValue={modified ?? ""}
      />
      <div data-ok-diff-editor-loading="" role="status">
        {loading}
      </div>
      <div ref={contentRef} data-ok-diff-editor-content="" className={className} />
    </div>
  );
});
