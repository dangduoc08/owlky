import { Autocomplete } from "@owlky/react";
import { useState } from "react";

/** The value and the input text, both controlled and shown below the field. */
export function ControllableDemo() {
  const [value, setValue] = useState<string | string[] | null>("Option 1");
  const [inputValue, setInputValue] = useState("Option 1");
  return (
    <div className="sb-autocomplete">
      <Autocomplete
        id="docs-controllable"
        label="Controllable"
        options={["Option 1", "Option 2"]}
        value={value}
        onChange={setValue}
        inputValue={inputValue}
        onInputChange={setInputValue}
      />
      <p>
        value: <code>{JSON.stringify(value)}</code> · inputValue:{" "}
        <code>{JSON.stringify(inputValue)}</code>
      </p>
    </div>
  );
}
