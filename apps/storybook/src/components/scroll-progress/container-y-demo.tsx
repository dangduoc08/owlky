import { Card, CircularProgress, LinearProgress, Scrollbar, Typography } from "@owlky/react";

const cards = Array.from({ length: 12 }, (_, index) => index + 1);

/** A Circular and a Linear progress follow the vertical scroll of the area under them. */
export function ContainerScrollYDemo() {
  return (
    <div className="sb-scroll-progress">
      <CircularProgress
        color="info"
        size={32}
        enableTrackSlot
        scroll={{ container: "cards-y" }}
        className="sb-scroll-progress-circle"
      />
      <LinearProgress color="info" scroll={{ container: "cards-y" }} />
      <Scrollbar id="cards-y" aria-label="Numbered cards" className="sb-scroll-progress-area">
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
