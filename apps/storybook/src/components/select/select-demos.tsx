import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
} from "@owlky/react";
import { useState } from "react";

const NAMES = [
  "Oliver Hansen",
  "Van Henry",
  "April Tucker",
  "Ralph Hubbard",
  "Omar Alexander",
  "Carlos Abbott",
  "Miriam Wagner",
  "Bradley Wilkerson",
  "Virginia Andrews",
  "Kelly Snyder",
];

/** Multiple select whose options show a checkbox and whose field shows the names. */
export function CheckmarksDemo() {
  const [names, setNames] = useState<string[]>(["Van Henry"]);
  return (
    <FormControl className="sb-select-wide">
      <InputLabel id="select-checkmarks-label" htmlFor="select-checkmarks">
        Tag
      </InputLabel>
      <Select
        labelId="select-checkmarks-label"
        id="select-checkmarks"
        label="Tag"
        multiple
        value={names}
        onChange={(value) => setNames([...value])}
        renderValue={(selected) => selected.join(", ")}
        menuProps={{ paperProps: { className: "sb-select-menu" } }}
      >
        {NAMES.map((name) => (
          <MenuItem key={name} value={name}>
            {/* `inert`: the option is the control, its checkbox only shows the state. */}
            <Checkbox size="small" checked={names.includes(name)} inert />
            <ListItemText primary={name} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

/** A button opens the select: `open` and `onOpenChange` keep the open state in the app. */
export function OpenStateDemo() {
  const [open, setOpen] = useState(false);
  const [age, setAge] = useState<string | number>("");
  return (
    <>
      <Button id="select-open-button" variant="outlined" onClick={() => setOpen(true)}>
        Open the select
      </Button>
      <FormControl className="sb-select">
        <InputLabel id="select-open-label" htmlFor="select-open">
          Age
        </InputLabel>
        <Select
          labelId="select-open-label"
          id="select-open"
          label="Age"
          open={open}
          onOpenChange={setOpen}
          value={age}
          onChange={setAge}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
      </FormControl>
    </>
  );
}

/** Two selects in a dialog: a native one and a listbox one. */
export function DialogDemo() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <Button
        variant="outlined"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="select-dialog"
        onClick={() => setOpen(true)}
      >
        Open select dialog
      </Button>
      <Dialog id="select-dialog" open={open} onOpenChange={setOpen}>
        <DialogTitle>Fill the form</DialogTitle>
        <DialogContent>
          <div className="sb-select-dialog">
            <FormControl className="sb-select">
              <InputLabel htmlFor="select-dialog-native">Age</InputLabel>
              <Select native id="select-dialog-native" label="Age" defaultValue="">
                <option aria-label="None" value="" />
                <option value={10}>Ten</option>
                <option value={20}>Twenty</option>
                <option value={30}>Thirty</option>
              </Select>
            </FormControl>
            <FormControl className="sb-select">
              <InputLabel id="select-dialog-label" htmlFor="select-dialog-age">
                Age
              </InputLabel>
              <Select
                labelId="select-dialog-label"
                id="select-dialog-age"
                label="Age"
                defaultValue=""
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                <MenuItem value={10}>Ten</MenuItem>
                <MenuItem value={20}>Twenty</MenuItem>
                <MenuItem value={30}>Thirty</MenuItem>
              </Select>
            </FormControl>
          </div>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={close}>
            Cancel
          </Button>
          <Button variant="contained" onClick={close}>
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
