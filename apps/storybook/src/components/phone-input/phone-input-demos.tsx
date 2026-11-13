import { phoneValueDetails } from "@owlky/core/phone";
import {
  PhoneInput,
  type PhoneInputChangeDetails,
  type PhoneInputProps,
  Typography,
} from "@owlky/react";
import { useState } from "react";

/** The national, international and raw (E.164) forms of the number, as the field reports them. */
function PhoneValues({ details }: { details: PhoneInputChangeDetails }) {
  const rows: [string, string][] = [
    ["National", details.national],
    ["International", details.international],
    ["Raw", details.value],
  ];
  return (
    <dl className="sb-phone-values">
      {rows.map(([label, value]) => (
        <div key={label} className="sb-phone-row">
          <Typography component="dt" variant="body2" color="textSecondary">
            {`${label}:`}
          </Typography>
          <Typography
            component="dd"
            variant="subtitle2"
            className={`sb-phone-${label.toLowerCase()}`}
          >
            {value || "-"}
          </Typography>
        </div>
      ))}
    </dl>
  );
}

/** A phone input with its values under it. */
function PhoneDemo(props: PhoneInputProps & { id: string }) {
  const [details, setDetails] = useState(() => phoneValueDetails(props.defaultValue ?? ""));
  return (
    <div className="sb-phone-demo">
      <PhoneInput
        label="Phone number"
        placeholder="Enter phone number"
        fullWidth
        onChange={(_value, next) => setDetails(next)}
        {...props}
      />
      <PhoneValues details={details} />
    </div>
  );
}

/** Auto: no country at first; typing a number selects its country. */
export function PhoneAutoDemo() {
  return <PhoneDemo id="phone-auto" />;
}

/** Default value: an E.164 value selects its country and shows in national form. */
export function PhoneDefaultValueDemo() {
  return <PhoneDemo id="phone-default-value" defaultValue="+61298765432" />;
}

/** Default country: national numbers are read as Germany's until another country is picked. */
export function PhoneDefaultCountryDemo() {
  return <PhoneDemo id="phone-default-country" defaultCountry="DE" />;
}

/** Fixed country: the select is turned off. */
export function PhoneFixedCountryDemo() {
  return <PhoneDemo id="phone-fixed-country" country="AU" defaultValue="+61298765432" />;
}

/** Fixed country + international: the calling code stays in front. */
export function PhoneFixedInternationalDemo() {
  return (
    <PhoneDemo
      id="phone-fixed-international"
      country="AU"
      international
      defaultValue="+61298765432"
    />
  );
}

/** Fixed country + international + hideSelect: no country select at all. */
export function PhoneHideSelectDemo() {
  return (
    <PhoneDemo
      id="phone-hide-select"
      country="AU"
      international
      hideSelect
      defaultValue="+61298765432"
    />
  );
}

/** Validation: leave the field with an incomplete number to see the error. */
export function PhoneValidationDemo() {
  return (
    <PhoneDemo
      id="phone-validation"
      defaultCountry="US"
      validate
      invalidText="Enter a valid phone number"
      helperText="We only call about your order"
    />
  );
}

/** Countries: a short list, in your order, and digits past the longest number refused. */
export function PhoneCountriesDemo() {
  return (
    <PhoneDemo
      id="phone-countries"
      countries={["US", "CA", "GB", "AU", "VN"]}
      countryOptionsOrder={["VN", "..."]}
      defaultCountry="VN"
      limitMaxLength
    />
  );
}

/** Image flags: a Circle Flags picture per country, loaded lazily from the folder you host. */
export function PhoneImageFlagsDemo() {
  return (
    <PhoneDemo
      id="phone-image-flags"
      defaultCountry="AU"
      flags="image"
      flagsPath="flags/"
      defaultValue="+61298765432"
    />
  );
}
