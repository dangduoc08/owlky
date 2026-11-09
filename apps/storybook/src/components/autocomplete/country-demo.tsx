import { Autocomplete, type AutocompleteOption, Label, Typography } from "@owlky/react";
import { type ReactNode, useState } from "react";

const COUNTRIES: AutocompleteOption[] = [
  { value: "AR", label: "Argentina" },
  { value: "AM", label: "Armenia" },
  { value: "AU", label: "Australia" },
  { value: "BM", label: "Bermuda" },
  { value: "BR", label: "Brazil" },
  { value: "BG", label: "Bulgaria" },
  { value: "CA", label: "Canada" },
  { value: "DE", label: "Germany" },
  { value: "JP", label: "Japan" },
  { value: "VN", label: "Vietnam" },
];
const NAMES = COUNTRIES.map((country) => country.label);

/** A country option: its code on a label, then its name. */
function country(option: AutocompleteOption) {
  const code = COUNTRIES.find((c) => c.label === option.label)?.value ?? option.value;
  return (
    <>
      <Label>{code}</Label>
      {option.label}
    </>
  );
}

/** The field with the value it outputs beside it. */
function Output({ children, value }: { children: ReactNode; value: unknown }) {
  return (
    <div className="sb-autocomplete-output">
      {children}
      <Typography variant="caption" component="output" color="textSecondary">
        Output <code>{JSON.stringify(value)}</code>
      </Typography>
    </div>
  );
}

/** Country pickers that output the label or the code, in one or several values. */
export function OutputDemo({ output }: { output: "label" | "code" }) {
  const options = output === "label" ? NAMES : COUNTRIES;
  const [single, setSingle] = useState<string | string[] | null>(
    output === "label" ? "Armenia" : "AR",
  );
  const [multi, setMulti] = useState<string | string[] | null>(
    output === "label" ? ["Armenia", "Australia", "Bulgaria"] : ["AR", "DE", "BM"],
  );
  return (
    <div className="sb-autocomplete-outputs">
      <Output value={single}>
        <Autocomplete
          id={`country-${output}-single`}
          label={`Single select ${output}`}
          options={options}
          value={single}
          onChange={setSingle}
          renderOption={country}
        />
      </Output>
      <Output value={multi}>
        <Autocomplete
          id={`country-${output}-multi`}
          label={`Multi select ${output}`}
          placeholder="Choose a country"
          multiple
          options={options}
          value={multi}
          onChange={setMulti}
          renderOption={country}
        />
      </Output>
    </div>
  );
}

/** The three TextField variants. */
export function VariantsDemo() {
  return (
    <div className="sb-autocomplete-variants">
      {(["outlined", "filled", "standard"] as const).map((variant) => (
        <Autocomplete
          key={variant}
          id={`country-${variant}`}
          label={variant.charAt(0).toUpperCase() + variant.slice(1)}
          variant={variant}
          options={COUNTRIES}
          defaultValue="DE"
          renderOption={country}
        />
      ))}
    </div>
  );
}
