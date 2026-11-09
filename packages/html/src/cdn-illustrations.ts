/**
 * <script> / CDN entry (IIFE): `owlky-illustrations.js`. Load it after `owlky.js`: it registers the
 * Illustration runtime with every illustration on the same page-wide runtime (ADR-0007 slot) and
 * adds no global of its own.
 */
import { illustration } from "./components/illustration/illustration.js";
import { getRuntime } from "./runtime/global.js";

getRuntime().register(illustration).start();
