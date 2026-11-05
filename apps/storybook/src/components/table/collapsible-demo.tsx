import {
  Scrollbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableDetailRow,
  TableExpandButton,
  TableHead,
  TableRow,
} from "@owlky/react";
import { useState } from "react";
import data from "./table-data.json" with { type: "json" };

const slug = (name: string) => name.toLowerCase().replaceAll(" ", "-");

export function CollapsibleDemo() {
  const [open, setOpen] = useState<string[]>([]);
  const toggle = (name: string) =>
    setOpen((current) =>
      current.includes(name) ? current.filter((n) => n !== name) : [...current, name],
    );
  return (
    <TableContainer>
      <Scrollbar aria-label="Desserts with purchase history">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" aria-label="Details" />
              <TableCell>Dessert (100g serving)</TableCell>
              <TableCell align="right">Calories</TableCell>
              <TableCell align="right">Fat (g)</TableCell>
              <TableCell align="right">Carbs (g)</TableCell>
              <TableCell align="right">Protein (g)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.desserts.slice(0, 5).flatMap((row) => {
              const id = `history-${slug(row.name)}`;
              const price = data.prices[row.name as keyof typeof data.prices];
              return [
                <TableRow key={row.name}>
                  <TableCell padding="checkbox">
                    <TableExpandButton
                      expanded={open.includes(row.name)}
                      controls={id}
                      aria-label={`Purchase history of ${row.name}`}
                      onClick={() => toggle(row.name)}
                    />
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell align="right">{row.calories}</TableCell>
                  <TableCell align="right">{row.fat}</TableCell>
                  <TableCell align="right">{row.carbs}</TableCell>
                  <TableCell align="right">{row.protein}</TableCell>
                </TableRow>,
                <TableDetailRow key={id} id={id} open={open.includes(row.name)} colSpan={6}>
                  <Table size="small" aria-label={`Purchase history of ${row.name}`}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Total price ($)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.history.map((entry) => (
                        <TableRow key={entry.date}>
                          <TableCell>{entry.date}</TableCell>
                          <TableCell>{entry.customer}</TableCell>
                          <TableCell align="right">{entry.amount}</TableCell>
                          <TableCell align="right">{(entry.amount * price).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableDetailRow>,
              ];
            })}
          </TableBody>
        </Table>
      </Scrollbar>
    </TableContainer>
  );
}
