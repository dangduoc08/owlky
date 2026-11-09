import { Button, Typography } from "@owlky/react";
import { DocsShell } from "../site/docs-shell.js";

export default function NotFound() {
  return (
    <DocsShell>
      <article data-pagefind-ignore="all">
        <Typography variant="h2" component="h1" className="m-0 mb-4">
          Page not found
        </Typography>
        <Typography color="textSecondary" className="m-0 mb-8">
          The page you're looking for doesn't exist or has moved.
        </Typography>
        <Button variant="contained" color="inherit" href="/">
          Go to the home page
        </Button>
      </article>
    </DocsShell>
  );
}
