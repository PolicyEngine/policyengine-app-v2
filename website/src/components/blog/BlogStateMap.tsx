"use client";

/**
 * US state tile map body for ```chart blocks of type "stateMap".
 *
 * Each state is an equal tile on the 11 by 8 grid of the PolicyEngine slides'
 * state map, shaded by bin from the background to the primary color and
 * labeled with its value. Built from inline token styles rather than ui-kit's
 * HexagonalMap, which sizes its SVG in fixed pixels and positions its layout
 * and tooltip with unprefixed utility classes the website does not generate.
 *
 * Spec:
 * {
 *   "type": "stateMap",
 *   "title": "...", "subtitle": "...",
 *   "stateKey": "state", "valueKey": "rate",
 *   "data": [{ "state": "AL", "rate": 14.4 }, ...],
 *   "bins": [{ "below": 9, "label": "under 9%" }, ..., { "label": "18% and up" }],
 *   "summary": { "label": "United States", "value": 13.0 },
 *   "note": "...",
 *   "format": { "decimals": 1, "suffix": "%" },
 *   "source": "..."
 * }
 *
 * A value falls in the first bin whose "below" it is under; the last bin has
 * no bound. Tiles print the value without the suffix; the tooltip adds it.
 */

import { type CSSProperties, useEffect, useRef, useState } from "react";
import {
  LEGEND_STYLE,
  TOOLTIP_CONTAINER_STYLE,
} from "@policyengine/ui-kit/charts";

import {
  type BlogChartFormat,
  type BlogChartRow,
  formatChartValue,
  isFiniteNumber,
  isRecord,
} from "./blogChartUtils";

/** Tile column and row on the 11 by 8 grid, from the slides' state map. */
export const US_STATE_TILES: Record<
  string,
  { name: string; col: number; row: number }
> = {
  AK: { name: "Alaska", col: 0, row: 0 },
  AL: { name: "Alabama", col: 6, row: 6 },
  AR: { name: "Arkansas", col: 4, row: 5 },
  AZ: { name: "Arizona", col: 1, row: 5 },
  CA: { name: "California", col: 0, row: 4 },
  CO: { name: "Colorado", col: 2, row: 4 },
  CT: { name: "Connecticut", col: 9, row: 3 },
  DC: { name: "District of Columbia", col: 8, row: 5 },
  DE: { name: "Delaware", col: 9, row: 4 },
  FL: { name: "Florida", col: 7, row: 7 },
  GA: { name: "Georgia", col: 7, row: 6 },
  HI: { name: "Hawaii", col: 0, row: 7 },
  IA: { name: "Iowa", col: 4, row: 3 },
  ID: { name: "Idaho", col: 1, row: 2 },
  IL: { name: "Illinois", col: 5, row: 2 },
  IN: { name: "Indiana", col: 5, row: 3 },
  KS: { name: "Kansas", col: 3, row: 5 },
  KY: { name: "Kentucky", col: 5, row: 4 },
  LA: { name: "Louisiana", col: 4, row: 6 },
  MA: { name: "Massachusetts", col: 9, row: 2 },
  MD: { name: "Maryland", col: 8, row: 4 },
  ME: { name: "Maine", col: 10, row: 0 },
  MI: { name: "Michigan", col: 6, row: 2 },
  MN: { name: "Minnesota", col: 4, row: 2 },
  MO: { name: "Missouri", col: 4, row: 4 },
  MS: { name: "Mississippi", col: 5, row: 6 },
  MT: { name: "Montana", col: 2, row: 2 },
  NC: { name: "North Carolina", col: 6, row: 5 },
  ND: { name: "North Dakota", col: 3, row: 2 },
  NE: { name: "Nebraska", col: 3, row: 4 },
  NH: { name: "New Hampshire", col: 10, row: 1 },
  NJ: { name: "New Jersey", col: 8, row: 3 },
  NM: { name: "New Mexico", col: 2, row: 5 },
  NV: { name: "Nevada", col: 1, row: 3 },
  NY: { name: "New York", col: 8, row: 2 },
  OH: { name: "Ohio", col: 6, row: 3 },
  OK: { name: "Oklahoma", col: 3, row: 6 },
  OR: { name: "Oregon", col: 0, row: 3 },
  PA: { name: "Pennsylvania", col: 7, row: 3 },
  RI: { name: "Rhode Island", col: 10, row: 3 },
  SC: { name: "South Carolina", col: 7, row: 5 },
  SD: { name: "South Dakota", col: 3, row: 3 },
  TN: { name: "Tennessee", col: 5, row: 5 },
  TX: { name: "Texas", col: 3, row: 7 },
  UT: { name: "Utah", col: 1, row: 4 },
  VA: { name: "Virginia", col: 7, row: 4 },
  VT: { name: "Vermont", col: 9, row: 1 },
  WA: { name: "Washington", col: 0, row: 2 },
  WI: { name: "Wisconsin", col: 5, row: 1 },
  WV: { name: "West Virginia", col: 6, row: 4 },
  WY: { name: "Wyoming", col: 2, row: 3 },
};

const GRID_COLUMNS = 11;
const GRID_ROWS = 8;
const MAX_BINS = 7;

export interface BlogStateMapBin {
  below?: number;
  label: string;
}

export interface BlogStateMapSpec {
  type: "stateMap";
  title?: string;
  subtitle?: string;
  stateKey: string;
  valueKey: string;
  data: BlogChartRow[];
  bins: BlogStateMapBin[];
  summary?: { label: string; value: number };
  note?: string;
  format?: BlogChartFormat;
  source?: string;
}

function isState(code: unknown): code is string {
  return (
    typeof code === "string" &&
    Object.prototype.hasOwnProperty.call(US_STATE_TILES, code)
  );
}

function validBins(bins: unknown): bins is BlogStateMapBin[] {
  if (!Array.isArray(bins) || bins.length < 2 || bins.length > MAX_BINS) {
    return false;
  }
  return bins.every((bin, i) => {
    if (!isRecord(bin) || typeof bin.label !== "string") return false;
    if (i === bins.length - 1) return bin.below === undefined;
    const prev = i > 0 ? (bins[i - 1] as BlogStateMapBin).below : undefined;
    return (
      isFiniteNumber(bin.below) && (prev === undefined || bin.below > prev)
    );
  });
}

export function parseStateMapSpec(
  s: Record<string, unknown>,
): BlogStateMapSpec | null {
  const { stateKey, valueKey, data, bins, summary } = s;
  if (s.type !== "stateMap") return null;
  if (typeof stateKey !== "string" || typeof valueKey !== "string") return null;
  if (!validBins(bins)) return null;
  if (!Array.isArray(data) || data.length === 0) return null;
  const seen = new Set<string>();
  for (const row of data) {
    if (!isRecord(row)) return null;
    const code = row[stateKey];
    if (!isState(code) || seen.has(code) || !isFiniteNumber(row[valueKey])) {
      return null;
    }
    seen.add(code);
  }
  if (
    summary !== undefined &&
    !(
      isRecord(summary) &&
      typeof summary.label === "string" &&
      isFiniteNumber(summary.value)
    )
  ) {
    return null;
  }
  return s as unknown as BlogStateMapSpec;
}

/** The first bin whose bound the value is under, or the open last bin. */
export function binIndex(value: number, bins: BlogStateMapBin[]): number {
  const i = bins.findIndex((b) => b.below !== undefined && value < b.below);
  return i === -1 ? bins.length - 1 : i;
}

/**
 * Fill and text colors for bin `i` of `n`: the primary color mixed into the
 * background from 12 to 100 percent. Text turns inverse only on the full
 * primary, where it has the higher contrast.
 */
export function binShade(i: number, n: number): { fill: string; text: string } {
  const pct = Math.round(12 + (88 * i) / (n - 1));
  return pct >= 100
    ? { fill: "var(--primary)", text: "var(--text-inverse)" }
    : {
        fill: `color-mix(in srgb, var(--primary) ${pct}%, var(--background))`,
        text: "var(--foreground)",
      };
}

const NO_DATA = {
  fill: "var(--background-tertiary)",
  text: "var(--text-secondary)",
};

function tooltipPosition(col: number, row: number): CSSProperties {
  const above = row > 0;
  const top = `${((above ? row : row + 1) / GRID_ROWS) * 100}%`;
  const y = above ? "calc(-100% - 6px)" : "6px";
  // Tiles near either edge anchor the tooltip to that edge, so a long state
  // name stays inside the map on a phone.
  if (col <= 2) {
    return {
      top,
      left: `${(col / GRID_COLUMNS) * 100}%`,
      transform: `translateY(${y})`,
    };
  }
  if (col >= GRID_COLUMNS - 3) {
    return {
      top,
      right: `${((GRID_COLUMNS - 1 - col) / GRID_COLUMNS) * 100}%`,
      transform: `translateY(${y})`,
    };
  }
  return {
    top,
    left: `${((col + 0.5) / GRID_COLUMNS) * 100}%`,
    transform: `translate(-50%, ${y})`,
  };
}

export function StateMapBody({ spec }: { spec: BlogStateMapSpec }) {
  const [active, setActive] = useState<string | null>(null);
  const pointerType = useRef("mouse");
  const mapRef = useRef<HTMLDivElement>(null);

  // A tapped tooltip also closes on a tap anywhere outside the map.
  useEffect(() => {
    if (!active) return;
    const close = (e: PointerEvent) => {
      if (!mapRef.current?.contains(e.target as Node)) setActive(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [active]);
  const format = spec.format ?? {};
  const values = new Map(
    spec.data.map((row) => [
      row[spec.stateKey] as string,
      row[spec.valueKey] as number,
    ]),
  );
  const shades = spec.bins.map((_, i) => binShade(i, spec.bins.length));
  const activeTile = active ? US_STATE_TILES[active] : undefined;
  const activeValue = active ? values.get(active) : undefined;

  return (
    <div>
      <div
        style={{
          ...LEGEND_STYLE.wrapperStyle,
          paddingTop: 0,
          marginBottom: 12,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "4px 16px",
        }}
      >
        {spec.summary && (
          <span style={{ fontWeight: 600, color: "var(--foreground)" }}>
            {spec.summary.label}: {formatChartValue(spec.summary.value, format)}
          </span>
        )}
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexWrap: "wrap",
            gap: "4px 16px",
          }}
        >
          {spec.bins.map((bin, i) => (
            <li
              key={i}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 12,
                  height: 12,
                  flexShrink: 0,
                  borderRadius: 2,
                  background: shades[i].fill,
                }}
              />
              {bin.label}
            </li>
          ))}
        </ul>
      </div>
      <div
        ref={mapRef}
        style={{ position: "relative", containerType: "inline-size" }}
      >
        <div
          role="list"
          aria-label={spec.title}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
            gap: "clamp(2px, 0.5cqw, 4px)",
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(8px, 1.75cqw, 14px)",
            lineHeight: 1.15,
          }}
        >
          {Object.entries(US_STATE_TILES).map(([code, tile]) => {
            const value = values.get(code);
            const shade =
              value === undefined
                ? NO_DATA
                : shades[binIndex(value, spec.bins)];
            return (
              <div
                key={code}
                role="listitem"
                aria-label={`${tile.name}: ${
                  value === undefined
                    ? "no data"
                    : formatChartValue(value, format)
                }`}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") setActive(code);
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === "mouse") setActive(null);
                }}
                onPointerDown={(e) => {
                  pointerType.current = e.pointerType;
                }}
                onClick={() => {
                  // A mouse shows the tooltip on hover; a tap toggles it.
                  if (pointerType.current !== "mouse") {
                    setActive((a) => (a === code ? null : code));
                  }
                }}
                style={{
                  gridColumn: tile.col + 1,
                  gridRow: tile.row + 1,
                  aspectRatio: "4 / 3",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 4,
                  background: shade.fill,
                  color: shade.text,
                  boxShadow:
                    active === code
                      ? "inset 0 0 0 2px var(--foreground)"
                      : "none",
                }}
              >
                <span aria-hidden="true" style={{ fontWeight: 600 }}>
                  {code}
                </span>
                <span aria-hidden="true">
                  {value === undefined
                    ? "–"
                    : formatChartValue(value, { ...format, suffix: "" })}
                </span>
              </div>
            );
          })}
        </div>
        {active && activeTile && (
          <div
            role="tooltip"
            style={{
              ...TOOLTIP_CONTAINER_STYLE,
              lineHeight: 1.4,
              position: "absolute",
              zIndex: 1,
              pointerEvents: "none",
              whiteSpace: "nowrap",
              ...tooltipPosition(activeTile.col, activeTile.row),
            }}
          >
            <p
              style={{ fontWeight: 600, margin: 0, color: "var(--foreground)" }}
            >
              {activeTile.name}
            </p>
            <p style={{ margin: "4px 0 0", color: "var(--muted-foreground)" }}>
              {activeValue === undefined
                ? "No data"
                : formatChartValue(activeValue, format)}
            </p>
          </div>
        )}
      </div>
      {spec.note && (
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            lineHeight: 1.5,
            color: "var(--text-secondary)",
            margin: "12px 0 0",
          }}
        >
          {spec.note}
        </p>
      )}
    </div>
  );
}
