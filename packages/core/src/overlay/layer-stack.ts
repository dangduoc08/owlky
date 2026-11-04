import { sharedState } from "../shared-state.js";

/**
 * Page-wide stack of open overlays (dialogs now; dropdowns, popovers later). Only the topmost
 * layer reacts to Escape / outside clicks, so nested overlays close one at a time — even when
 * they come from different implementations (React and HTML) or different bundles.
 *
 * Shared-state shape — bump the protocol if it changes.
 */
interface LayerStackState {
  layers: Element[];
}

const PROTOCOL = 1;
const state = () => sharedState<LayerStackState>("layer-stack", PROTOCOL, () => ({ layers: [] }));

export const layerStack = {
  push(layer: Element): void {
    const { layers } = state();
    const index = layers.indexOf(layer);
    if (index !== -1) layers.splice(index, 1);
    layers.push(layer);
  },
  remove(layer: Element): void {
    const { layers } = state();
    const index = layers.indexOf(layer);
    if (index !== -1) layers.splice(index, 1);
  },
  isTop(layer: Element): boolean {
    const { layers } = state();
    // Drop layers whose element was removed without closing (defensive; avoids a stuck stack).
    for (let i = layers.length - 1; i >= 0; i--) {
      if (!layers[i]?.isConnected) layers.splice(i, 1);
    }
    return layers[layers.length - 1] === layer;
  },
  get size(): number {
    return state().layers.length;
  },
};
