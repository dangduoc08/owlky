import { Button, Label, Link, Typography } from "@owlky/react";
import { LINKS } from "../../content/home.js";
import { DashboardPreview } from "./dashboard-preview.js";
import { ArrowRightIcon, CheckIcon, GitHubIcon } from "./icons.js";
import { CONTAINER } from "./section-heading.js";

/*
 * The top of the home page: the navigation and the hero sit on a dark band (`data-ok-theme="dark"`
 * keeps it dark in both site themes); the dashboard preview overlaps the band's lower edge and
 * follows the site theme.
 */

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      underline="none"
      color="textPrimary"
      variant="h5"
      className={`inline-flex items-center gap-2 ${className}`}
      aria-label="Owlky home"
    >
      <span data-landing-mark="" aria-hidden="true" />
      Owlky
    </Link>
  );
}

const NAV_LINKS = [
  ["Components", LINKS.components],
  ["Docs", LINKS.getStarted],
  ["Search", LINKS.search],
] as const;

export function LandingHeader() {
  return (
    <header data-landing-header="" data-ok-theme="dark">
      <div className={`${CONTAINER} flex flex-wrap items-center gap-x-6 gap-y-2 py-4`}>
        <Logo />
        <nav aria-label="Main" className="order-last w-full md:order-none md:w-auto">
          <ul className="m-0 flex list-none items-center gap-6 p-0">
            {NAV_LINKS.map(([label, href]) => (
              <li key={href}>
                <Link href={href} underline="hover" color="textSecondary" variant="subtitle2">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <Button
            variant="text"
            color="inherit"
            href={LINKS.github}
            rel="noopener noreferrer"
            startIcon={<GitHubIcon />}
            className="hidden sm:inline-flex"
          >
            GitHub
          </Button>
          <Button variant="contained" color="primary" href={LINKS.getStarted}>
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}

export function Hero({ componentCount }: { componentCount: number }) {
  const facts = [
    `${componentCount} components`,
    "WCAG 2.2 AA",
    "HTML and React parity",
    "MIT license",
  ];
  return (
    <>
      <section data-landing-hero="" data-ok-theme="dark" aria-labelledby="hero-title">
        <div className={`${CONTAINER} flex flex-col items-center text-center`}>
          <Link href="#ai-ready" underline="none" color="textPrimary" data-landing-announce="">
            <Label variant="filled" color="primary">
              New
            </Label>
            <Typography variant="body2" component="span">
              An MCP server for AI coding agents
            </Typography>
            <ArrowRightIcon />
          </Link>
          <Typography variant="h1" component="h1" id="hero-title" data-landing-hero-title="">
            Accessible components,
            <span data-landing-accent=""> in HTML or React.</span>
          </Typography>
          <Typography variant="h6" component="p" color="textSecondary" data-landing-hero-lead="">
            Owlky is one design system for dashboards and web apps: design tokens, themes and{" "}
            {componentCount} components, from buttons to data grids. Use it in plain HTML or through
            framework packages, with the same markup and the same look.
          </Typography>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="contained"
              size="lg"
              href={LINKS.getStarted}
              endIcon={<ArrowRightIcon />}
            >
              Get started
            </Button>
            <Button variant="outlined" color="inherit" size="lg" href={LINKS.components}>
              Browse components
            </Button>
          </div>
          <ul data-landing-facts="" aria-label="Facts about Owlky">
            {facts.map((fact) => (
              <li key={fact}>
                <CheckIcon />
                <Typography variant="body2" component="span" color="textSecondary">
                  {fact}
                </Typography>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <div data-landing-preview="" className={CONTAINER}>
        <DashboardPreview />
      </div>
    </>
  );
}
