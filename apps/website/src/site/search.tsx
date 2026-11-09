"use client";

import { Link, TextField, Typography } from "@owlky/react";
import NextLink from "next/link";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";

/*
 * Search (ADR-0040 decision 9): Pagefind's index, built from the static pages after `next build`
 * (scripts/postbuild.mjs). The index and its script are files under /pagefind/; `next dev` has
 * none, so the page says how to build it.
 */

interface PagefindResult {
  url: string;
  excerpt: string;
  meta: { title?: string };
}
interface Pagefind {
  search(query: string): Promise<{ results: { data(): Promise<PagefindResult> }[] }>;
}

let pagefind: Promise<Pagefind> | undefined;
const loadPagefind = () => {
  // A runtime URL: the bundler must leave it alone.
  const url = "/pagefind/pagefind.js";
  pagefind ??= import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url);
  return pagefind;
};

/** Pagefind's excerpt (escaped text with `<mark>`) as React nodes, without parsing it as HTML. */
function Excerpt({ html }: { html: string }) {
  const parts = html.split(/<\/?mark>/);
  const decode = (text: string) =>
    new DOMParser().parseFromString(`<p>${text}</p>`, "text/html").body.textContent ?? "";
  return (
    <>
      {parts.map((part, i) =>
        // biome-ignore lint/suspicious/noArrayIndexKey: fragments of one static excerpt.
        i % 2 ? <mark key={i}>{decode(part)}</mark> : <span key={i}>{decode(part)}</span>,
      )}
    </>
  );
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; query: string; results: PagefindResult[] }
  | { status: "unavailable" };

export function SiteSearch() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const run = useRef(0);

  const search = async (text: string) => {
    const id = ++run.current;
    if (!text.trim()) {
      setState({ status: "idle" });
      return;
    }
    setState({ status: "loading" });
    try {
      const found = await (await loadPagefind()).search(text);
      const results = await Promise.all(found.results.slice(0, 10).map((r) => r.data()));
      if (id === run.current) setState({ status: "done", query: text, results });
    } catch {
      if (id === run.current) setState({ status: "unavailable" });
    }
  };

  // The header's search form opens this page with `?q=`.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once, with the URL's query.
  useEffect(() => {
    const initial = new URLSearchParams(location.search).get("q") ?? "";
    setQuery(initial);
    void search(initial);
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    history.replaceState(null, "", query ? `?q=${encodeURIComponent(query)}` : location.pathname);
    void search(query);
  };

  let output: ReactNode = null;
  if (state.status === "loading")
    output = <Typography color="textSecondary">Searching…</Typography>;
  if (state.status === "unavailable")
    output = (
      <Typography color="textSecondary">
        Search works on the built site. Run `pnpm website:build`, then `pnpm website:serve`.
      </Typography>
    );
  if (state.status === "done")
    output =
      state.results.length === 0 ? (
        <Typography color="textSecondary">No pages match “{state.query}”.</Typography>
      ) : (
        <ol className="m-0 list-none p-0" data-site-results="">
          {state.results.map((result) => (
            <li key={result.url} className="mb-6">
              <Link component={NextLink} href={result.url} variant="h6">
                {result.meta.title ?? result.url}
              </Link>
              <Typography variant="body2" color="textSecondary" className="m-0 mt-1">
                <Excerpt html={result.excerpt} />
              </Typography>
            </li>
          ))}
        </ol>
      );

  return (
    <div data-pagefind-ignore="all">
      {/* biome-ignore lint/a11y/useSemanticElements: <search> is newer than the browser baseline (ADR-0006). */}
      <form role="search" aria-label="Docs" onSubmit={submit} className="mb-8 max-w-[36rem]">
        <TextField
          type="search"
          name="q"
          id="search-query"
          label="Search the docs"
          value={query}
          onChange={setQuery}
          fullWidth
        />
      </form>
      <div aria-live="polite">{output}</div>
    </div>
  );
}
