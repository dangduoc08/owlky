/**
 * <script> / CDN entry (IIFE): `owlky-markdown.js`. Load it after `owlky.js`: it registers
 * Markdown on the same page-wide runtime (ADR-0007 slot) and adds no global of its own.
 */
import { markdown } from "./components/markdown/markdown.js";
import { getRuntime } from "./runtime/global.js";

getRuntime().register(markdown).start();
