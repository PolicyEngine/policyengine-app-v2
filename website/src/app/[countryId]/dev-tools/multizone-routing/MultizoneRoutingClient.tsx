"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { IconSearch } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { colors, spacing, typography } from "@policyengine/design-system/tokens";
import type { RecommendationKind, RoutingInventoryRow } from "./routingInventory";

export type TeamInput = {
  recommendation: RecommendationKind;
  comment: string;
};

const RECOMMENDATION_LABELS: Record<RecommendationKind, string> = {
  iframe: "Keep iframe/static",
  rewrite: "Simple rewrite",
  multizone: "Multi-zone",
};

function badgeStyle(kind: RecommendationKind): CSSProperties {
  const palette: Record<
    RecommendationKind,
    { bg: string; color: string; border: string }
  > = {
    iframe: {
      bg: colors.primary[50],
      color: colors.primary[800],
      border: colors.primary[200],
    },
    rewrite: {
      bg: "#FFF7ED",
      color: colors.text.warning,
      border: "#FED7AA",
    },
    multizone: {
      bg: "#F5F3FF",
      color: "#6D28D9",
      border: "#DDD6FE",
    },
  };
  const selected = palette[kind];
  return {
    display: "inline-flex",
    alignItems: "center",
    border: `1px solid ${selected.border}`,
    borderRadius: "999px",
    padding: "2px 8px",
    backgroundColor: selected.bg,
    color: selected.color,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    whiteSpace: "nowrap",
  };
}

export default function MultizoneRoutingClient({
  rows,
  reviewInputs,
}: {
  rows: RoutingInventoryRow[];
  reviewInputs: Record<string, TeamInput>;
}) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("all");
  const [kind, setKind] = useState<RecommendationKind | "all">("all");
  const [origin, setOrigin] = useState("all");

  const mergedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        teamRecommendation:
          reviewInputs[row.id]?.recommendation ?? row.recommendationKind,
        teamComment: reviewInputs[row.id]?.comment ?? "",
      })),
    [reviewInputs, rows],
  );

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return mergedRows.filter((row) => {
      const haystack = [
        row.title,
        row.slug,
        row.country,
        row.path,
        row.currentSetup,
        row.recommendedSetup,
        row.framework,
        row.deployed,
        row.source,
        row.notes,
        row.teamComment,
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!term || haystack.includes(term)) &&
        (country === "all" || row.country === country) &&
        (kind === "all" || row.teamRecommendation === kind) &&
        (origin === "all" || row.origin === origin)
      );
    });
  }, [country, kind, mergedRows, origin, search]);

  const counts = useMemo(
    () => ({
      total: rows.length,
      apps: rows.filter((row) => row.origin === "apps.json").length,
      rewrites: rows.filter((row) => /rewrite|proxy/i.test(row.currentSetup))
        .length,
      multizone: mergedRows.filter(
        (row) => row.teamRecommendation === "multizone",
      ).length,
    }),
    [mergedRows, rows],
  );

  return (
    <div
      style={{
        padding: spacing["3xl"],
        display: "flex",
        flexDirection: "column",
        gap: spacing["2xl"],
      }}
    >
      <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-4 tw:gap-lg">
        {[
          ["Total rows", counts.total],
          ["apps.json rows", counts.apps],
          ["Direct rewrites/proxies", counts.rewrites],
          ["Team multizone picks", counts.multizone],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              backgroundColor: colors.white,
              border: `1px solid ${colors.border.light}`,
              borderRadius: spacing.radius.container,
              padding: spacing.xl,
            }}
          >
            <div
              style={{
                color: colors.primary[800],
                fontSize: typography.fontSize["3xl"],
                fontWeight: typography.fontWeight.bold,
                lineHeight: 1,
              }}
            >
              {value}
            </div>
            <div
              style={{
                marginTop: spacing.xs,
                color: colors.text.secondary,
                fontSize: typography.fontSize.sm,
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          backgroundColor: colors.primary[50],
          border: `1px solid ${colors.primary[200]}`,
          borderRadius: spacing.radius.container,
          padding: spacing.xl,
          color: colors.primary[800],
          fontSize: typography.fontSize.sm,
          lineHeight: typography.lineHeight.relaxed,
        }}
      >
        Team input is shared through{" "}
        <code>website/src/data/multizoneRoutingReview.json</code>. Edit that
        file in this PR branch to update the Team input and Team comment
        columns; the preview will reflect committed changes after redeploy.
      </div>

      <div
        className="tw:flex tw:flex-col tw:lg:flex-row tw:gap-md"
        style={{ alignItems: "stretch" }}
      >
        <label
          className="tw:flex tw:items-center tw:gap-sm tw:flex-1"
          style={{
            backgroundColor: colors.white,
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.radius.element,
            paddingLeft: spacing.md,
          }}
        >
          <IconSearch size={18} color={colors.text.tertiary} />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, slug, setup, framework, source, comments..."
            style={{
              border: "none",
              boxShadow: "none",
            }}
          />
        </label>

        <select
          value={country}
          onChange={(event) => setCountry(event.target.value)}
        >
          <option value="all">All countries</option>
          <option value="us">US</option>
          <option value="uk">UK</option>
          <option value="global">Global</option>
        </select>

        <select
          value={kind}
          onChange={(event) =>
            setKind(event.target.value as RecommendationKind | "all")
          }
        >
          <option value="all">All recommendations</option>
          <option value="iframe">Keep iframe/static</option>
          <option value="rewrite">Simple rewrite</option>
          <option value="multizone">Multi-zone</option>
        </select>

        <select
          value={origin}
          onChange={(event) => setOrigin(event.target.value)}
        >
          <option value="all">All sources</option>
          <option value="apps.json">apps.json</option>
          <option value="route">Other route/rewrite</option>
        </select>
      </div>

      <div
        style={{
          overflow: "auto",
          backgroundColor: colors.white,
          border: `1px solid ${colors.border.light}`,
          borderRadius: spacing.radius.container,
        }}
      >
        <table
          style={{
            width: "100%",
            minWidth: "1650px",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              {[
                "App title",
                "Country",
                "Current setup",
                "Suggested setup",
                "Team input",
                "Team comment",
                "Framework",
                "Deployed",
                "Source",
                "Notes",
              ].map((heading) => (
                <th
                  key={heading}
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    backgroundColor: colors.gray[50],
                    borderBottom: `1px solid ${colors.border.light}`,
                    padding: `${spacing.sm} ${spacing.md}`,
                    textAlign: "left",
                    color: colors.gray[700],
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.bold,
                    textTransform: "uppercase",
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td style={cellStyle}>
                  <strong>{row.title}</strong>
                  <div style={subtleMonoStyle}>{row.path}</div>
                  <div style={subtleMonoStyle}>{row.id}</div>
                </td>
                <td style={cellStyle}>
                  <span style={badgeStyle("iframe")}>
                    {row.country.toUpperCase()}
                  </span>
                </td>
                <td style={cellStyle}>{row.currentSetup}</td>
                <td style={cellStyle}>
                  <span style={badgeStyle(row.recommendationKind)}>
                    {row.recommendedSetup}
                  </span>
                </td>
                <td style={cellStyle}>
                  <span style={badgeStyle(row.teamRecommendation)}>
                    {RECOMMENDATION_LABELS[row.teamRecommendation]}
                  </span>
                </td>
                <td style={cellStyle}>
                  {row.teamComment || (
                    <span style={{ color: colors.text.tertiary }}>
                      No shared comment yet
                    </span>
                  )}
                </td>
                <td style={cellStyle}>{row.framework}</td>
                <td style={cellStyle}>{row.deployed}</td>
                <td style={{ ...cellStyle, ...subtleMonoStyle }}>
                  {row.source.startsWith("http") ? (
                    <a href={row.source}>{row.source}</a>
                  ) : (
                    row.source
                  )}
                </td>
                <td style={{ ...cellStyle, color: colors.text.secondary }}>
                  {row.notes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cellStyle: CSSProperties = {
  borderBottom: `1px solid ${colors.border.light}`,
  padding: `${spacing.md} ${spacing.md}`,
  verticalAlign: "top",
  fontSize: typography.fontSize.sm,
  lineHeight: typography.lineHeight.normal,
};

const subtleMonoStyle: CSSProperties = {
  marginTop: spacing.xs,
  color: colors.text.secondary,
  fontFamily:
    "SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace",
  fontSize: typography.fontSize.xs,
  wordBreak: "break-word",
};
