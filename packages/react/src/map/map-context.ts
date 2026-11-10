"use client";

import type { MapPosition } from "@owlky/core";
import type { MapController, MapDragPhase, MapLabels, MapPopupCloseReason } from "@owlky/core/map";
import { createContext, type ReactNode, useContext } from "react";

export type MarkerDragHandler = (phase: MapDragPhase, lngLat: { lng: number; lat: number }) => void;

export interface GeolocateHandlers {
  /** Called with the user's position. */
  onGeolocate?: ((position: GeolocationPosition) => void) | undefined;
  /** Called when the position can't be found. */
  onError?: ((error: GeolocationPositionError | Error) => void) | undefined;
  /** Called when tracking the user's location starts. */
  onTrackUserLocationStart?: (() => void) | undefined;
  /** Called when tracking the user's location ends. */
  onTrackUserLocationEnd?: (() => void) | undefined;
}

/** What a map shares with its parts (markers, popups, sources, layers, controls). */
export interface MapContextValue {
  readonly controller: MapController | null;
  readonly corners: Partial<Record<MapPosition, HTMLElement>>;
  readonly labels: MapLabels;
  readonly drags: WeakMap<Element, MarkerDragHandler>;
  readonly popups: WeakMap<Element, (reason: MapPopupCloseReason) => void>;
  readonly geolocate: Set<GeolocateHandlers>;
  /** `MapRegions` roots → their `onRegionSelect`. */
  readonly regions: WeakMap<Element, (id: string | number | null) => void>;
  /** `MapLegend` roots → their `onLegendToggle`. */
  readonly legends: WeakMap<Element, (classIndex: number, active: readonly number[]) => void>;
}

export const MapContext = createContext<MapContextValue | null>(null);

/**
 * Internal: renders controls through this function instead of a portal into their corner (static
 * rendering, such as generating the HTML snippets). Not exported from the package.
 */
export const InlineCorners = createContext<
  ((position: MapPosition, children: ReactNode) => ReactNode) | null
>(null);

/** The id of the enclosing `Source` (its layers default to it). */
export const SourceContext = createContext<string | null>(null);

export function useMapContext(part: string): MapContextValue {
  const context = useContext(MapContext);
  if (!context) throw new Error(`${part} must be rendered inside a MapView.`);
  return context;
}
