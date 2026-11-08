/**
 * <script> / CDN entry (IIFE): `owlky-editor.js`. Load it after `owlky.js`: it registers the
 * Editor on the same page-wide runtime (ADR-0007 slot) and adds no global of its own.
 */
import { editor } from "./components/editor/editor.js";
import { getRuntime } from "./runtime/global.js";

getRuntime().register(editor).start();
