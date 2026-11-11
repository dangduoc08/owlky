import { countUpOptions, motionBorderOptions, motionOptions, motionTextOptions } from "@owlky/core";
import {
  Avatar,
  type AvatarVariant,
  Button,
  Card,
  CountUp,
  Fab,
  IconButton,
  Motion,
  MotionBorder,
  type MotionBorderColor,
  type MotionBorderSecondaryColor,
  MotionGroup,
  MotionText,
  Paper,
  Scrollbar,
  Typography,
} from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { DemoIcon } from "../shared/demo-icon.js";
import type { GroupFiles } from "../shared/snippets.js";
import { MotionLogoDemo } from "./logo-demo.js";
import { OwlLogo } from "./owl-logo.js";

const ITEMS = ["Design", "Develop", "Test", "Review", "Release"];
const SCROLL_ITEMS = Array.from({ length: 40 }, (_, index) => `Item ${index + 1}`);
const SIZES = [
  ["sm", "Small"],
  ["md", "Medium"],
  ["lg", "Large"],
] as const;
type Light = [MotionBorderColor, MotionBorderSecondaryColor?];
const AVATARS: [AvatarVariant, ...Light][] = [
  ["circular", "secondary", "warning"],
  ["circular", "primary"],
  ["circular", "warning", "primary"],
  ["square", "secondary", "info"],
  ["square", "primary"],
  ["square", "warning", "success"],
  ["rounded", "info", "secondary"],
  ["rounded", "primary", "warning"],
  ["rounded", "error", "warning"],
];
/** Border tiles: lights, width and the story class that sets the edges and corners. */
const TILES: [...Light, number, string][] = [
  ["inherit", undefined, 2, "sb-motion-tile"],
  ["primary", undefined, 4, "sb-motion-tile"],
  ["secondary", "error", 4, "sb-motion-tile"],
  ["primary", "warning", 4, "sb-motion-tile sb-motion-square"],
  ["secondary", "error", 4, "sb-motion-tile sb-motion-edges-top-left"],
  ["secondary", "error", 4, "sb-motion-tile sb-motion-edges-top-right"],
  ["secondary", "error", 4, "sb-motion-tile sb-motion-edges-bottom-right"],
  ["secondary", "error", 4, "sb-motion-tile sb-motion-edges-bottom-left"],
  ["secondary", "error", 4, "sb-motion-tile sb-motion-corners-diagonal"],
  ["secondary", "error", 4, "sb-motion-tile sb-motion-corners-antidiagonal"],
  ["secondary", "error", 4, "sb-motion-tile sb-motion-corners-leaf"],
  ["secondary", "error", 4, "sb-motion-tile sb-motion-corners-drop"],
];

/** A card that moves in: the Motion box holds a Card (`.sb-motion-card`: its padding). */
const movingCard = (item: string) => (
  <Motion key={item} variant="fadeInUp">
    <Card className="sb-motion-card">
      <Typography variant="body2">{item}</Typography>
    </Card>
  </Motion>
);

/**
 * Story groups — the same examples as `packages/html/src/components/motion/examples/`. The stage
 * is a flat Paper, the items Cards and the texts Typography; `.sb-motion-*` classes are story-only
 * sizes and layouts, and the image is an original SVG in Storybook's static folder.
 */
export const motionStories: Record<string, ReactGroup[]> = {
  "in-view": [
    {
      title: "Single",
      content: (
        <Paper className="sb-motion-stage" elevation={0}>
          <Motion variant="fadeInUp">
            <img
              className="sb-motion-image"
              src="images/cover-1.svg"
              alt="Abstract waves at dusk"
            />
          </Motion>
        </Paper>
      ),
    },
    {
      title: "Multiple items",
      content: (
        <Paper className="sb-motion-stage" elevation={0}>
          <MotionGroup className="sb-motion-list">{ITEMS.map(movingCard)}</MotionGroup>
        </Paper>
      ),
    },
  ],
  text: [
    {
      title: "Text object",
      content: (
        <Paper className="sb-motion-stage" elevation={0}>
          <Typography variant="h3">
            <MotionText variant="fadeInUp">Owlky moves</MotionText>
          </Typography>
        </Paper>
      ),
    },
  ],
  scroll: [
    {
      title: "Scroll",
      content: (
        <Scrollbar aria-label="Animated items" className="sb-motion-scroll">
          <div className="sb-motion-list">{SCROLL_ITEMS.map(movingCard)}</div>
        </Scrollbar>
      ),
    },
  ],
  background: [
    {
      title: "Ken Burns",
      content: (
        <div className="sb-motion-frame">
          <Motion variant="kenburnsTop">
            <img
              className="sb-motion-image"
              src="images/cover-1.svg"
              alt="Abstract waves at dusk"
            />
          </Motion>
        </div>
      ),
    },
    {
      title: "Pan",
      content: <Motion variant="panTop" className="sb-motion-gradient" />,
    },
    {
      title: "Color change",
      content: (
        <Motion variant="color3x">
          <Typography variant="h3">Owlky</Typography>
        </Motion>
      ),
    },
  ],
};

/** The reference's "Other" sections. */
export const otherStories: Record<string, ReactGroup[]> = {
  "tap-hover": [
    {
      title: "Tap & hover",
      content: (
        <div className="sb-motion-other">
          <Motion variant="interactive">
            <img
              className="sb-motion-image"
              src="images/cover-1.svg"
              alt="Abstract waves at dusk"
            />
          </Motion>
          <div className="sb-row">
            {SIZES.map(([size, label]) => (
              <Fab key={size} size={size} color="primary" animate aria-label={`Add (${label})`}>
                <DemoIcon name="plus" />
              </Fab>
            ))}
          </div>
          <div className="sb-row">
            {SIZES.map(([size, label]) => (
              <IconButton
                key={size}
                size={size}
                color="primary"
                animate
                aria-label={`Add (${label})`}
              >
                <DemoIcon name="plus" />
              </IconButton>
            ))}
          </div>
          <div className="sb-row">
            {SIZES.map(([size, label]) => (
              <Motion key={size} variant="interactive">
                <Button variant="contained" color="primary" size={size}>
                  {label}
                </Button>
              </Motion>
            ))}
          </div>
        </div>
      ),
    },
  ],
  path: [
    {
      title: "Path",
      content: (
        <Motion variant="draw">
          <OwlLogo label="Owlky logo" />
        </Motion>
      ),
    },
  ],
  "count-up": [
    {
      title: "Count up",
      content: (
        <div className="sb-motion-counts">
          <Typography variant="h2" component="span">
            <CountUp end={500} suffix="+" />
          </Typography>
          <Typography variant="h2" component="span">
            <CountUp start={200} end={500.14} decimals={2} suffix="k" />
          </Typography>
        </div>
      ),
    },
  ],
  logo: [
    {
      title: "Logo",
      content: <MotionLogoDemo />,
    },
  ],
  avatar: [
    {
      title: "Avatar",
      content: (
        <div className="sb-motion-avatars">
          {AVATARS.map(([variant, color, secondaryColor], index) => (
            <MotionBorder
              key={`${variant}-${color}-${secondaryColor}`}
              shape={variant === "circular" ? "circle" : "rounded"}
              color={color}
              secondaryColor={secondaryColor}
              className={`sb-motion-avatar sb-motion-avatar-${variant}`}
            >
              <Avatar
                variant={variant}
                size={108}
                src={`avatars/avatar-${(index % 7) + 1}.svg`}
                alt={`Team member ${index + 1}`}
              />
            </MotionBorder>
          ))}
        </div>
      ),
    },
  ],
  border: [
    {
      title: "Border",
      content: (
        <div className="sb-motion-other">
          <div className="sb-motion-tiles">
            {TILES.map(([color, secondaryColor, width, className]) => (
              <MotionBorder
                key={className + color + secondaryColor}
                color={color}
                secondaryColor={secondaryColor}
                width={width}
                className={className}
              />
            ))}
          </div>
          <div className="sb-row">
            <MotionBorder color="secondary" secondaryColor="error" className="sb-motion-rounded">
              <Button variant="text" color="inherit" size="lg">
                Text button
              </Button>
            </MotionBorder>
            <MotionBorder
              color="primary"
              secondaryColor="warning"
              width={3}
              className="sb-motion-rounded"
            >
              <Button variant="contained" color="inherit" size="lg">
                Button
              </Button>
            </MotionBorder>
          </div>
        </div>
      ),
    },
  ],
};

export const OTHER_FILES: Record<string, GroupFiles> = Object.fromEntries(
  Object.keys(otherStories).map((story) => [
    story,
    [[otherStories[story]?.[0]?.title as string, "group"]],
  ]),
);

/** Count up: the count's length. */
export const COUNT_UP_CONTROLS = { schema: countUpOptions, keys: ["duration"] } as const;
/** Turning borders: a pause control and their speed. */
export const MOTION_BORDER_CONTROLS = {
  schema: motionBorderOptions,
  keys: ["paused", "width", "duration"],
} as const;
/** Path: the length of the drawing. */
export const MOTION_DRAW_CONTROLS = { schema: motionOptions, keys: ["duration"] } as const;

export const MOTION_FILES: Record<string, GroupFiles> = {
  "in-view": [
    ["Single", "single"],
    ["Multiple items", "multiple"],
  ],
  text: [["Text object", "group"]],
  scroll: [["Scroll", "group"]],
  background: [
    ["Ken Burns", "kenburns"],
    ["Pan", "pan"],
    ["Color change", "color"],
  ],
};

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const MOTION_CONTROLS = {
  schema: motionOptions,
  keys: ["variant", "duration", "distance"],
} as const;

/** Looping backgrounds: a pause control (WCAG 2.2.2) and their length. */
export const MOTION_LOOP_CONTROLS = {
  schema: motionOptions,
  keys: ["paused", "duration"],
} as const;

/** Logo: its loops need a pause control (WCAG 2.2.2); the keyframes set their own lengths. */
export const MOTION_LOGO_CONTROLS = { schema: motionOptions, keys: ["paused"] } as const;

export const MOTION_TEXT_CONTROLS = {
  schema: motionTextOptions,
  keys: ["variant", "duration", "stagger"],
} as const;
