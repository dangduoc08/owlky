import { Typography } from "@owlky/react";
import type { Metadata } from "next";
import { SiteSearch } from "../../site/search.js";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Owlky docs.",
  robots: { index: false },
};

export default function Search() {
  return (
    <article data-pagefind-ignore="all">
      <Typography variant="h2" component="h1" className="m-0 mb-8">
        Search
      </Typography>
      <SiteSearch />
    </article>
  );
}
