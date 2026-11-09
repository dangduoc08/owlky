import { FormControl, InputLabel, MenuItem, Pagination, Paper, Select } from "@owlky/react";
import { useState } from "react";

const TOTAL = 120;
const PER_PAGE = [12, 24, 36];

/** A grid of items with pagination and an items-per-page Select. */
export function ItemsDemo() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);
  const first = (page - 1) * perPage;
  const items = Array.from({ length: Math.min(perPage, TOTAL - first) }, (_, i) => first + i + 1);
  return (
    <div className="sb-pagination-items">
      <ul className="sb-pagination-grid" aria-label="Items">
        {items.map((item) => (
          <li key={item}>
            <Paper elevation={1}>{item}</Paper>
          </li>
        ))}
      </ul>
      <div className="sb-pagination-footer">
        <Pagination
          aria-label="Items pages"
          count={Math.ceil(TOTAL / perPage)}
          page={page}
          onChange={setPage}
        />
        <FormControl size="small" className="sb-select">
          <InputLabel id="items-per-page-label" htmlFor="items-per-page">
            Items per page
          </InputLabel>
          <Select
            labelId="items-per-page-label"
            id="items-per-page"
            label="Items per page"
            value={perPage}
            onChange={(next) => {
              setPerPage(Number(next));
              setPage(1);
            }}
          >
            {PER_PAGE.map((value) => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    </div>
  );
}
