import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Carousel,
  CarouselArrows,
  CarouselDots,
  CarouselSlide,
  CarouselViewport,
  Chart,
  Divider,
  Label,
  Link,
  Motion,
  Typography,
} from "@owlky/react";
import {
  componentHref,
  FAQ,
  FEATURED_COMPONENTS,
  LINKS,
  PRINCIPLES,
  WORKS_WITH,
} from "../../content/home.js";
import { MONTHS } from "./dashboard-preview.js";
import { Logo } from "./hero.js";
import {
  ArrowRightIcon,
  BoltIcon,
  BoxIcon,
  FileIcon,
  GitHubIcon,
  LayersIcon,
  ShieldIcon,
  SparkIcon,
  TriangleIcon,
  WindIcon,
} from "./icons.js";
import { CONTAINER, InlineCode, SectionHeading } from "./section-heading.js";
import { Showcase } from "./showcase.js";

/* The home page's sections below the hero. */

const WORKS_WITH_ICONS = {
  HTML: FileIcon,
  React: BoxIcon,
  "Tailwind CSS": WindIcon,
  "Next.js": TriangleIcon,
  Vite: BoltIcon,
} as const;

export function WorksWith() {
  return (
    <section aria-labelledby="works-with" className={`${CONTAINER} py-16 md:py-20`}>
      <Typography
        variant="overline"
        color="textSecondary"
        component="h2"
        id="works-with"
        align="center"
        className="m-0 mb-6 block"
      >
        Works with the tools you already use
      </Typography>
      <ul data-landing-works-with="">
        {WORKS_WITH.map((name) => {
          const Icon = WORKS_WITH_ICONS[name];
          return (
            <li key={name}>
              <Icon />
              <Typography variant="h6" component="span" color="textSecondary">
                {name}
              </Typography>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function WhatYouGet() {
  return (
    <section aria-labelledby="what-you-get" data-landing-dark="" data-ok-theme="dark">
      <div className={`${CONTAINER} py-20 md:py-28`}>
        <SectionHeading
          id="what-you-get"
          tag="Large components"
          icon={<LayersIcon />}
          title="What you get"
        >
          The components that usually need a library of their own, built on the same tokens and
          tested the same way as the buttons.
        </SectionHeading>
        <Showcase />
      </div>
    </section>
  );
}

type Components = readonly { name: string; title: string }[];

const TONES = ["primary", "secondary", "info", "success", "warning", "error"] as const;

const initials = (title: string) => {
  const words = title.split(/[\s-]+/);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? words[0]?.[1] ?? "")).toUpperCase();
};

export function MoreComponents({ components }: { components: Components }) {
  const tiles = FEATURED_COMPONENTS.map((name) => {
    const component = components.find((entry) => entry.name === name);
    if (!component) throw new Error(`home: the manifest has no component "${name}"`);
    return component;
  });
  return (
    <section aria-labelledby="more" data-landing-section="" className={CONTAINER}>
      <SectionHeading
        id="more"
        tag={`${components.length} components`}
        icon={<BoxIcon />}
        title="And much more"
      >
        Inputs, navigation, overlays, feedback, layout and data display: everything a dashboard
        needs, with the same look and the same keyboard support.
      </SectionHeading>
      <ul data-landing-tiles="">
        {tiles.map((component, index) => (
          <li key={component.name}>
            <Card variant="outlined" data-landing-tile="">
              <CardActionArea href={componentHref(component.name)}>
                <Avatar
                  variant="rounded"
                  color={TONES[index % TONES.length]}
                  size={40}
                  aria-hidden="true"
                >
                  {initials(component.title)}
                </Avatar>
                <Typography variant="subtitle2" component="span">
                  {component.title}
                </Typography>
              </CardActionArea>
            </Card>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button
          variant="contained"
          color="inherit"
          href={LINKS.components}
          endIcon={<ArrowRightIcon />}
        >
          Browse components
        </Button>
        <Button variant="outlined" color="inherit" href={LINKS.github} rel="noopener noreferrer">
          See every spec on GitHub
        </Button>
      </div>
    </section>
  );
}

export function Principles({
  unitTestFiles,
  e2eSpecFiles,
}: {
  unitTestFiles: number;
  e2eSpecFiles: number;
}) {
  const slides = [
    ...PRINCIPLES,
    {
      title: "Tested in three browser engines",
      text: `${unitTestFiles} unit test files and ${e2eSpecFiles} end-to-end specs run in Chromium, Firefox and WebKit, with accessibility checks in light and dark themes.`,
    },
  ];
  return (
    <section aria-labelledby="principles" data-landing-section="" data-landing-tinted="">
      <div className={CONTAINER}>
        <SectionHeading
          id="principles"
          tag="Principles"
          icon={<ShieldIcon />}
          title="How Owlky is built"
        />
        <Carousel aria-label="Principles" loop slideSpacing={24} data-landing-carousel="">
          <CarouselViewport>
            {slides.map((slide, index) => (
              <CarouselSlide key={slide.title} aria-label={`${index + 1} of ${slides.length}`}>
                <div data-landing-principle="">
                  <Typography variant="h4" component="h3" className="m-0">
                    {slide.title}
                  </Typography>
                  <Typography
                    variant="h6"
                    component="p"
                    color="textSecondary"
                    className="m-0 font-normal"
                  >
                    <InlineCode>{slide.text}</InlineCode>
                  </Typography>
                </div>
              </CarouselSlide>
            ))}
          </CarouselViewport>
          <div className="mt-8 flex items-center justify-center gap-4">
            <CarouselArrows />
            <CarouselDots />
          </div>
        </Carousel>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section aria-labelledby="faq" data-landing-section="" className={CONTAINER}>
      <SectionHeading id="faq" tag="FAQ" icon={<SparkIcon />} title="Questions and answers">
        Something else on your mind?{" "}
        <Link href={LINKS.issues} color="textPrimary">
          Ask on GitHub
        </Link>
        .
      </SectionHeading>
      <div data-landing-faq="">
        {FAQ.map((item) => (
          <Accordion key={item.question} variant="outlined">
            <AccordionSummary>
              <Typography variant="subtitle1" component="span">
                {item.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="textSecondary" component="p" className="m-0">
                <InlineCode>{item.answer}</InlineCode>{" "}
                {item.question.startsWith("What's next") ? (
                  <Link href={LINKS.roadmap} color="textPrimary">
                    Read the roadmap
                  </Link>
                ) : null}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </div>
    </section>
  );
}

export function CallToAction() {
  return (
    <section aria-labelledby="cta" data-landing-section="" className={CONTAINER}>
      <Motion variant="fadeInUp" distance={32}>
        <Card data-landing-cta="" data-ok-theme="dark" variant="outlined">
          <div className="flex flex-col items-start gap-5 p-8 md:p-14">
            <Typography variant="h2" component="h2" id="cta" className="m-0">
              Start building today.
            </Typography>
            <Typography
              variant="body1"
              color="textSecondary"
              component="p"
              className="m-0 max-w-[32rem]"
            >
              Add one stylesheet and one script to any page, or install the React package. Every
              component is free and open source.
            </Typography>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="contained"
                size="lg"
                href={LINKS.getStarted}
                endIcon={<ArrowRightIcon />}
              >
                Get started
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="lg"
                href={LINKS.github}
                rel="noopener noreferrer"
                startIcon={<GitHubIcon />}
              >
                View on GitHub
              </Button>
            </div>
          </div>
          <div data-landing-cta-preview="">
            <Card variant="outlined">
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <Typography variant="subtitle2" component="p" className="m-0">
                    Conversion rate
                  </Typography>
                  <Label color="success">+3.2%</Label>
                </div>
                <Typography variant="h3" component="p" className="m-0">
                  4.8%
                </Typography>
                <Chart
                  label="Conversion rate by month (sample data)"
                  type="line"
                  sparkline
                  height={72}
                  colors={["primary"]}
                  series={[
                    { name: "Conversion", data: [3.1, 3.4, 3.2, 3.9, 4.1, 3.8, 4.4, 4.6, 4.8] },
                  ]}
                  categories={MONTHS}
                  valueSuffix="%"
                />
              </CardContent>
            </Card>
          </div>
        </Card>
      </Motion>
    </section>
  );
}

const FOOTER = [
  {
    title: "Product",
    links: [
      ["Get started", LINKS.getStarted],
      ["Components", LINKS.components],
      ["Colors", LINKS.colors],
      ["Search", LINKS.search],
    ],
  },
  {
    title: "Docs",
    links: [
      ["Docs for AI (llms.txt)", LINKS.llms],
      ["MCP server", LINKS.mcp],
      ["Roadmap", LINKS.roadmap],
    ],
  },
  {
    title: "Community",
    links: [
      ["GitHub", LINKS.github],
      ["Issues", LINKS.issues],
      ["License", LINKS.license],
    ],
  },
] as const;

export function LandingFooter() {
  return (
    <footer data-landing-footer="">
      <div className={`${CONTAINER} grid gap-10 py-16 md:grid-cols-[2fr_repeat(3,1fr)]`}>
        <div className="flex flex-col items-start gap-3">
          <Logo />
          <Typography
            variant="body2"
            color="textSecondary"
            component="p"
            className="m-0 max-w-[18rem]"
          >
            An accessible UI component library for dashboards and web apps.
          </Typography>
        </div>
        {FOOTER.map((column) => (
          <nav key={column.title} aria-labelledby={`footer-${column.title}`}>
            <Typography
              variant="overline"
              color="textSecondary"
              component="h2"
              id={`footer-${column.title}`}
              className="m-0 mb-4 block"
            >
              {column.title}
            </Typography>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {column.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} color="textPrimary" underline="hover" variant="body2">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className={CONTAINER}>
        <Divider />
        <Typography variant="body2" color="textSecondary" component="p" className="m-0 py-8">
          Owlky is open source under the MIT license. Built with Owlky.
        </Typography>
      </div>
    </footer>
  );
}
