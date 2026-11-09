import { type ImageRatio, imageOptions } from "@owlky/core";
import { Image, Typography } from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";

/*
 * Image stories. The pictures are original SVG artwork made for these stories
 * (`apps/storybook/public/images/image-<n>.svg`); grids and captions (`.sb-image-*`) are
 * story-only demo markup styled in `.storybook/preview.css`.
 */

/** Picture `n` (1–9) and its text alternative. */
export const PICTURES = [
  "Red and blue waves at dusk",
  "Neon chevrons in the dark",
  "Teal smoke over amber light",
  "Golden flowers on deep green",
  "Violet ribbons on black",
  "Orange silk folds",
  "Sunrise over soft hills",
  "Crimson petals in the night",
  "Blue blossoms at twilight",
] as const;
const src = (n: number) => `images/image-${n}.svg`;
const alt = (n: number) => PICTURES[n - 1] ?? "";

const RATIOS: ImageRatio[] = ["4/3", "3/4", "6/4", "4/6", "16/9", "9/16", "21/9", "9/21", "1/1"];

/**
 * Story groups — the same examples as `packages/html/src/components/image/examples/` (generated
 * from these by `apps/storybook/scripts/image-snippets.mjs`).
 */
export const imageStories: Record<string, ReactGroup[]> = {
  list: [
    {
      title: "List",
      content: (
        <div className="sb-image-grid">
          {PICTURES.map((_, i) => (
            <Image key={src(i + 1)} src={src(i + 1)} alt={alt(i + 1)} ratio="3/2" />
          ))}
        </div>
      ),
    },
  ],
  "aspect-ratio": [
    {
      title: "Aspect ratio",
      content: (
        <div className="sb-image-grid">
          {RATIOS.map((ratio, i) => (
            <div key={ratio} className="sb-image-item">
              <Typography variant="overline" color="textSecondary">
                {ratio}
              </Typography>
              <Image src={src(i + 1)} alt={alt(i + 1)} ratio={ratio} />
            </div>
          ))}
        </div>
      ),
    },
  ],
  overlay: [
    {
      title: "Overlay",
      content: (
        <div className="sb-image-grid">
          <Image src={src(1)} alt={alt(1)} ratio="1/1" overlay="dark" />
          <Image src={src(2)} alt={alt(2)} ratio="1/1" overlay="primary" />
          <Image src={src(2)} alt={alt(2)} ratio="1/1" overlay="info" overlayFrom="secondary" />
          <Image src={src(2)} alt={alt(2)} ratio="1/1" overlay="success" overlayFrom="error" />
        </div>
      ),
    },
  ],
  "fit-and-position": [
    {
      title: "Fit",
      content: (
        <div className="sb-image-grid">
          {(["cover", "contain", "fill", "scale-down"] as const).map((fit) => (
            <div key={fit} className="sb-image-item">
              <Typography variant="overline" color="textSecondary">
                {fit}
              </Typography>
              <Image src={src(4)} alt={alt(4)} ratio="1/1" fit={fit} />
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Position",
      content: (
        <div className="sb-image-grid">
          {(["top", "center", "bottom"] as const).map((position) => (
            <div key={position} className="sb-image-item">
              <Typography variant="overline" color="textSecondary">
                {position}
              </Typography>
              <Image src={src(9)} alt={alt(9)} ratio="21/9" position={position} />
            </div>
          ))}
        </div>
      ),
    },
  ],
  loading: [
    {
      title: "Lazy and visible by default",
      content: (
        <div className="sb-image-grid">
          <div className="sb-image-item">
            <Typography variant="overline" color="textSecondary">
              Lazy, blur effect
            </Typography>
            <Image src={src(5)} alt={alt(5)} ratio="4/3" width={1200} height={900} />
          </div>
          <div className="sb-image-item">
            <Typography variant="overline" color="textSecondary">
              Opacity effect
            </Typography>
            <Image src={src(6)} alt={alt(6)} ratio="4/3" effect="opacity" />
          </div>
          <div className="sb-image-item">
            <Typography variant="overline" color="textSecondary">
              Visible by default
            </Typography>
            <Image src={src(7)} alt={alt(7)} ratio="4/3" visibleByDefault />
          </div>
          <div className="sb-image-item">
            <Typography variant="overline" color="textSecondary">
              Responsive sources
            </Typography>
            <Image
              src={src(8)}
              srcSet={`${src(8)} 1200w, ${src(3)} 600w`}
              sizes="(min-width: 900px) 25vw, 50vw"
              alt={alt(8)}
              ratio="4/3"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Error",
      content: (
        <div className="sb-image-grid">
          <div className="sb-image-item">
            <Typography variant="overline" color="textSecondary">
              Broken picture
            </Typography>
            <Image src="images/missing.svg" alt="Harbor at dawn, unavailable" ratio="4/3" />
          </div>
        </div>
      ),
    },
  ],
};

export const IMAGE_FILES: Record<string, GroupFiles> = {
  list: [["List", "group"]],
  "aspect-ratio": [["Aspect ratio", "group"]],
  overlay: [["Overlay", "group"]],
  "fit-and-position": [
    ["Fit", "fit"],
    ["Position", "position"],
  ],
  loading: [
    ["Lazy and visible by default", "lazy"],
    ["Error", "error"],
  ],
};

/** Story Controls shared by the React and HTML stories (ADR-0015). */
export const IMAGE_CONTROLS = {
  schema: imageOptions,
  keys: ["effect", "disablePlaceholder"],
} as const;
