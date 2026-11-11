"use client";

import {
  type MapLegendVariant,
  type MapPosition,
  type MapRegionsLinkFilter,
  mapLegendAttributes,
  mapRegionsAttributes,
} from "@owlky/core";
import {
  type MapPatternStyle,
  type MapScaleClass,
  type MapScaleResult,
  type MapSizeScaleResult,
  mapScaleLabel,
} from "@owlky/core/map";
import { type HTMLAttributes, type ReactNode, useCallback, useEffect, useId, useRef } from "react";
import { useMapContext } from "./map-context.js";
import { InCorner } from "./map-controls.js";

export {
  type GreatCircleFeature,
  type GreatCircleOptions,
  greatCircle,
  type MapBubbleLayerOptions,
  type MapHexbinAggregate,
  type MapHexbinCollection,
  type MapHexbinFeature,
  type MapHexbinOptions,
  type MapHexbinPoint,
  type MapLngLat,
  type MapPatternLayerOptions,
  type MapPatternStyle,
  type MapPixelGridOptions,
  type MapPixelShape,
  type MapRegionLayersOptions,
  type MapScaleClass,
  type MapScaleMethod,
  type MapScaleOptions,
  type MapScalePalette,
  type MapScaleResult,
  type MapSizeLegendItem,
  type MapSizeMethod,
  type MapSizeScaleOptions,
  type MapSizeScaleResult,
  mapBubbleLayer,
  mapHexbin,
  mapPatternLayer,
  mapPixelGrid,
  mapRegionLayers,
  mapScale,
  mapScaleLabel,
  mapSizeScale,
} from "@owlky/core/map";

const NUMBER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const formatNumber = (value: number) => NUMBER.format(value);

/** Registers a part's callback in the map's registry while the part is in the DOM. */
function useRegistered<T>(registry: WeakMap<Element, T>, callback: T) {
  const node = useRef<Element | null>(null);
  return useCallback(
    (element: Element | null) => {
      if (node.current) registry.delete(node.current);
      node.current = element;
      if (element) registry.set(element, callback);
    },
    [registry, callback],
  );
}

// --- Regions --------------------------------------------------------------------------------------

/** One region of a choropleth: the feature id it joins, its name and its value. */
export interface MapRegionDatum {
  /** The feature id (the source's `promoteId` property, or the feature's own id). */
  readonly id: string | number;
  readonly name: string;
  /** The value that colors the region (`null`: no data). */
  readonly value: number | null | undefined;
}

export interface MapRegionSelectEvent {
  /** The region selected or toggled, or `null` when the selection was cleared. */
  readonly id: string | number | null;
  /** Every selected region's id, in the order of `data`. */
  readonly ids: readonly (string | number)[];
}

export interface MapRegionsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** The source whose features are the regions (it needs feature ids: `promoteId`). */
  source: string;
  /** Vector sources: the source layer with the regions. */
  sourceLayer?: string | undefined;
  /** The fill layer that pointer hovers and clicks hit (the first layer of `mapRegionLayers`). */
  layer?: string | undefined;
  /** The regions and their values. */
  data: readonly MapRegionDatum[];
  /** The data table's caption, such as "Population by state, 2020". */
  caption: ReactNode;
  /** Header of the name column. Default `Region`. */
  nameLabel?: string | undefined;
  /** Header of the value column. Default `Value`. */
  valueLabel?: string | undefined;
  /** Text of a value in the table and the regions list. Default: up to two decimals. */
  formatValue?: ((value: number) => string) | undefined;
  /** Accessible name of the regions list. Default from the map's `labels.regions` ("Regions"). */
  listLabel?: string | undefined;
  /** Called when the selection changes (a click on the map, Enter or Space in the list, a box). */
  onRegionSelect?: ((event: MapRegionSelectEvent) => void) | undefined;
  /** Several regions can be selected: a click, Enter or Space toggles one, Shift + arrows add the next, Ctrl + A selects all, Escape clears. */
  multiple?: boolean | undefined;
  /** Shift + drag on the map selects the regions whose label anchor is in the box (Alt adds, Escape cancels). Implies `multiple`; the map's Shift + drag zoom is off. */
  boxSelect?: boolean | undefined;
  /** Links the regions to those of other maps with the same `group`: a selection filters the others. */
  group?: string | undefined;
  /** In a `group`: `bidirectional` (send and show filters), `emit` (send only) or `receive` (show only). Default `"bidirectional"`. */
  linkFilter?: MapRegionsLinkFilter | undefined;
  /** The selected ids, to set the selection from your state (for example `[]` to clear it). Uncontrolled when omitted. */
  selection?: readonly (string | number)[] | undefined;
}

/**
 * MapRegions — the regions of a choropleth: joins `data` to the source's features through feature
 * state (`value`, `hover`, `focus`, `selected`, `muted`), gives keyboard users a list of the regions
 * (name and value, Enter selects) and holds the data as a table for assistive technology.
 */
export function MapRegions({
  source,
  sourceLayer,
  layer,
  data,
  caption,
  nameLabel = "Region",
  valueLabel = "Value",
  formatValue = formatNumber,
  listLabel,
  onRegionSelect,
  multiple,
  boxSelect,
  group,
  linkFilter,
  selection,
  ...props
}: MapRegionsProps) {
  const { regions, labels, controller } = useMapContext("MapRegions");
  const latest = useRef(onRegionSelect);
  latest.current = onRegionSelect;
  const handler = useCallback(
    (id: string | number | null, ids: (string | number)[]) => latest.current?.({ id, ids }),
    [],
  );
  const ref = useRegistered(regions, handler);
  const node = useRef<HTMLDivElement | null>(null);
  const setRef = useCallback(
    (element: HTMLDivElement | null) => {
      node.current = element;
      ref(element);
    },
    [ref],
  );
  const selected = selection === undefined ? undefined : JSON.stringify(selection);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `selected` stands for `selection`.
  useEffect(() => {
    if (selection !== undefined && controller && node.current)
      controller.selectRegions(node.current, selection);
  }, [controller, selected]);
  return (
    <div
      {...props}
      ref={setRef}
      data-ok-map-regions=""
      {...mapRegionsAttributes({ multiple, boxSelect, linkFilter })}
      data-ok-group={group}
      data-ok-source={source}
      data-ok-source-layer={sourceLayer}
      data-ok-layer={layer}
    >
      {/* The map fills the list with one option per row (keyboard access, name and value). */}
      <div
        data-ok-map-regions-list=""
        role="listbox"
        tabIndex={0}
        aria-label={listLabel ?? labels.regions}
      />
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{nameLabel}</th>
            <th scope="col">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const value =
              typeof row.value === "number" && Number.isFinite(row.value) ? row.value : null;
            return (
              <tr key={String(row.id)} data-ok-id={String(row.id)}>
                <th scope="row">{row.name}</th>
                {value === null ? (
                  <td>{labels.noData}</td>
                ) : (
                  <td data-ok-value={String(value)}>{formatValue(value)}</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// --- Legend ---------------------------------------------------------------------------------------

export interface MapLegendToggleEvent {
  /** The class that was pressed (its index in the legend). */
  readonly classIndex: number;
  /** Every pressed class: regions outside them are muted (none pressed: none muted). */
  readonly active: readonly number[];
}

export interface MapLegendProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** The scale from `mapScale()`: its classes, colors and range (`classes` and `gradient` legends). */
  scale?: MapScaleResult | undefined;
  /** The size scale from `mapSizeScale()`: the nested circles of a `size` legend. */
  sizeScale?: MapSizeScaleResult | undefined;
  /** The corner of the map that holds the legend. Default `bottom-left`. */
  position?: MapPosition | undefined;
  /** `classes` (default): a swatch and a range per class; `gradient`: one bar from min to max; `size`: nested circles of `sizeScale`. */
  variant?: MapLegendVariant | undefined;
  /** The legend's title (it also names the legend). */
  title?: ReactNode;
  /** Default `true`: classes are toggle buttons that mute the regions outside the pressed ones. */
  interactive?: boolean | undefined;
  /** Adds a class for regions without a value. */
  showNull?: boolean | undefined;
  /** Text of the no-data class. Default from the map's `labels.noData` ("No data"). */
  nullLabel?: string | undefined;
  /** Text of a class. Default: its range, such as "1.5 – 3". */
  formatter?: ((item: MapScaleClass, index: number) => string) | undefined;
  /** A pattern per class (`null`: none), as in `mapPatternLayer`: the swatches repeat the map's textures. */
  patterns?: readonly (MapPatternStyle | null)[] | undefined;
  /** Text of a number in the default class text and the gradient's ticks. */
  tickFormatter?: ((value: number) => string) | undefined;
  /** Called when a class is pressed or released (interactive legends). */
  onLegendToggle?: ((event: MapLegendToggleEvent) => void) | undefined;
}

/**
 * MapLegend — the classes (or the gradient) of a choropleth's scale, or the nested circles of a
 * size scale, in a corner of the map.
 */
export function MapLegend({
  scale,
  sizeScale,
  position = "bottom-left",
  variant = "classes",
  title,
  interactive = true,
  showNull,
  nullLabel,
  formatter,
  patterns,
  tickFormatter = formatNumber,
  onLegendToggle,
  id,
  ...props
}: MapLegendProps) {
  const { legends, labels } = useMapContext("MapLegend");
  const base = useId();
  const titleId = `${id ?? base}-title`;
  const latest = useRef(onLegendToggle);
  latest.current = onLegendToggle;
  const handler = useCallback(
    (classIndex: number, active: readonly number[]) => latest.current?.({ classIndex, active }),
    [],
  );
  const ref = useRegistered(legends, handler);
  const toggles = interactive && variant === "classes";
  const items = (scale?.classes ?? []).map((item, index) => ({
    key: `class-${index}`,
    color: item.color,
    text: formatter ? formatter(item, index) : mapScaleLabel(item, tickFormatter),
    min: String(item.min),
    max: String(item.max),
    none: false,
    pattern: patterns?.[index] ?? undefined,
  }));
  if (showNull && scale)
    items.push({
      key: "null",
      color: scale.nullColor,
      text: nullLabel ?? labels.noData,
      min: "",
      max: "",
      none: true,
      pattern: undefined,
    });
  return (
    <InCorner position={position}>
      {/* biome-ignore lint/a11y/useSemanticElements: a group of toggle buttons, not form fields (<fieldset> would add form semantics and default styles). */}
      <div
        {...props}
        ref={ref}
        id={id}
        role="group"
        aria-labelledby={title === undefined ? undefined : titleId}
        aria-label={title === undefined ? labels.legend : undefined}
        {...mapLegendAttributes({ variant, interactive })}
      >
        {title === undefined ? null : (
          <p data-ok-map-legend-title="" id={titleId}>
            {title}
          </p>
        )}
        {variant === "size" ? (
          <ul
            data-ok-map-legend-sizes=""
            data-ok-radius={String(sizeScale?.legend[0]?.radius ?? 0)}
          >
            {(sizeScale?.legend ?? []).map((item) => (
              <li key={item.value}>
                <span
                  data-ok-map-legend-circle=""
                  data-ok-radius={String(item.radius)}
                  aria-hidden="true"
                />
                <span data-ok-map-legend-label="">{tickFormatter(item.value)}</span>
              </li>
            ))}
          </ul>
        ) : variant === "gradient" ? (
          <div data-ok-map-legend-gradient="">
            <span data-ok-map-legend-bar="" aria-hidden="true">
              {(scale?.colors ?? []).map((color, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: stops are positional.
                <span key={index} data-ok-map-legend-stop="" data-ok-swatch={color} />
              ))}
            </span>
            <div data-ok-map-legend-ticks="">
              <span>{tickFormatter(scale?.min ?? 0)}</span>
              <span>{tickFormatter(scale?.max ?? 0)}</span>
            </div>
          </div>
        ) : (
          <ul data-ok-map-legend-classes="">
            {items.map((item) => {
              const content = (
                <>
                  <span
                    data-ok-map-legend-swatch=""
                    data-ok-swatch={item.color}
                    data-ok-pattern={item.pattern}
                    aria-hidden="true"
                  />
                  <span data-ok-map-legend-label="">{item.text}</span>
                </>
              );
              return (
                <li key={item.key}>
                  {toggles ? (
                    <button
                      type="button"
                      data-ok-map-legend-class=""
                      data-ok-min={item.none ? undefined : item.min}
                      data-ok-max={item.none ? undefined : item.max}
                      data-ok-null={item.none ? "" : undefined}
                      aria-pressed="false"
                    >
                      {content}
                    </button>
                  ) : (
                    <span
                      data-ok-map-legend-class=""
                      data-ok-min={item.none ? undefined : item.min}
                      data-ok-max={item.none ? undefined : item.max}
                      data-ok-null={item.none ? "" : undefined}
                    >
                      {content}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </InCorner>
  );
}
