import {
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Scrollbar,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@owlky/react";
import { useState } from "react";
import { DemoIcon } from "../shared/demo-icon.js";

const CATEGORIES = ["Clothing", "Accessories", "Shoes"];
const PRODUCTS = Array.from({ length: 50 }, (_, i) => ({
  id: `id-${i + 1}`,
  name: `product-${i + 1}`,
  category: CATEGORIES[i % 3] as string,
}));

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

/**
 * Products from a paged query: a search field and a category Select build the query, the
 * TablePagination (with a listbox Select for rows per page) pages its results.
 */
export function TableApiDemo() {
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState({ text: "", category: "" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const found = PRODUCTS.filter(
    (product) =>
      (query.category === "" || product.category === query.category) &&
      (query.text === "" || `${product.id} ${product.name}`.includes(query.text.trim())),
  );
  const rows = found.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const pages = Math.max(Math.ceil(found.length / rowsPerPage), 1);
  return (
    <div className="sb-table-api">
      <div className="sb-table-api-query">
        <Typography variant="body2">
          <strong>endpoint:</strong>{" "}
          <code>{`/api/pagination?page=${page + 1}&perPage=${rowsPerPage}`}</code>
        </Typography>
        <Typography variant="body2">
          <strong>Items:</strong>
          {` ${found.length} `}
          <strong>Pages:</strong>
          {` ${pages}`}
        </Typography>
      </div>
      <div className="sb-table-api-filters">
        <TextField
          id="table-api-search"
          aria-label="Search"
          placeholder="Search product by Id or name..."
          fullWidth
          value={text}
          onChange={setText}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          }
        />
        <FormControl className="sb-table-api-category">
          <InputLabel id="table-api-category-label" htmlFor="table-api-category">
            Category
          </InputLabel>
          <Select
            labelId="table-api-category-label"
            id="table-api-category"
            label="Category"
            value={category}
            onChange={setCategory}
          >
            <MenuItem value="" divider>
              None
            </MenuItem>
            {CATEGORIES.map((name) => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          onClick={() => {
            setQuery({ text, category });
            setPage(0);
          }}
        >
          Search
        </Button>
      </div>
      <TableContainer>
        <Scrollbar aria-label="Products">
          <Table id="table-api">
            <TableHead>
              <TableRow>
                <TableCell>Id</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.id}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell align="right">
                    <IconButton size="sm" aria-label={`Actions for ${product.name}`}>
                      <DemoIcon name="moreVertical" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
      <TablePagination
        count={found.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        onPageChange={setPage}
        onRowsPerPageChange={(next) => {
          setRowsPerPage(next);
          setPage(0);
        }}
        selectProps={{ native: false }}
      />
    </div>
  );
}
