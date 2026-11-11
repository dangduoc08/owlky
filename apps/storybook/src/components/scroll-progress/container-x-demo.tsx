import { Card, CircularProgress, LinearProgress, Scrollbar, Typography } from "@owlky/react";

const cards = Array.from({ length: 24 }, (_, index) => index + 1);

/** A Circular and a Linear progress in the text color follow the horizontal scroll of a row. */
export function ContainerScrollXDemo() {
  return (
    <div className="sb-scroll-progress">
      <CircularProgress
        color="inherit"
        size={32}
        enableTrackSlot
        scroll={{ container: "cards-x", axis: "x" }}
        className="sb-scroll-progress-circle"
      />
      <LinearProgress color="inherit" scroll={{ container: "cards-x", axis: "x" }} />
      <Scrollbar
        id="cards-x"
        aria-label="Numbered cards in a row"
        className="sb-scroll-progress-row"
      >
        {cards.map((card) => (
          <Card key={card} className="sb-scroll-progress-card">
            <Typography variant="h3" component="p" color="textSecondary">
              {card}
            </Typography>
          </Card>
        ))}
      </Scrollbar>
    </div>
  );
}
