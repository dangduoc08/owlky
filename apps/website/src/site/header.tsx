import { Button, Link, TextField } from "@owlky/react";
import NextLink from "next/link";
import { SITE } from "../content/site.js";
import { ThemeSettingsMenus } from "./theme-settings.js";

/* Site header: name, search (a GET form, so it works before the page's script loads), theme
 * settings and the GitHub link. */

function GitHubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="border-0 border-b border-solid border-divider bg-paper">
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 md:px-8">
        <Link
          component={NextLink}
          href="/"
          underline="none"
          color="textPrimary"
          variant="h5"
          className="me-auto"
        >
          {SITE.name}
        </Link>
        <div className="w-full sm:w-64">
          {/* biome-ignore lint/a11y/useSemanticElements: <search> is newer than the browser baseline (ADR-0006). */}
          <form action="/search/" method="get" role="search" aria-label="Site">
            <TextField
              type="search"
              size="small"
              name="q"
              id="site-search"
              label="Search the docs"
              fullWidth
            />
          </form>
        </div>
        <ThemeSettingsMenus />
        <Button
          variant="outlined"
          size="md"
          href={SITE.github}
          startIcon={<GitHubIcon />}
          rel="noopener noreferrer"
        >
          GitHub
        </Button>
      </div>
    </header>
  );
}
