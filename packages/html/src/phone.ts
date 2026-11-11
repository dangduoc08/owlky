/**
 * Side-effect entry: registers the phone input (ADR-0061, loads the phone metadata) on the
 * page-wide runtime and starts it. Kept out of `@owlky/html/auto` and `owlky.js` so pages without
 * a phone input don't load libphonenumber-js. With other metadata or country names, register
 * `createPhoneInput({ … })` instead.
 */
import { phoneInput } from "./components/phone-input/phone-input.js";
import { getRuntime } from "./runtime/global.js";
import type { Runtime } from "./runtime/types.js";

export const runtime: Runtime = getRuntime().register(phoneInput).start();
