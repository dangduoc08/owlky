import { Card, LinearProgress, Typography } from "@owlky/react";

/** A Linear progress fixed at the top of the window follows the page's scroll. */
export function ScrollDocumentDemo() {
  return (
    <div className="sb-scroll-progress">
      <LinearProgress color="info" scroll className="sb-scroll-progress-page" />
      <Card className="sb-scroll-progress-document">
        <Typography variant="h6" component="p">
          Scroll down the page
        </Typography>
      </Card>
    </div>
  );
}
