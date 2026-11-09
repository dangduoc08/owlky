import { Card, CardActionArea, CardContent, Typography } from "@owlky/react";
import { useState } from "react";

const CHOICES = [
  { title: "Plants", text: "Plants turn sunlight into food." },
  { title: "Animals", text: "Animals move to find what they need." },
  { title: "Fungi", text: "Fungi break down what others leave behind." },
];

/**
 * Cards that pick one choice: the chosen card's action area is pressed (`aria-pressed`). The
 * text stays primary: secondary text on the selected tint would fall below 4.5:1.
 */
export function ActiveStateDemo() {
  const [selected, setSelected] = useState(0);
  return (
    <div className="sb-card-choices">
      {CHOICES.map((choice, index) => (
        <Card key={choice.title}>
          <CardActionArea aria-pressed={selected === index} onClick={() => setSelected(index)}>
            <CardContent>
              <Typography variant="h5" component="div">
                {choice.title}
              </Typography>
              <Typography variant="body2">{choice.text}</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </div>
  );
}
