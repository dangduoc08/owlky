import {
  Avatar,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CardMedia,
  IconButton,
  Typography,
} from "@owlky/react";
import { useState } from "react";
import { DemoIcon } from "../shared/demo-icon.js";

/** A card whose method section opens and closes with the chevron button. */
export function ComplexInteractionDemo() {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="sb-card">
      <CardHeader
        avatar={
          <Avatar color="error" role="img" aria-label="Garden">
            G
          </Avatar>
        }
        action={
          <IconButton aria-label="Settings">
            <DemoIcon name="moreVertical" />
          </IconButton>
        }
        title="Golden flower bed"
        subheader="April 14, 2025"
      />
      <CardMedia component="img" height="194" src="images/image-4.svg" alt="Golden flowers" />
      <CardContent>
        <Typography variant="body2" color="textSecondary">
          A sunny bed of golden flowers lights up the garden from spring to autumn. Plant it once
          and it comes back every year with a little care.
        </Typography>
      </CardContent>
      <CardActions disableSpacing>
        <IconButton aria-label="Add to favorites">
          <DemoIcon name="heart" />
        </IconButton>
        <IconButton aria-label="Share">
          <DemoIcon name="share" />
        </IconButton>
        <IconButton
          className="sb-card-expand"
          aria-label="Show the method"
          aria-expanded={expanded}
          aria-controls="card-garden-method"
          onClick={() => setExpanded(!expanded)}
        >
          <DemoIcon name="chevronDown" />
        </IconButton>
      </CardActions>
      <CardContent id="card-garden-method" hidden={!expanded}>
        <Typography variant="body2" gutterBottom>
          Method:
        </Typography>
        <Typography variant="body2" gutterBottom>
          Pick a spot with at least six hours of sun. Loosen the soil to a spade's depth and mix in
          a layer of compost.
        </Typography>
        <Typography variant="body2" gutterBottom>
          Set the plants a hand's width apart, firm the soil around each one and water them well.
        </Typography>
        <Typography variant="body2">
          Water once a week while they settle in, then only in dry spells.
        </Typography>
      </CardContent>
    </Card>
  );
}
