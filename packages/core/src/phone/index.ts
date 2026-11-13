/**
 * `@owlky/core/phone` (ADR-0061): the phone input's model on libphonenumber-js (formatting as you
 * type, country detection, validation, the country list) and its input controller, shared by
 * React's `PhoneInput` and the HTML `phone-input` runtime. Not re-exported from `@owlky/core`:
 * pages without a phone input don't load the phone metadata.
 */
export { phoneFlagFolder, phoneFlagSource } from "../anatomy/anatomy.js";
export {
  createPhoneInputController,
  type PhoneInputController,
  type PhoneInputControllerOptions,
  phoneDeletion,
  writePhoneInput,
} from "./controller.js";
export {
  isValidPhoneValue,
  type PhoneCountry,
  type PhoneCountryOption,
  type PhoneCountryOptionsOptions,
  type PhoneInputChange,
  type PhoneInputLabels,
  type PhoneInputSettings,
  type PhoneInputSettingsOptions,
  type PhoneInputView,
  type PhoneMetadata,
  type PhoneValueDetails,
  phoneCallingCode,
  phoneCountry,
  phoneCountryDigits,
  phoneCountryList,
  phoneCountryOfValue,
  phoneCountryOptions,
  phoneDigitsFromValue,
  phoneFlag,
  phoneInputChange,
  phoneInputSettings,
  phoneInputView,
  phoneMetadata,
  phoneValueDetails,
  readPhoneInputSettings,
} from "./phone.js";
