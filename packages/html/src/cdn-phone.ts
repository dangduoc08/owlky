/**
 * <script> / CDN entry (IIFE): `owlky-phone.js`. Load it after `owlky.js`: it registers the
 * phone input on the same page-wide runtime (ADR-0007 slot) and adds no global of its own. The
 * country select is the Select runtime of `owlky.js`.
 */
import { phoneInput } from "./components/phone-input/phone-input.js";
import { getRuntime } from "./runtime/global.js";

getRuntime().register(phoneInput).start();
