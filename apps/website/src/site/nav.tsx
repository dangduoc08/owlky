"use client";

import { Link, Typography } from "@owlky/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import type { PageGroup } from "../content/types.js";

export interface NavItem {
  path: string;
  title: string;
  group: PageGroup;
}

/* Site navigation: the pages by group; the current page has `aria-current="page"`. */

const GROUPS: PageGroup[] = ["Overview", "Foundations", "Components"];

export function SiteNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  const current = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return (
    <nav aria-label="Docs" className="flex flex-wrap gap-x-8 gap-y-4 md:block">
      {GROUPS.map((group) => (
        <div key={group} className="md:mb-6">
          <Typography
            variant="overline"
            color="textSecondary"
            component="p"
            id={`nav-${group.toLowerCase()}`}
            className="m-0 mb-1"
          >
            {group}
          </Typography>
          <ul aria-labelledby={`nav-${group.toLowerCase()}`} className="m-0 list-none p-0">
            {items
              .filter((page) => page.group === group)
              .map((page) => (
                <li key={page.path}>
                  <Link
                    component={NextLink}
                    href={page.path}
                    underline="hover"
                    color={current === page.path ? "textPrimary" : "textSecondary"}
                    variant="body2"
                    aria-current={current === page.path ? "page" : undefined}
                    className="inline-block py-1.5 font-semibold aria-[current=page]:underline"
                  >
                    {page.path === "/" ? "Home" : page.title}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
