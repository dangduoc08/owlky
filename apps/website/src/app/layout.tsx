import "@fontsource-variable/public-sans";
import "@fontsource-variable/inter";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/nunito-sans";
import "@fontsource/barlow/700.css";
import "@fontsource/barlow/800.css";
import "./globals.css";
import { THEME_SETTINGS_KEY } from "@owlky/core";
import { fontFamilyPresetNames, primaryPresetNames } from "@owlky/tokens";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SITE } from "../content/site.js";

export const dynamic = "force-static";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE.description,
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Applies the saved theme settings before the first paint (no flash of the wrong theme). The
// values are checked against allowlists: storage is untrusted input.
const THEME_SCRIPT = `(function () {
  try {
    var s = JSON.parse(localStorage.getItem(${JSON.stringify(THEME_SETTINGS_KEY)}) || "{}"), d = document.documentElement;
    var modes = ["light", "dark", "system"], presets = ${JSON.stringify(primaryPresetNames)}, fonts = ${JSON.stringify(fontFamilyPresetNames)};
    if (modes.indexOf(s.mode) !== -1) d.setAttribute("data-ok-theme", s.mode);
    if (s.preset !== "default" && presets.indexOf(s.preset) !== -1) d.setAttribute("data-ok-preset", s.preset);
    if (s.font !== "public-sans" && fonts.indexOf(s.font) !== -1) d.setAttribute("data-ok-font", s.font);
  } catch (e) {}
})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The theme script changes these attributes before React hydrates.
    <html lang="en" data-ok-theme="light" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a constant script, no input. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt" />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:m-2">
          Skip to content
        </a>
        {/* The docs pages' frame is the (docs) layout; the home page has its own. */}
        {children}
      </body>
    </html>
  );
}
