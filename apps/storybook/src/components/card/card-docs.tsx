import { cardActionsOptions, cardOptions } from "@owlky/core";
import {
  Avatar,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  IconButton,
  Typography,
} from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { DemoIcon } from "../shared/demo-icon.js";

const MORE_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5h.01"></path><path d="M12 12h.01"></path><path d="M12 19h.01"></path></svg>`;

export const cardSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "A card groups content and actions about a single subject, such as an article, a product or a contact. A card is a surface built on Paper: it takes Paper's options, with larger corners and a soft card shadow. Inside it, you combine parts: a header, media, content, actions and an action area. Cards need no JavaScript.",
    html: `<!-- Load once per page -->
<link rel="stylesheet" href="${CDN}/owlky.css">

<div data-ok-paper data-ok-card data-ok-variant="elevation" data-ok-elevation="1">
  <div data-ok-card-content>
    <p data-ok-typography data-ok-variant="body2" data-ok-color="textSecondary">Word of the day</p>
    <div data-ok-typography data-ok-variant="h5">serendipity</div>
  </div>
  <div data-ok-card-actions>
    <button type="button" data-ok-button data-ok-variant="text" data-ok-color="inherit" data-ok-size="sm"><span data-ok-button-label>Learn more</span></button>
  </div>
</div>`,
    react: `// Load once, in your app's entry file
import "@owlky/styles/owlky.css";
import { Button, Card, CardActions, CardContent, Typography } from "@owlky/react";

export function WordCard() {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="textSecondary">
          Word of the day
        </Typography>
        <Typography variant="h5" component="div">
          serendipity
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="sm">Learn more</Button>
      </CardActions>
    </Card>
  );
}`,
  },
  {
    id: "surface",
    title: "Change the surface",
    body: "A card takes every Paper option. Set `variant` to `outlined` for a flat card with a thin outline, which suits cards inside other surfaces. Set `elevation` to a level from 0 to 24 for one of Paper's shadows, or add `raised` for the shadow of level 8, such as for a card that is being dragged. The default level, 1, uses the card shadow. Add `square` to remove the corner radius.",
    html: `<div data-ok-paper data-ok-card data-ok-variant="outlined" data-ok-elevation="1">
  <div data-ok-card-content>Outlined</div>
</div>
<div data-ok-paper data-ok-card data-ok-variant="elevation" data-ok-elevation="1" data-ok-raised>
  <div data-ok-card-content>Raised</div>
</div>`,
    react: `import { Card, CardContent } from "@owlky/react";

export function Surfaces() {
  return (
    <>
      <Card variant="outlined">
        <CardContent>Outlined</CardContent>
      </Card>
      <Card raised>
        <CardContent>Raised</CardContent>
      </Card>
    </>
  );
}`,
  },
  {
    id: "header",
    title: "Add a header",
    body: "A card header shows a title and an optional subheader, with an avatar at the start and an action at the end. In React, `CardHeader` wraps the title in a Typography `h6` and the subheader in a Typography `body2` in the secondary text color. Pass `titleProps` or `subheaderProps` to change them, or set `disableTypography` to render your own elements. In HTML, write the same parts.",
    html: `<div data-ok-paper data-ok-card data-ok-variant="elevation" data-ok-elevation="1">
  <div data-ok-card-header>
    <div data-ok-card-header-avatar>
      <span data-ok-avatar data-ok-variant="circular" data-ok-color="primary" role="img" aria-label="Ada Lane">AL</span>
    </div>
    <div data-ok-card-header-content>
      <span data-ok-typography data-ok-variant="h6" data-ok-card-header-title>Ada Lane</span>
      <span data-ok-typography data-ok-variant="body2" data-ok-color="textSecondary" data-ok-card-header-subheader>Product designer</span>
    </div>
    <div data-ok-card-header-action>
      <button type="button" data-ok-icon-button data-ok-color="default" data-ok-size="md" aria-label="More actions">${MORE_ICON}</button>
    </div>
  </div>
  <div data-ok-card-content>
    <p data-ok-typography data-ok-variant="body2">Ada leads the design of the mobile app.</p>
  </div>
</div>`,
    react: `import { Avatar, Card, CardContent, CardHeader, IconButton, Typography } from "@owlky/react";
import { EllipsisVertical } from "lucide-react";

export function ContactCard() {
  return (
    <Card>
      <CardHeader
        avatar={
          <Avatar color="primary" role="img" aria-label="Ada Lane">
            AL
          </Avatar>
        }
        action={
          <IconButton aria-label="More actions">
            <EllipsisVertical aria-hidden="true" />
          </IconButton>
        }
        title="Ada Lane"
        subheader="Product designer"
      />
      <CardContent>
        <Typography variant="body2">Ada leads the design of the mobile app.</Typography>
      </CardContent>
    </Card>
  );
}`,
  },
  {
    id: "media",
    title: "Show media",
    body: "`CardMedia` shows a picture, a video or other media at the edge of the card. With `component` set to `img`, `video`, `picture`, `iframe` or `audio`, the element shows the media itself and fills the card's width. Give it a `height`, and write `alt` on a picture. With another element, such as the default `div`, the picture becomes a decorative cover image that fills the element, so give the element a height in your CSS. To load a picture lazily behind a placeholder, set `component` to the Image component.",
    html: `<div data-ok-paper data-ok-card data-ok-variant="elevation" data-ok-elevation="1">
  <img data-ok-card-media src="lake.jpg" height="140" alt="Mountains above a lake">
  <div data-ok-card-content>
    <p data-ok-typography data-ok-variant="body2">A picture fills the card's width.</p>
  </div>
</div>`,
    react: `import { Card, CardContent, CardMedia, Typography } from "@owlky/react";

export function MediaCard() {
  return (
    <Card>
      <CardMedia
        component="img"
        src="lake.jpg"
        height="140"
        alt="Mountains above a lake"
      />
      <CardContent>
        <Typography variant="body2">A picture fills the card's width.</Typography>
      </CardContent>
    </Card>
  );
}`,
  },
  {
    id: "actions",
    title: "Add actions",
    body: "`CardActions` lays out buttons in a row, usually at the bottom of the card, with 8px between them. Set `disableSpacing` to remove the space, such as for a row of icon buttons. To make the whole card one action, wrap its media and content in `CardActionArea`: a button, or a link when you set `href`. Keep other actions outside the action area, because a button can't contain another one.",
    html: `<div data-ok-paper data-ok-card data-ok-variant="elevation" data-ok-elevation="1">
  <a data-ok-card-action-area href="#articles">
    <div data-ok-card-content>
      <div data-ok-typography data-ok-variant="h5">Read the article</div>
      <p data-ok-typography data-ok-variant="body2" data-ok-color="textSecondary">The whole card opens the article.</p>
    </div>
  </a>
  <div data-ok-card-actions>
    <button type="button" data-ok-button data-ok-variant="text" data-ok-color="primary" data-ok-size="sm"><span data-ok-button-label>Share</span></button>
  </div>
</div>`,
    react: `import { Button, Card, CardActionArea, CardActions, CardContent, Typography } from "@owlky/react";

export function ArticleCard() {
  return (
    <Card>
      <CardActionArea href="#articles">
        <CardContent>
          <Typography variant="h5" component="div">
            Read the article
          </Typography>
          <Typography variant="body2" color="textSecondary">
            The whole card opens the article.
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions>
        <Button size="sm" color="primary">
          Share
        </Button>
      </CardActions>
    </Card>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default. The card takes Paper's options, plus `raised`. `CardActions` has its own option.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the content and the elements of each part. They aren't options, because HTML writes them as markup.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: "Cards have no events or methods. Listen to the native events of the buttons and links inside them, such as `click` on a `CardActionArea`.",
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "A card doesn't take focus. Its action area and the controls inside it keep their native keyboard behavior.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- A card is a visual surface. To make it a landmark or an item of a list, use an element with that meaning, such as \`article\` or \`li\`.
- An action area is one button or link, so its whole content becomes its accessible name. Keep that content short, or set \`aria-label\` to a shorter name.
- The action area shows a focus ring and a tint when it has keyboard focus.
- Write \`alt\` on pictures that carry meaning. Cover images of other elements are decorative.
- Text in the header and content uses the primary and secondary text colors, with a contrast ratio of at least 4.5:1 in the light and dark themes.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <Card className="w-72">
        <CardContent>
          <Typography variant="body2" color="textSecondary">
            Word of the day
          </Typography>
          <Typography variant="h5" component="div">
            serendipity
          </Typography>
        </CardContent>
        <CardActions>
          <Button size="sm">Learn more</Button>
        </CardActions>
      </Card>
    </Preview>
  ),
  surface: () => (
    <Preview>
      <Card className="w-40" variant="outlined">
        <CardContent>Outlined</CardContent>
      </Card>
      <Card className="w-40" raised>
        <CardContent>Raised</CardContent>
      </Card>
    </Preview>
  ),
  header: () => (
    <Preview>
      <Card className="w-80">
        <CardHeader
          avatar={
            <Avatar color="primary" role="img" aria-label="Ada Lane">
              AL
            </Avatar>
          }
          action={
            <IconButton aria-label="More actions">
              <DemoIcon name="moreVertical" />
            </IconButton>
          }
          title="Ada Lane"
          subheader="Product designer"
        />
        <CardContent>
          <Typography variant="body2">Ada leads the design of the mobile app.</Typography>
        </CardContent>
      </Card>
    </Preview>
  ),
  media: () => (
    <Preview>
      <Card className="w-80">
        <CardMedia component="img" src="images/image-7.svg" height="140" alt="Sunrise over hills" />
        <CardContent>
          <Typography variant="body2">A picture fills the card's width.</Typography>
        </CardContent>
      </Card>
    </Preview>
  ),
  actions: () => (
    <Preview>
      <Card className="w-80">
        <CardActionArea href="#articles">
          <CardContent>
            <Typography variant="h5" component="div">
              Read the article
            </Typography>
            <Typography variant="body2" color="textSecondary">
              The whole card opens the article.
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions>
          <Button size="sm" color="primary">
            Share
          </Button>
        </CardActions>
      </Card>
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={cardOptions} />
      <OptionsTable schema={cardActionsOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Card content props"
      rows={[
        {
          react: "Card component",
          html: "the element",
          type: "ElementType",
          description: "The card's element, such as `article` or `li`. Default `div`.",
        },
        {
          react: "CardHeader title",
          html: "span[data-ok-card-header-title]",
          type: "ReactNode",
          description: "The main line of the header, as a Typography `h6`.",
        },
        {
          react: "CardHeader subheader",
          html: "span[data-ok-card-header-subheader]",
          type: "ReactNode",
          description: "The second line, as a Typography `body2` in the secondary text color.",
        },
        {
          react: "CardHeader avatar",
          html: "div[data-ok-card-header-avatar]",
          type: "ReactNode",
          description: "An Avatar at the start of the header.",
        },
        {
          react: "CardHeader action",
          html: "div[data-ok-card-header-action]",
          type: "ReactNode",
          description: "An action at the end of the header, such as an IconButton.",
        },
        {
          react: "CardHeader disableTypography",
          html: "your own title elements",
          type: "boolean",
          description: "Renders `title` and `subheader` as given, without Typography.",
        },
        {
          react: "CardHeader titleProps, subheaderProps",
          html: "the Typography attributes",
          type: "TypographyProps",
          description: "Props of the title's and the subheader's Typography.",
        },
        {
          react: "CardMedia component",
          html: "the element",
          type: "ElementType",
          description:
            "`img`, `video`, `picture`, `iframe` or `audio` show the media. Other elements hold a cover image. Default `div`.",
        },
        {
          react: "CardMedia image, src",
          html: "src, or img[data-ok-card-media-image]",
          type: "string",
          description: "The media URL.",
        },
        {
          react: "CardActionArea href",
          html: "a[data-ok-card-action-area]",
          type: "string",
          description: "Renders a link instead of a button.",
        },
        {
          react: "CardActionArea disabled",
          html: "disabled, or aria-disabled on a link",
          type: "boolean",
          description: "Turns the action area off.",
        },
        {
          react: "component (CardHeader, CardContent)",
          html: "the element",
          type: "ElementType",
          description: "The part's element. Default `div`.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Tab", "Moves focus to the action area and to the controls inside the card."],
        ["Enter", "Activates the focused action area, button or link."],
        ["Space", "Activates the focused action area when it is a button."],
      ]}
    />
  ),
};

/** Card docs page (ADR-0019). */
export function CardDocs() {
  return <GuideDocs sections={cardSections} previews={PREVIEWS} />;
}
