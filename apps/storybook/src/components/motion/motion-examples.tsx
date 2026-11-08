import { countUpOptions, motionBorderOptions, motionOptions, motionTextOptions } from "@owlky/core";
import {
  Avatar,
  type AvatarVariant,
  Button,
  CountUp,
  Fab,
  IconButton,
  Motion,
  MotionBorder,
  type MotionBorderColor,
  MotionGroup,
  MotionText,
  Scrollbar,
} from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { DemoIcon } from "../shared/demo-icon.js";
import type { GroupFiles } from "../shared/snippets.js";
import { OwlLogo } from "./owl-logo.js";

const ITEMS = ["Design", "Develop", "Test", "Review", "Release"];
const SCROLL_ITEMS = Array.from({ length: 40 }, (_, index) => `Item ${index + 1}`);
const SIZES = [
  ["sm", "Small"],
  ["md", "Medium"],
  ["lg", "Large"],
] as const;
const BORDERS: MotionBorderColor[] = ["multi", "primary", "secondary", "info", "success", "error"];
const AVATARS: [AvatarVariant, MotionBorderColor][] = [
  ["circular", "multi"],
  ["circular", "primary"],
  ["rounded", "warning"],
  ["square", "secondary"],
];

/**
 * Story groups — the same examples as `packages/html/src/components/motion/examples/`. The stage,
 * cards and gradient box (`.sb-motion-*`) are story-only demo markup; the image is an original SVG
 * in Storybook's static folder.
 */
export const motionStories: Record<string, ReactGroup[]> = {
  "in-view": [
    {
      title: "Single",
      content: (
        <div className="sb-motion-stage">
          <Motion variant="fadeInUp">
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
      title: "Multiple items",
      content: (
        <div className="sb-motion-stage">
          <MotionGroup className="sb-motion-list">
            {ITEMS.map((item) => (
              <Motion key={item} variant="fadeInUp" className="sb-motion-card">
                {item}
              </Motion>
            ))}
          </MotionGroup>
        </div>
      ),
    },
  ],
  text: [
    {
      title: "Text object",
      content: (
        <div className="sb-motion-stage">
          <h3 className="sb-motion-heading">
            <MotionText variant="fadeInUp">Owlky moves</MotionText>
          </h3>
        </div>
      ),
    },
  ],
  scroll: [
    {
      title: "Scroll",
      content: (
        <Scrollbar aria-label="Animated items" className="sb-motion-scroll">
          <div className="sb-motion-list">
            {SCROLL_ITEMS.map((item) => (
              <Motion key={item} variant="fadeInUp" className="sb-motion-card">
                {item}
              </Motion>
            ))}
          </div>
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
          <h3 className="sb-motion-heading">Owlky</h3>
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
          <CountUp end={98} suffix="%" />
          <CountUp end={200} suffix="k" />
        </div>
      ),
    },
  ],
  logo: [
    {
      title: "Logo",
      content: (
        <div className="sb-row">
          <MotionBorder shape="circle" color="primary" width={3} className="sb-motion-ring">
            <OwlLogo size={64} label="Owlky logo" />
          </MotionBorder>
          <MotionBorder shape="circle" className="sb-motion-ring">
            <OwlLogo size={40} label="Owlky logo, small" />
          </MotionBorder>
        </div>
      ),
    },
  ],
  avatar: [
    {
      title: "Avatar",
      content: (
        <div className="sb-row">
          {AVATARS.map(([variant, color], index) => (
            <MotionBorder
              key={`${variant}-${color}`}
              shape={variant === "circular" ? "circle" : "rounded"}
              color={color}
              width={3}
            >
              <Avatar
                variant={variant}
                size={72}
                src={`avatars/avatar-${index + 1}.svg`}
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
          <div className="sb-row">
            {BORDERS.map((color) => (
              <MotionBorder key={color} color={color} className="sb-motion-box">
                {color === "multi" ? "Multi" : color.charAt(0).toUpperCase() + color.slice(1)}
              </MotionBorder>
            ))}
          </div>
          <div className="sb-row">
            <MotionBorder>
              <Button variant="text">Text button</Button>
            </MotionBorder>
            <MotionBorder color="primary">
              <Button variant="soft" color="primary">
                Soft button
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

export const MOTION_TEXT_CONTROLS = {
  schema: motionTextOptions,
  keys: ["variant", "duration", "stagger"],
} as const;
