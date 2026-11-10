"use client";

import { type MapPosition, type MapScaleUnit, mapControlAttributes } from "@owlky/core";
import { type MapIconName, mapIcons } from "@owlky/core/map";
import { type HTMLAttributes, type ReactNode, useContext, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { type GeolocateHandlers, InlineCorners, useMapContext } from "./map-context.js";

function Icon({ name, part }: { name: MapIconName; part?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-ok-map-icon={part}
    >
      <path d={mapIcons[name]} />
    </svg>
  );
}

/** Renders `children` in a corner of the enclosing map (after the map mounted). */
export function InCorner({ position, children }: { position: MapPosition; children: ReactNode }) {
  const { corners } = useMapContext("A map control");
  const inline = useContext(InlineCorners);
  const corner = corners[position];
  if (inline) return inline(position, children);
  return corner ? createPortal(children, corner) : null;
}

export interface MapControlProps extends HTMLAttributes<HTMLDivElement> {
  /** Corner of the map. Default `top-right`. */
  position?: MapPosition | undefined;
  children?: ReactNode;
}

/** MapControl — a control box in a corner of the map, for your own buttons (`useMap()` reaches the map). */
export function MapControl({ position = "top-right", children, ...props }: MapControlProps) {
  return (
    <InCorner position={position}>
      <div {...props} data-ok-map-control="">
        {children}
      </div>
    </InCorner>
  );
}

export interface NavigationControlProps {
  /** The corner of the map that holds the control. */
  position?: MapPosition | undefined;
  /** Shows the zoom in and zoom out buttons. Default `true`. */
  showZoom?: boolean | undefined;
  /** Default `true`: a compass that resets north (drag it to rotate). */
  showCompass?: boolean | undefined;
  /** The compass also tilts with the map, and resets the tilt. */
  visualizePitch?: boolean | undefined;
}

/** NavigationControl — zoom in, zoom out and the compass. */
export function NavigationControl({
  position = "top-right",
  showZoom = true,
  showCompass = true,
  visualizePitch,
}: NavigationControlProps) {
  const { labels } = useMapContext("NavigationControl");
  return (
    <InCorner position={position}>
      <div data-ok-map-control="" {...mapControlAttributes("navigation", { visualizePitch })}>
        {showZoom ? (
          <>
            <button type="button" data-ok-map-action="zoom-in" aria-label={labels.zoomIn}>
              <Icon name="zoomIn" />
            </button>
            <button type="button" data-ok-map-action="zoom-out" aria-label={labels.zoomOut}>
              <Icon name="zoomOut" />
            </button>
          </>
        ) : null}
        {showCompass ? (
          <button type="button" data-ok-map-action="compass" aria-label={labels.compass}>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
              data-ok-map-compass-icon=""
            >
              <path d={mapIcons.compassNorth} data-ok-map-compass-north="" />
              <path d={mapIcons.compassSouth} data-ok-map-compass-south="" />
            </svg>
          </button>
        ) : null}
      </div>
    </InCorner>
  );
}

export interface GeolocateControlProps extends GeolocateHandlers {
  /** The corner of the map that holds the control. */
  position?: MapPosition | undefined;
  /** Keeps following the location; the button turns tracking on and off. */
  trackUserLocation?: boolean | undefined;
  /** Default `true`: a dot at the location. */
  showUserLocation?: boolean | undefined;
  /** Default `true`: a circle as wide as the accuracy. */
  showAccuracyCircle?: boolean | undefined;
}

/** GeolocateControl — moves the map to the person's location (asks for permission). */
export function GeolocateControl({
  position = "top-right",
  trackUserLocation,
  showUserLocation,
  showAccuracyCircle,
  ...handlers
}: GeolocateControlProps) {
  const { labels, geolocate } = useMapContext("GeolocateControl");
  const latest = useRef<GeolocateHandlers>(handlers);
  latest.current = handlers;
  useEffect(() => {
    const entry: GeolocateHandlers = {
      onGeolocate: (value) => latest.current.onGeolocate?.(value),
      onError: (error) => latest.current.onError?.(error),
      onTrackUserLocationStart: () => latest.current.onTrackUserLocationStart?.(),
      onTrackUserLocationEnd: () => latest.current.onTrackUserLocationEnd?.(),
    };
    geolocate.add(entry);
    return () => {
      geolocate.delete(entry);
    };
  }, [geolocate]);
  return (
    <InCorner position={position}>
      <div
        data-ok-map-control=""
        {...mapControlAttributes("geolocate", {
          trackUserLocation,
          showUserLocation,
          showAccuracyCircle,
        })}
      >
        <button
          type="button"
          data-ok-map-action="geolocate"
          aria-label={labels.geolocate}
          aria-pressed={trackUserLocation ? false : undefined}
        >
          <Icon name="geolocate" />
        </button>
      </div>
    </InCorner>
  );
}

export interface FullscreenControlProps {
  /** The corner of the map that holds the control. */
  position?: MapPosition | undefined;
}

/** FullscreenControl — the map fills the screen (Escape or the button again leaves). */
export function FullscreenControl({ position = "top-right" }: FullscreenControlProps) {
  const { labels } = useMapContext("FullscreenControl");
  return (
    <InCorner position={position}>
      <div data-ok-map-control="">
        <button
          type="button"
          data-ok-map-action="fullscreen"
          aria-label={labels.fullscreenEnter}
          aria-pressed={false}
        >
          <Icon name="fullscreenEnter" part="enter" />
          <Icon name="fullscreenExit" part="exit" />
        </button>
      </div>
    </InCorner>
  );
}

export interface ScaleControlProps {
  /** The corner of the map that holds the control. Default `bottom-left`. */
  position?: MapPosition | undefined;
  /** Longest the bar gets, in px. Default 100. */
  maxWidth?: number | undefined;
  /** Default `metric`. */
  unit?: MapScaleUnit | undefined;
}

/** ScaleControl — a bar with the distance it covers ("500 km"). */
export function ScaleControl({ position = "bottom-left", maxWidth, unit }: ScaleControlProps) {
  return (
    <InCorner position={position}>
      <div {...mapControlAttributes("scale", { maxWidth, unit })} />
    </InCorner>
  );
}

export interface AttributionControlProps {
  /** The corner of the map that holds the control. Default `bottom-right`. */
  position?: MapPosition | undefined;
  /** Always folded behind an info button (default: only on maps narrower than 640px). */
  compact?: boolean | undefined;
}

/**
 * AttributionControl — the credits of the map's data, read from its style. `MapView` shows one unless
 * `attributionControl={false}`.
 */
export function AttributionControl({
  position = "bottom-right",
  compact,
}: AttributionControlProps) {
  const { labels } = useMapContext("AttributionControl");
  return (
    <InCorner position={position}>
      <details {...mapControlAttributes("attribution", { compact })}>
        <summary aria-label={labels.attribution}>
          <Icon name="info" />
        </summary>
        <div data-ok-map-attribution-text="" />
      </details>
    </InCorner>
  );
}

export interface GlobeControlProps {
  /** The corner of the map that holds the control. */
  position?: MapPosition | undefined;
}

/** GlobeControl — switches between the flat map and the globe. */
export function GlobeControl({ position = "top-right" }: GlobeControlProps) {
  const { labels } = useMapContext("GlobeControl");
  return (
    <InCorner position={position}>
      <div data-ok-map-control="">
        <button
          type="button"
          data-ok-map-action="globe"
          aria-label={labels.globe}
          aria-pressed={false}
        >
          <Icon name="globe" />
        </button>
      </div>
    </InCorner>
  );
}

export interface TerrainControlProps {
  /** The corner of the map that holds the control. */
  position?: MapPosition | undefined;
  /** The `raster-dem` source to raise the terrain from. */
  source: string;
  /** Height multiplier. Default 1. */
  exaggeration?: number | undefined;
}

/** TerrainControl — turns 3D terrain on and off. */
export function TerrainControl({
  position = "top-right",
  source,
  exaggeration,
}: TerrainControlProps) {
  const { labels } = useMapContext("TerrainControl");
  return (
    <InCorner position={position}>
      <div data-ok-map-control="">
        <button
          type="button"
          data-ok-map-action="terrain"
          data-ok-source={source}
          data-ok-exaggeration={exaggeration}
          aria-label={labels.terrain}
          aria-pressed={false}
        >
          <Icon name="terrain" />
        </button>
      </div>
    </InCorner>
  );
}
