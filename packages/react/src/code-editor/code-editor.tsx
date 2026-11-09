"use client";

import { codeEditorAttributes, codeEditorOptions, parseNumber } from "@owlky/core";
import {
  type CodeEditorChangeEvent,
  type CodeEditorController,
  type CodeEditorInstance,
  type CodeEditorMarker,
  type CodeEditorOptions,
  type CodeEditorOverrideServices,
  type CodeEditorStatus,
  type CodeEditorTheme,
  createCodeEditorController,
  loader,
  type Monaco,
} from "@owlky/core/code-editor";
import {
  type ChangeEvent,
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

export type {
  CodeEditorChangeEvent,
  CodeEditorInstance,
  CodeEditorMarker,
  CodeEditorOptions,
  CodeEditorTheme,
  LoaderConfig,
  Monaco,
} from "@owlky/core/code-editor";
export { loader } from "@owlky/core/code-editor";

export interface CodeEditorProps {
  /** Initial value of the default model (uncontrolled). */
  defaultValue?: string | undefined;
  /** Language of the default model. */
  defaultLanguage?: string | undefined;
  /** Path of the default model (`file:///index.ts`). */
  defaultPath?: string | undefined;
  /** Value of the current model: a new value replaces the content as one undoable edit. */
  value?: string | undefined;
  /** Language of the current model. */
  language?: string | undefined;
  /** Path of the current model: each path is its own model, created on first use. */
  path?: string | undefined;
  /** Default `"auto"`: Owlky's light or dark theme, after the scope's `data-ok-theme`. */
  theme?: CodeEditorTheme | undefined;
  /** Scrolls to this line (1-based). */
  line?: number | undefined;
  /** Shown until Monaco is ready. Default "Loading...". */
  loading?: ReactNode;
  /** Monaco editor options (`IStandaloneEditorConstructionOptions`). */
  options?: CodeEditorOptions | undefined;
  /** Monaco service overrides (mount time). */
  overrideServices?: CodeEditorOverrideServices | undefined;
  /** Default `true`: keeps each path's scroll, selection and folding across model switches. */
  saveViewState?: boolean | undefined;
  /** Keeps the current model when the editor unmounts. */
  keepCurrentModel?: boolean | undefined;
  /** Default `"100%"`. A number is in pixels. */
  width?: number | string | undefined;
  /** Default `"100%"` (at least 300px when not given). A number is in pixels. */
  height?: number | string | undefined;
  /** Class of the element Monaco mounts on. */
  className?: string | undefined;
  /** Props of the root element. */
  wrapperProps?: HTMLAttributes<HTMLDivElement> | undefined;
  /** Called with Monaco before the editor is created (register languages, themes, …). */
  beforeMount?: ((monaco: Monaco) => void) | undefined;
  /** Called with the editor and Monaco once mounted. */
  onMount?: ((editor: CodeEditorInstance, monaco: Monaco) => void) | undefined;
  /** Called with the new value (`event` is `undefined` in the textarea fallback). */
  onChange?: ((value: string, event: CodeEditorChangeEvent | undefined) => void) | undefined;
  /** Called with the current model's markers when they change (validation). */
  onValidate?: ((markers: CodeEditorMarker[]) => void) | undefined;
  /** Called when Monaco couldn't load (the textarea fallback is shown). */
  onError?: ((error: unknown) => void) | undefined;
  /** Accessible name of the editor (Monaco's `ariaLabel`). Default "Code editor". */
  "aria-label"?: string | undefined;
}

const SIZE = codeEditorOptions.options.width;

/** `--_ok-code-editor-width|height` for valid sizes (numbers are pixels). */
export function sizeStyle(width: unknown, height: unknown): CSSProperties {
  const length = (value: unknown) => {
    const parsed = parseNumber(SIZE, value);
    return parsed === undefined ? undefined : typeof parsed === "number" ? `${parsed}px` : parsed;
  };
  const w = length(width);
  const h = length(height);
  return {
    ...(w === undefined ? {} : { "--_ok-code-editor-width": w }),
    ...(h === undefined ? {} : { "--_ok-code-editor-height": h }),
  } as CSSProperties;
}

/** Options written to `data-ok-options` (JSON, as the HTML markup carries them). */
export const optionsAttribute = (options: object | undefined) =>
  options && Object.keys(options).length > 0 ? JSON.stringify(options) : undefined;

/**
 * A textarea holds the value: the form value, and the editor while Monaco can't load. Stable
 * across renders (`write` copies Monaco's value into it; `onInput` reports fallback typing).
 */
export function useFallback(onInput: (value: string) => void) {
  const latest = useRef(onInput);
  latest.current = onInput;
  const [fallback] = useState(() => {
    const ref: RefObject<HTMLTextAreaElement | null> = { current: null };
    return {
      ref,
      write(value: string) {
        // Only called while mounted (the controller is destroyed with the component).
        (ref.current as HTMLTextAreaElement).value = value;
      },
      onInput: (event: ChangeEvent<HTMLTextAreaElement>) => latest.current(event.target.value),
    };
  });
  return fallback;
}

/**
 * Code editor — spec: specs/components/code-editor.md (ADR-0034). Monaco (the editor of VS Code)
 * through the core controller shared with the HTML runtime; mirrors `@monaco-editor/react`'s
 * `Editor` prop by prop. Monaco loads on demand (`loader`); until then `loading` shows, and if it
 * can't load the value stays editable in a textarea.
 */
export const CodeEditor = forwardRef<HTMLDivElement, CodeEditorProps>(function CodeEditor(
  {
    defaultValue,
    defaultLanguage,
    defaultPath,
    value,
    language,
    path,
    theme,
    line,
    loading = "Loading...",
    options,
    overrideServices,
    saveViewState = true,
    keepCurrentModel = false,
    width,
    height,
    className,
    wrapperProps,
    beforeMount,
    onMount,
    onChange,
    onValidate,
    onError,
    "aria-label": ariaLabel = "Code editor",
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<CodeEditorController | null>(null);
  const [status, setStatus] = useState<CodeEditorStatus>("loading");
  const statusRef = useRef(status);
  statusRef.current = status;
  const callbacks = useRef({ beforeMount, onMount, onChange, onValidate, onError });
  callbacks.current = { beforeMount, onMount, onChange, onValidate, onError };
  const fallback = useFallback((next) => {
    if (statusRef.current === "error") callbacks.current.onChange?.(next, undefined);
  });
  const label = options?.ariaLabel ?? ariaLabel;
  const monacoOptions: CodeEditorOptions = { ariaLabel: label, ...options };
  const initial = useRef({
    defaultValue,
    defaultLanguage,
    defaultPath,
    value,
    language,
    path,
    theme: theme ?? "auto",
    line,
    options: monacoOptions,
    overrideServices,
    saveViewState,
    keepCurrentModel,
  });
  const setRoot = (node: HTMLDivElement | null) => {
    rootRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  useEffect(() => {
    const controller = createCodeEditorController(
      contentRef.current as HTMLDivElement,
      {
        ...initial.current,
        beforeMount: (monaco) => callbacks.current.beforeMount?.(monaco),
        onMount: (mounted, monaco) => callbacks.current.onMount?.(mounted, monaco),
        onChange(next, event) {
          fallback.write(next);
          callbacks.current.onChange?.(next, event);
        },
        onValidate: (markers) => callbacks.current.onValidate?.(markers),
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
    // The controller is created once; later prop changes go through `update`.
  }, [fallback]);

  // A new path creates its model from the current defaults (as `@monaco-editor/react`).
  const defaults = useRef({ defaultValue, defaultLanguage });
  defaults.current = { defaultValue, defaultLanguage };
  useEffect(() => {
    controllerRef.current?.update({ ...defaults.current, path });
  }, [path]);
  useEffect(() => {
    if (value !== undefined) {
      controllerRef.current?.update({ value });
      if (!controllerRef.current?.editor) fallback.write(value);
    }
  }, [value, fallback]);
  useEffect(() => {
    if (language !== undefined) controllerRef.current?.update({ language });
  }, [language]);
  useEffect(() => {
    controllerRef.current?.update({ theme: theme ?? "auto" });
  }, [theme]);
  useEffect(() => {
    controllerRef.current?.update({ line });
  }, [line]);
  const optionsKey = JSON.stringify(monacoOptions);
  // biome-ignore lint/correctness/useExhaustiveDependencies: compared by content (inline objects).
  useEffect(() => {
    controllerRef.current?.update({ options: monacoOptions });
  }, [optionsKey]);

  const shownLanguage = language ?? defaultLanguage;
  const shownPath = path ?? defaultPath;
  return (
    <div
      ref={setRoot}
      {...wrapperProps}
      {...codeEditorAttributes({
        language: shownLanguage,
        theme,
        width,
        height,
        line,
        keepCurrentModel,
      })}
      data-ok-path={shownPath || undefined}
      data-ok-save-view-state={saveViewState ? undefined : "false"}
      data-ok-options={optionsAttribute(options)}
      data-ok-status={status}
      data-ok-runtime="off"
      style={{ ...sizeStyle(width, height), ...wrapperProps?.style }}
    >
      <textarea
        ref={fallback.ref}
        data-ok-code-editor-value=""
        aria-label={label}
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        wrap="off"
        defaultValue={value ?? defaultValue ?? ""}
        onChange={fallback.onInput}
      />
      <div data-ok-code-editor-loading="" role="status">
        {loading}
      </div>
      <div ref={contentRef} data-ok-code-editor-content="" className={className} />
    </div>
  );
});

/** Monaco once it has loaded (starts loading it), otherwise `null`. */
export function useMonaco(): Monaco | null {
  const [monaco, setMonaco] = useState<Monaco | null>(() => loader.getMonaco());
  useEffect(() => {
    if (monaco) return;
    const init = loader.init();
    init.then(setMonaco, (error: { type?: string } | undefined) => {
      if (error?.type !== "cancelation") console.error("Monaco couldn't load:", error);
    });
    return () => init.cancel();
  }, [monaco]);
  return monaco;
}
