"use client";

import {
  type MapAlignment,
  type MapAnchor,
  type MapMarkerColor,
  type MapPosition,
  mapMarkerAttributes,
  mapPopupAttributes,
} from "@owlky/core";
import {
  type MapLayerSpec,
  type MapLibreMap,
  type MapPopupCloseReason,
  type MapSourceSpec,
  mapIcons,
} from "@owlky/core/map";
import {
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
} from "react";
import { Icon } from "../utils/icon.js";
import { SourceContext, useMapContext } from "./map-context.js";

/** `[x, y]` px, or one distance (px away from the point, popups only). */
export type MapOffset = number | readonly [number, number];
const offsetAttribute = (offset: MapOffset | undefined) =>
  offset === undefined ? undefined : typeof offset === "number" ? String(offset) : offset.join(",");

export interface MarkerDragEvent {
  readonly lngLat: { lng: number; lat: number };
}

// --- Pin ------------------------------------------------------------------------------------------

/** The default marker shape: a pin in the marker's color. */
export function MapPin(props: HTMLAttributes<SVGSVGElement>) {
  return <Icon data-ok-map-pin="" {...props} icon={mapIcons.pin} />;
}

// --- Marker ---------------------------------------------------------------------------------------

export interface MarkerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onDrag" | "onDragStart" | "onDragEnd" | "color"> {
  longitude: number;
  latitude: number;
  /** Which part sits on the point. Default `center` (`bottom` suits pins). */
  anchor?: MapAnchor | undefined;
  /** Shift in px from the anchor: `[x, y]`. */
  offset?: MapOffset | undefined;
  /** Color of the default pin. Default `primary`. */
  color?: MapMarkerColor | undefined;
  /** People can drag it (or move it with the arrow keys once focused). */
  draggable?: boolean | undefined;
  rotation?: number | undefined;
  /** Size of the default pin: `2` doubles it. Default `1` (26px). */
  scale?: number | undefined;
  /**
   * Pixels a press may move and still count as a click, not a drag. Default: the map's
   * `clickTolerance` (`mapOptions`), 3.
   */
  clickTolerance?: number | undefined;
  rotationAlignment?: MapAlignment | undefined;
  pitchAlignment?: MapAlignment | undefined;
  /** Called when a drag of the marker starts. */
  onDragStart?: ((event: MarkerDragEvent) => void) | undefined;
  /** Called while the marker is dragged. */
  onDrag?: ((event: MarkerDragEvent) => void) | undefined;
  /** Called when the marker is dropped. */
  onDragEnd?: ((event: MarkerDragEvent) => void) | undefined;
  /** Content (default: a pin). */
  children?: ReactNode;
}

/**
 * Marker — a point on the map: a pin, or any content. With `onClick` or `draggable` it is a
 * button (name it with `aria-label`); Enter and Space click it, arrow keys move a draggable one.
 */
export const Marker = forwardRef<HTMLDivElement, MarkerProps>(function Marker(
  {
    longitude,
    latitude,
    anchor,
    offset,
    color,
    draggable,
    rotation,
    scale,
    clickTolerance,
    rotationAlignment,
    pitchAlignment,
    onDragStart,
    onDrag,
    onDragEnd,
    onClick,
    children,
    ...props
  },
  ref,
) {
  const context = useMapContext("Marker");
  const element = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => element.current as HTMLDivElement);
  const handlers = useRef({ onDragStart, onDrag, onDragEnd });
  handlers.current = { onDragStart, onDrag, onDragEnd };
  useEffect(() => {
    const node = element.current as HTMLDivElement;
    context.drags.set(node, (phase, lngLat) => {
      const callback =
        phase === "start"
          ? handlers.current.onDragStart
          : phase === "drag"
            ? handlers.current.onDrag
            : handlers.current.onDragEnd;
      callback?.({ lngLat });
    });
    return () => {
      context.drags.delete(node);
    };
  }, [context.drags]);
  const interactive = Boolean(onClick) || Boolean(draggable);
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: a button when interactive; the map controller clicks it on Enter and Space.
    <div
      {...props}
      ref={element}
      {...mapMarkerAttributes({
        longitude,
        latitude,
        anchor,
        color,
        draggable,
        rotation,
        scale,
        clickTolerance,
        rotationAlignment,
        pitchAlignment,
      })}
      data-ok-offset={offsetAttribute(offset)}
      role={props.role ?? (interactive ? "button" : undefined)}
      tabIndex={props.tabIndex ?? (interactive ? 0 : undefined)}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        if (context.controller?.wasDragged(event.currentTarget)) return;
        onClick?.(event);
      }}
    >
      {children ?? <MapPin />}
    </div>
  );
});

// --- Popup ----------------------------------------------------------------------------------------

export interface PopupProps extends HTMLAttributes<HTMLDivElement> {
  longitude: number;
  latitude: number;
  /** Which side points at the point. Default: picked so the popup fits. */
  anchor?: MapAnchor | undefined;
  /** Distance from the point in px, or `[x, y]`. */
  offset?: MapOffset | undefined;
  /** Shows a close button. Default `true`. */
  closeButton?: boolean | undefined;
  /** A click on the map closes it. Default `true`. */
  closeOnClick?: boolean | undefined;
  /** Moving the map closes it. */
  closeOnMove?: boolean | undefined;
  /** Moves focus into the popup when it opens (and back when it closes). Default `true`. */
  focusAfterOpen?: boolean | undefined;
  /** Widest the popup gets: px or a CSS length (`"20rem"`). Default 240. */
  maxWidth?: number | string | undefined;
  /** The popup asks to close (close button, map click, Escape, move): remove it. */
  onClose?: ((reason: MapPopupCloseReason) => void) | undefined;
  /** Called once it is shown. */
  onOpen?: (() => void) | undefined;
  children?: ReactNode;
}

/** Popup — a dialog that points at a place. It shows while rendered; `onClose` asks to remove it. */
export const Popup = forwardRef<HTMLDivElement, PopupProps>(function Popup(
  {
    longitude,
    latitude,
    anchor,
    offset,
    closeButton = true,
    closeOnClick,
    closeOnMove,
    focusAfterOpen,
    maxWidth,
    onClose,
    onOpen,
    children,
    ...props
  },
  ref,
) {
  const context = useMapContext("Popup");
  const element = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => element.current as HTMLDivElement);
  const callbacks = useRef({ onClose, onOpen });
  callbacks.current = { onClose, onOpen };
  useEffect(() => {
    const node = element.current as HTMLDivElement;
    context.popups.set(node, (reason) => callbacks.current.onClose?.(reason));
    callbacks.current.onOpen?.();
    return () => {
      context.popups.delete(node);
    };
  }, [context.popups]);
  return (
    <div
      role="dialog"
      tabIndex={-1}
      {...props}
      ref={element}
      {...mapPopupAttributes({
        longitude,
        latitude,
        anchor,
        maxWidth,
        closeOnClick,
        closeOnMove,
        focusAfterOpen,
      })}
      data-ok-offset={offsetAttribute(offset)}
    >
      <span data-ok-map-popup-tip="" aria-hidden="true" />
      <div data-ok-map-popup-content="" data-ok-paper="">
        {children}
      </div>
      {closeButton ? (
        <button type="button" data-ok-map-popup-close="" aria-label={context.labels.close}>
          <Icon icon={mapIcons.close} />
        </button>
      ) : null}
    </div>
  );
});

// --- Source / Layer -------------------------------------------------------------------------------

export type SourceProps = MapSourceSpec & {
  /** Source id (default: generated). Layers inside use it. */
  id?: string | undefined;
  children?: ReactNode;
};

/** Source — data for layers (GeoJSON, vector or raster tiles, images). Renders no markup. */
export function Source({ id, children, ...spec }: SourceProps) {
  const { controller } = useMapContext("Source");
  const generated = useId();
  const sourceId = id ?? generated;
  const { data, ...rest } = spec as Record<string, unknown>;
  const key = JSON.stringify(rest);
  // biome-ignore lint/correctness/useExhaustiveDependencies: key stands for the spec without data.
  useEffect(() => {
    controller?.setSource(sourceId, spec as MapSourceSpec);
  }, [controller, sourceId, key, data]);
  useEffect(
    () => () => {
      controller?.removeSource(sourceId);
    },
    [controller, sourceId],
  );
  return <SourceContext.Provider value={sourceId}>{children}</SourceContext.Provider>;
}

/** `Omit` for each member of a union (layer specs differ per `type`). */
type OmitEach<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
/** A MapLibre filter expression. */
export type MapLayerFilter = Exclude<Parameters<MapLibreMap["setFilter"]>[1], null | undefined>;

export type LayerProps = OmitEach<MapLayerSpec, "id" | "source"> & {
  /** Layer id (default: generated). */
  id?: string | undefined;
  /** Source id (default: the enclosing `Source`). */
  source?: string | undefined;
  /** Draws the layer under this one. */
  beforeId?: string | undefined;
  /** Which features it draws (MapLibre expression); `undefined`: all. */
  filter?: MapLayerFilter | undefined;
};

/** Layer — how a source's data is drawn (`circle`, `fill`, `line`, `symbol`, `heatmap`…). No markup. */
export function Layer({ id, source, beforeId, ...spec }: LayerProps) {
  const { controller } = useMapContext("Layer");
  const parent = useContext(SourceContext);
  const generated = useId();
  const layerId = id ?? generated;
  const sourceId = source ?? parent ?? undefined;
  const full = {
    ...spec,
    id: layerId,
    ...(sourceId === undefined ? {} : { source: sourceId }),
  } as MapLayerSpec;
  const key = JSON.stringify(full);
  // biome-ignore lint/correctness/useExhaustiveDependencies: key stands for the spec.
  useEffect(() => {
    controller?.setLayer(full, beforeId);
  }, [controller, key, beforeId]);
  useEffect(
    () => () => {
      controller?.removeLayer(layerId);
    },
    [controller, layerId],
  );
  return null;
}

// --- Panel ----------------------------------------------------------------------------------------

export interface MapPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Corner it sits in. Default `top-right`. */
  position?: MapPosition | undefined;
  children?: ReactNode;
  /** Inline styles of the panel. */
  style?: CSSProperties | undefined;
}

/** MapPanel — a dark, translucent card over the map for settings or readouts. */
export const MapPanel = forwardRef<HTMLDivElement, MapPanelProps>(function MapPanel(
  { position = "top-right", children, ...props },
  ref,
) {
  return (
    <div {...props} ref={ref} data-ok-map-panel="" data-ok-position={position} data-ok-theme="dark">
      {children}
    </div>
  );
});
