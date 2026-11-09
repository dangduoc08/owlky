"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  readThemeSettings,
} from "@owlky/react";
import { useState } from "react";

/*
 * **Open HTML demo** (ADR-0040 decision 7): the example's static sandbox page, which loads the
 * CDN bundle, in an iframe. The page itself only runs React.
 */

const sandboxSrc = (url: string) => {
  const { mode, preset, font } = readThemeSettings();
  return `${url}?${new URLSearchParams({ theme: mode, preset, font })}`;
};

export function OpenHtmlDemo({ url, title }: { url: string; title: string }) {
  const [src, setSrc] = useState<string | null>(null);
  return (
    <>
      <Button size="sm" variant="text" onClick={() => setSrc(sandboxSrc(url))} data-site-demo="">
        Open HTML demo
      </Button>
      <Dialog
        open={src !== null}
        onOpenChange={(open) => setSrc(open ? src : null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{title}: HTML demo</DialogTitle>
        <DialogContent>
          {src ? (
            <iframe
              src={src}
              title={`${title}: HTML demo`}
              className="block h-80 w-full rounded-lg border border-solid border-divider bg-paper"
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          {src ? (
            <Link href={src} target="_blank" rel="noopener noreferrer" variant="body2">
              Open in a new tab
            </Link>
          ) : null}
          <Button variant="contained" onClick={() => setSrc(null)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
