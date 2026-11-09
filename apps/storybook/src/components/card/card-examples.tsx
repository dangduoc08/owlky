import { cardOptions } from "@owlky/core";
import {
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  IconButton,
  Image,
  Typography,
} from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import { DemoIcon } from "../shared/demo-icon.js";
import type { GroupFiles } from "../shared/snippets.js";

/*
 * The same markup as `packages/html/src/components/card/examples/<story>-<file>.html` (generated
 * from these examples by `apps/storybook/scripts/card-snippets.mjs`). Pictures are the story's own
 * (`apps/storybook/public/images`); `sb-card*` classes are story-only demo sizes and layouts
 * (`.storybook/preview.css`).
 */

const wordCard = (
  <>
    <CardContent>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Word of the day
      </Typography>
      <Typography variant="h5" component="div">
        ser•en•dip•i•ty
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        noun
      </Typography>
      <Typography variant="body2">
        finding something good without looking for it.
        <br />
        “a happy serendipity”
      </Typography>
    </CardContent>
    <CardActions>
      <Button size="sm">Learn more</Button>
    </CardActions>
  </>
);

export const basicGroups: ReactGroup[] = [
  { title: "Basics", content: <Card className="sb-card sb-card-word">{wordCard}</Card> },
];

export const outlinedGroups: ReactGroup[] = [
  {
    title: "Outlined card",
    content: (
      <Card className="sb-card sb-card-word" variant="outlined">
        {wordCard}
      </Card>
    ),
  },
];

const hillsText = (
  <CardContent>
    <Typography variant="h5" component="div" gutterBottom>
      Hills
    </Typography>
    <Typography variant="body2" color="textSecondary">
      Hills rise above the land around them and are lower and gentler than mountains. Most are
      shaped over thousands of years by wind, water and ice.
    </Typography>
  </CardContent>
);

export const mediaGroups: ReactGroup[] = [
  {
    title: "Background image",
    content: (
      <Card className="sb-card">
        <CardMedia
          className="sb-card-media"
          image="images/image-7.svg"
          title="Sunrise over hills"
        />
        {hillsText}
        <CardActions>
          <Button size="sm">Share</Button>
          <Button size="sm">Learn more</Button>
        </CardActions>
      </Card>
    ),
  },
  {
    title: "Image element",
    content: (
      <Card className="sb-card">
        <CardMedia
          component="img"
          height="140"
          src="images/image-7.svg"
          alt="Sunrise over soft hills"
        />
        {hillsText}
        <CardActions>
          <Button size="sm">Share</Button>
          <Button size="sm">Learn more</Button>
        </CardActions>
      </Card>
    ),
  },
  {
    title: "Image component",
    content: (
      <Card className="sb-card">
        <CardMedia component={Image} ratio="16/9" src="images/image-9.svg" alt="Blue blossoms" />
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>
            Blossoms
          </Typography>
          <Typography variant="body2" color="textSecondary">
            The Image component loads the picture lazily behind a placeholder and crops it to a
            ratio.
          </Typography>
        </CardContent>
      </Card>
    ),
  },
];

const smokeArea = (
  <>
    <CardMedia component="img" height="140" src="images/image-3.svg" alt="Teal smoke" />
    <CardContent>
      <Typography variant="h5" component="div" gutterBottom>
        Smoke
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Smoke is a cloud of tiny particles and gases that rises from something burning and drifts
        with the air around it.
      </Typography>
    </CardContent>
  </>
);

export const primaryActionGroups: ReactGroup[] = [
  {
    title: "Action area",
    content: (
      <Card className="sb-card">
        <CardActionArea>{smokeArea}</CardActionArea>
      </Card>
    ),
  },
  {
    title: "With supplemental actions",
    content: (
      <Card className="sb-card">
        <CardActionArea>{smokeArea}</CardActionArea>
        <CardActions>
          <Button size="sm" color="primary">
            Share
          </Button>
        </CardActions>
      </Card>
    ),
  },
];

export const uiControlsGroups: ReactGroup[] = [
  {
    title: "Media control card",
    content: (
      <Card className="sb-card-player">
        <div className="sb-card-player-details">
          <CardContent className="sb-card-player-content">
            <Typography variant="h5" component="div">
              Night ribbons
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" component="div">
              The Quiet Hours
            </Typography>
          </CardContent>
          <div className="sb-card-player-controls">
            <IconButton aria-label="Previous">
              <DemoIcon name="skipBack" />
            </IconButton>
            <IconButton size="lg" aria-label="Play">
              <DemoIcon name="play" />
            </IconButton>
            <IconButton aria-label="Next">
              <DemoIcon name="skipForward" />
            </IconButton>
          </div>
        </div>
        <CardMedia
          className="sb-card-player-cover"
          component="img"
          src="images/image-5.svg"
          alt="Night ribbons album cover"
        />
      </Card>
    ),
  },
];

/** Stateless stories: groups, and the snippet file of each group. */
export const cardStories: Record<string, ReactGroup[]> = {
  basics: basicGroups,
  outlined: outlinedGroups,
  media: mediaGroups,
  "primary-action": primaryActionGroups,
  "ui-controls": uiControlsGroups,
};

export const CARD_FILES: Record<string, GroupFiles> = {
  basics: [["Basics", "group"]],
  outlined: [["Outlined card", "group"]],
  media: [
    ["Background image", "background"],
    ["Image element", "img"],
    ["Image component", "image"],
  ],
  "primary-action": [
    ["Action area", "area"],
    ["With supplemental actions", "actions"],
  ],
  "ui-controls": [["Media control card", "group"]],
};

/** Story Controls (ADR-0015): options that change every example at once. */
export const CARD_CONTROLS = {
  schema: cardOptions,
  keys: ["variant", "raised", "square"],
} as const;
