"use client";

/**
 * Household example block for blog posts: a ```household fenced block whose
 * body is a JSON spec of stored household results. Readers choose an example
 * and a change; a breakdown table gives each income row under current law,
 * under the change and the difference, with collapsible rows. Posts carry
 * the figures; the component computes nothing but differences and sums for
 * the summary line. An invalid spec renders nothing.
 *
 * Spec:
 * {
 *   "type": "household",
 *   "title": "...", "subtitle": "...", "note": "...",
 *   "changes": [{ "id": "removals", "label": "Two removals" }, ...],
 *   "examples": [{
 *     "id": "with_parents", "label": "20, living with parents",
 *     "results": {
 *       "removals": {
 *         "net": [11504.33, 4543.49],
 *         "rows": [{ "label": "Benefits", "values": [11504.33, 4543.49],
 *                    "children": [{ "label": "Universal Credit", ... }] }]
 *       }
 *     }
 *   }]
 * }
 *
 * "values" is [current law, under the change], in £ a year. Top-level rows
 * are groups; a group labelled "Taxes" counts as a deduction, so a rise in it
 * is shown as a loss. An example lists only the changes its results cover.
 */

import { Fragment, useId, useState } from "react";

import { isFiniteNumber, isRecord } from "./blogChartUtils";

export interface HouseholdRow {
  label: string;
  values: [number, number];
  children?: HouseholdRow[];
}

export interface HouseholdResult {
  net: [number, number];
  rows: HouseholdRow[];
}

export interface HouseholdExample {
  id: string;
  label: string;
  results: Record<string, HouseholdResult>;
}

export interface BlogHouseholdSpec {
  type: "household";
  title?: string;
  subtitle?: string;
  note?: string;
  changes: { id: string; label: string }[];
  examples: HouseholdExample[];
}

const TAXES = "Taxes";
const MINUS = "−";
/** A change that rounds to under £1 is no change. */
const isZero = (v: number) => Math.round(v) === 0;

function validPair(v: unknown): v is [number, number] {
  return Array.isArray(v) && v.length === 2 && v.every(isFiniteNumber);
}

function validRow(row: unknown, depth = 0): boolean {
  if (!isRecord(row) || depth > 4) return false;
  if (typeof row.label !== "string" || !validPair(row.values)) return false;
  return (
    row.children === undefined ||
    (Array.isArray(row.children) &&
      row.children.every((c) => validRow(c, depth + 1)))
  );
}

export function parseHouseholdSpec(raw: string): BlogHouseholdSpec | null {
  let s: unknown;
  try {
    s = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(s) || s.type !== "household") return null;
  if (
    !["title", "subtitle", "note"].every(
      (k) => s[k] === undefined || typeof s[k] === "string",
    )
  ) {
    return null;
  }
  const { changes, examples } = s;
  if (!Array.isArray(changes) || changes.length === 0) return null;
  if (
    !changes.every(
      (c) =>
        isRecord(c) && typeof c.id === "string" && typeof c.label === "string",
    )
  ) {
    return null;
  }
  const ids = new Set(changes.map((c) => (c as { id: string }).id));
  if (!Array.isArray(examples) || examples.length === 0) return null;
  const valid = examples.every(
    (e) =>
      isRecord(e) &&
      typeof e.id === "string" &&
      typeof e.label === "string" &&
      isRecord(e.results) &&
      Object.keys(e.results).length > 0 &&
      Object.entries(e.results).every(
        ([key, r]) =>
          ids.has(key) &&
          isRecord(r) &&
          validPair(r.net) &&
          Array.isArray(r.rows) &&
          r.rows.every((row) => validRow(row)),
      ),
  );
  return valid ? (s as unknown as BlogHouseholdSpec) : null;
}

/** "£6,961", whole pounds. */
export function pounds(value: number): string {
  return `£${Math.round(Math.abs(value)).toLocaleString("en-GB")}`;
}

/** "+£1,158", "−£6,961", or "—" for no change. */
export function signedPounds(value: number): string {
  if (isZero(value)) return "—";
  return `${value > 0 ? "+" : MINUS}${pounds(value)}`;
}

/** The change's effect on net income: a rise in taxes is a loss. */
const effect = (change: number, deduction: boolean) =>
  deduction ? -change : change;

const GAIN = "var(--primary)";
// A darker mix of the error token, for text contrast on white
const LOSS = "color-mix(in srgb, var(--color-error) 75%, black)";

function toneColor(change: number, deduction: boolean): string | undefined {
  const e = effect(change, deduction);
  if (isZero(e)) return undefined;
  return e > 0 ? GAIN : LOSS;
}

/**
 * One line on what changes: each group that moves, with the row inside it
 * that moves most, and the groups that don't.
 */
export function householdSummary(result: HouseholdResult): string {
  const netChange = result.net[1] - result.net[0];
  const moved: string[] = [];
  const still: string[] = [];
  for (const group of result.rows) {
    const change = group.values[1] - group.values[0];
    const name = group.label;
    if (isZero(change)) {
      still.push(name.toLowerCase());
      continue;
    }
    const verb = change > 0 ? "rise" : "fall";
    const parts = (group.children ?? []).filter(
      (c) => !isZero(c.values[1] - c.values[0]),
    );
    let detail = "";
    if (parts.length > 0) {
      const top = parts.reduce((a, b) =>
        Math.abs(b.values[1] - b.values[0]) >
        Math.abs(a.values[1] - a.values[0])
          ? b
          : a,
      );
      const share = Math.abs(top.values[1] - top.values[0]) / Math.abs(change);
      if (parts.length === 1) detail = `, all of it ${top.label}`;
      else if (share >= 0.5) detail = `, mostly ${top.label}`;
    }
    moved.push(
      `${name.toLowerCase()} ${verb} by ${pounds(change)} a year${detail}`,
    );
  }
  if (moved.length === 0) {
    return "Net income doesn't change.";
  }
  const sentence = [moved.join("; ")];
  if (still.length > 0) {
    const list =
      still.length === 1
        ? still[0]
        : `${still.slice(0, -1).join(", ")} and ${still[still.length - 1]}`;
    sentence.push(`${list} ${still.length === 1 ? "is" : "are"} unchanged`);
  }
  const text = sentence.join("; ");
  const net = isZero(netChange)
    ? " Net income doesn't change."
    : ` Net income ${netChange > 0 ? "rises" : "falls"} by ${pounds(netChange)} a year.`;
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.${net}`;
}

const cell = {
  padding: "8px 12px",
  borderBottom: "1px solid var(--border)",
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  textAlign: "right" as const,
  fontVariantNumeric: "tabular-nums" as const,
  whiteSpace: "nowrap" as const,
};

function Rows({
  rows,
  depth,
  path,
  open,
  toggle,
  deduction,
  idBase,
}: {
  rows: HouseholdRow[];
  depth: number;
  path: string;
  open: Set<string>;
  toggle: (key: string) => void;
  deduction: boolean;
  idBase: string;
}) {
  return (
    <>
      {rows.map((row, i) => {
        const key = `${path}/${i}`;
        const kids = row.children ?? [];
        const expanded = open.has(key);
        const change = row.values[1] - row.values[0];
        const rowDeduction = depth === 0 ? row.label === TAXES : deduction;
        const groupId = `${idBase}-${key.replace(/\//g, "-")}`;
        return (
          <Fragment key={key}>
            <tr id={groupId}>
              <th
                scope="row"
                style={{
                  ...cell,
                  textAlign: "left",
                  whiteSpace: "normal",
                  fontWeight: depth === 0 ? 600 : 400,
                  paddingLeft: 12 + depth * 20,
                }}
              >
                {kids.length > 0 ? (
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={
                      expanded
                        ? kids.map((_, j) => `${groupId}-${j}`).join(" ")
                        : undefined
                    }
                    onClick={() => toggle(key)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      font: "inherit",
                      color: "inherit",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{ display: "inline-block", width: 16 }}
                    >
                      {expanded ? "▾" : "▸"}
                    </span>
                    {row.label}
                  </button>
                ) : (
                  <span style={{ paddingLeft: depth > 0 ? 16 : 0 }}>
                    {row.label}
                  </span>
                )}
              </th>
              <td style={cell}>{pounds(row.values[0])}</td>
              <td style={cell}>{pounds(row.values[1])}</td>
              <td style={{ ...cell, color: toneColor(change, rowDeduction) }}>
                {signedPounds(change)}
              </td>
            </tr>
            {kids.length > 0 && expanded && (
              <Rows
                rows={kids}
                depth={depth + 1}
                path={key}
                open={open}
                toggle={toggle}
                deduction={rowDeduction}
                idBase={idBase}
              />
            )}
          </Fragment>
        );
      })}
    </>
  );
}

/** Every row key that has children: all rows open at first. */
function allKeys(rows: HouseholdRow[], path = ""): string[] {
  return rows.flatMap((row, i) => {
    const key = `${path}/${i}`;
    return row.children?.length ? [key, ...allKeys(row.children, key)] : [];
  });
}

const selectStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  color: "var(--foreground)",
  background: "var(--background)",
  border: "1px solid var(--border-medium)",
  borderRadius: 6,
  padding: "4px 8px",
  maxWidth: "100%",
};

export function HouseholdBody({ spec }: { spec: BlogHouseholdSpec }) {
  const baseId = useId();
  const [exampleId, setExampleId] = useState(spec.examples[0].id);
  const example =
    spec.examples.find((e) => e.id === exampleId) ?? spec.examples[0];
  const covered = spec.changes.filter((c) => example.results[c.id]);
  const [changeId, setChangeId] = useState(covered[0].id);
  const change = covered.find((c) => c.id === changeId) ?? covered[0];
  const result = example.results[change.id];
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const keys = allKeys(result.rows);
  const open = new Set(keys.filter((k) => !closed.has(k)));
  const toggle = (key: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const netChange = result.net[1] - result.net[0];
  const label = { fontFamily: "var(--font-sans)", fontSize: 14 };

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 16px",
          marginBottom: 12,
          color: "var(--foreground)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label htmlFor={`${baseId}-example`} style={label}>
            Household
          </label>
          <select
            id={`${baseId}-example`}
            value={example.id}
            onChange={(e) => setExampleId(e.target.value)}
            style={selectStyle}
          >
            {spec.examples.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label htmlFor={`${baseId}-change`} style={label}>
            Change
          </label>
          <select
            id={`${baseId}-change`}
            value={change.id}
            onChange={(e) => setChangeId(e.target.value)}
            style={selectStyle}
          >
            {covered.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p
        aria-live="polite"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          lineHeight: 1.5,
          color: "var(--foreground)",
          margin: "0 0 8px",
        }}
      >
        {householdSummary(result)}
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <caption
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              overflow: "hidden",
              clip: "rect(0 0 0 0)",
            }}
          >
            {`${example.label}: ${change.label}, £ a year`}
          </caption>
          <thead>
            <tr>
              <th scope="col" style={{ ...cell, textAlign: "left" }}>
                £ a year
              </th>
              <th scope="col" style={cell}>
                Current law
              </th>
              <th scope="col" style={cell}>
                Under the change
              </th>
              <th scope="col" style={cell}>
                Change
              </th>
            </tr>
          </thead>
          <tbody>
            <Rows
              rows={result.rows}
              depth={0}
              path=""
              open={open}
              toggle={toggle}
              deduction={false}
              idBase={baseId}
            />
            <tr style={{ fontWeight: 600 }}>
              <th
                scope="row"
                style={{ ...cell, textAlign: "left", fontWeight: 600 }}
              >
                Net income
              </th>
              <td style={cell}>{pounds(result.net[0])}</td>
              <td style={cell}>{pounds(result.net[1])}</td>
              <td style={{ ...cell, color: toneColor(netChange, false) }}>
                {signedPounds(netChange)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BlogHousehold({ data }: { data: string | string[] }) {
  const titleId = useId();
  const raw = Array.isArray(data) ? data.join("") : data;
  const spec = parseHouseholdSpec(raw);
  if (!spec) return null;
  return (
    <figure
      aria-labelledby={spec.title ? titleId : undefined}
      style={{ margin: "24px 0 32px" }}
    >
      {spec.title && (
        <h3
          id={titleId}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 16,
            fontWeight: 600,
            lineHeight: 1.4,
            color: "var(--foreground)",
            margin: "0 0 4px",
          }}
        >
          {spec.title}
        </h3>
      )}
      {spec.subtitle && (
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            lineHeight: 1.5,
            color: "var(--muted-foreground)",
            margin: "0 0 12px",
          }}
        >
          {spec.subtitle}
        </p>
      )}
      <HouseholdBody spec={spec} />
      {spec.note && (
        <figcaption
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            lineHeight: 1.5,
            color: "var(--text-secondary)",
            marginTop: 8,
          }}
        >
          {spec.note}
        </figcaption>
      )}
    </figure>
  );
}
