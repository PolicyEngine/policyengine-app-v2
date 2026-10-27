"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle, Spinner } from "@/components/ui";
import { colors, spacing, typography } from "@/designTokens";
import {
  DEPLOYMENT_COUNTRIES,
  PY_BUNDLE_MANIFEST_PATH,
  PY_REPOSITORY,
  isDeploymentCountry,
  isMicrocosmBuild,
  microcosmBuildUrl,
  shortBuildId,
  type DeploymentCountry,
  type DeploymentRow,
  type DeploymentStatus,
  type DeploymentsResponse,
  type ServedStatus,
} from "@/lib/deployments";

type Tone = "success" | "warning" | "danger" | "neutral";

const TONES: Record<Tone, { bg: string; text: string }> = {
  success: { bg: colors.primary[50], text: colors.primary[700] },
  warning: { bg: "#FEF9E7", text: "#92400E" },
  danger: { bg: "#FEF2F2", text: "#991B1B" },
  neutral: { bg: colors.gray[100], text: colors.gray[700] },
};

const DECLARED: Record<DeploymentStatus, { label: string; tone: Tone }> = {
  current: { label: "Latest data", tone: "success" },
  behind: { label: "Older data", tone: "warning" },
  model_mismatch: { label: "Model mismatch", tone: "danger" },
  no_bundle: { label: "No certified data", tone: "danger" },
  no_py: { label: "No .py", tone: "warning" },
  not_in_bundle: { label: "Country not in bundle", tone: "neutral" },
  no_dataset: { label: "No dataset", tone: "neutral" },
  unavailable: { label: "Lock unavailable", tone: "neutral" },
};

const SERVED: Record<ServedStatus, { label: string; tone: Tone }> = {
  matches: { label: "Same as main", tone: "success" },
  differs: { label: "Differs from main", tone: "danger" },
  no_worker: { label: "No worker", tone: "danger" },
  unavailable: { label: "Report unavailable", tone: "warning" },
  not_reported: { label: "Not reported", tone: "neutral" },
};

const COUNTRY_LABELS: Record<DeploymentCountry, string> = {
  us: "United States",
  uk: "United Kingdom",
};

const mono = {
  fontFamily: typography.fontFamily.mono,
  fontSize: typography.fontSize.xs,
};

const mutedText = {
  fontSize: typography.fontSize.sm,
  color: colors.text.secondary,
  lineHeight: typography.lineHeight.relaxed,
};

const cardStyle = {
  backgroundColor: colors.white,
  border: `1px solid ${colors.border.light}`,
  borderRadius: spacing.radius.container,
};

const sectionStyle = {
  flex: 1,
  backgroundColor: colors.background.tertiary,
  paddingTop: spacing["4xl"],
  paddingBottom: spacing["4xl"],
  paddingLeft: "6.125%",
  paddingRight: "6.125%",
};

function Pill({
  label,
  tone,
  title,
}: {
  label: string;
  tone: Tone;
  title?: string;
}) {
  return (
    <span
      className="tw:inline-flex tw:items-center tw:rounded-full tw:px-2 tw:py-0.5 tw:text-xs tw:font-medium tw:whitespace-nowrap"
      style={{
        backgroundColor: TONES[tone].bg,
        color: TONES[tone].text,
        cursor: title ? "help" : undefined,
      }}
      title={title}
    >
      {label}
    </span>
  );
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="tw:underline tw:decoration-dotted tw:underline-offset-2"
    >
      {children}
    </a>
  );
}

function bundleUrl(pyVersion: string): string {
  return `https://github.com/${PY_REPOSITORY}/blob/${pyVersion}/${PY_BUNDLE_MANIFEST_PATH}`;
}

function Version({ value }: { value: string | null }) {
  return value ? (
    <span style={mono}>{value}</span>
  ) : (
    <span style={{ color: colors.text.tertiary }}>—</span>
  );
}

function PyVersion({ value }: { value: string | null }) {
  return value ? (
    <ExternalLink href={bundleUrl(value)}>
      <span style={mono}>{value}</span>
    </ExternalLink>
  ) : (
    <Version value={null} />
  );
}

function BuildId({
  buildId,
  country,
}: {
  buildId: string | null;
  country: DeploymentCountry;
}) {
  if (!buildId) return <Version value={null} />;
  // The same short form as the overview table, so the two compare directly.
  const text = (
    <span style={mono} title={buildId}>
      {shortBuildId(buildId)}
    </span>
  );
  return isMicrocosmBuild(buildId) ? (
    <ExternalLink href={microcosmBuildUrl(country, buildId)}>
      {text}
    </ExternalLink>
  ) : (
    text
  );
}

const labelStyle = {
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.semibold,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  color: colors.text.secondary,
};

interface DriftLine {
  label: string;
  value: string;
  // True for a value that differs from the lock on main.
  drift: boolean;
}

// One overview value: the declared value, or labeled lines ("main" and
// "live", or a service's own channel names) when the running service reports
// something else.
function DriftValue({
  declared,
  served,
  servedKnown,
  lines,
  short = (value: string) => value,
}: {
  declared: string | null;
  served: string | null;
  servedKnown: boolean;
  lines?: DriftLine[];
  short?: (value: string) => string;
}) {
  const show = (value: string | null) =>
    value ? (
      // A short value may wrap between its " · " parts, never inside one.
      <span style={mono} title={value}>
        {short(value)
          .split(" · ")
          .map((part, index) => (
            <span key={index}>
              {index > 0 && " · "}
              <span style={{ whiteSpace: "nowrap" }}>{part}</span>
            </span>
          ))}
      </span>
    ) : (
      <span style={{ color: colors.text.tertiary }}>—</span>
    );
  const drifted = servedKnown && served && declared && served !== declared;
  const shown: DriftLine[] | null = lines?.length
    ? lines
    : drifted
      ? [
          { label: "main", value: declared, drift: false },
          { label: "live", value: served, drift: true },
        ]
      : null;
  if (shown) {
    return (
      <dl className="tw:grid tw:grid-cols-[max-content_auto] tw:gap-x-2 tw:gap-y-0.5">
        {shown.map((line) => (
          <div key={line.label} className="tw:contents">
            <dt
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.secondary,
              }}
            >
              {line.label}
            </dt>
            <dd
              style={{
                color: line.drift ? TONES.danger.text : colors.text.primary,
              }}
            >
              {show(line.value)}
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  return show(servedKnown ? (served ?? declared) : declared);
}

// A service with named channels (the household API's current and frontier)
// shows each channel's model version when any of them differs from main.
function channelLines(row: DeploymentRow): DriftLine[] | undefined {
  const { channels } = row.served;
  if (
    channels.length === 0 ||
    channels.every((channel) => channel.model_version === row.model_version)
  ) {
    return undefined;
  }
  return channels.map((channel) => ({
    label: channel.name,
    value: channel.model_version,
    drift: channel.model_version !== row.model_version,
  }));
}

function Overview({
  rows,
  modelLabel,
}: {
  rows: DeploymentRow[];
  modelLabel: string;
}) {
  const head = "tw:px-3 tw:py-2.5 tw:text-left tw:font-medium";
  const cell = "tw:px-3 tw:py-3 tw:align-top";
  return (
    <div
      className="tw:overflow-x-auto"
      style={{ ...cardStyle, marginBottom: spacing["2xl"] }}
    >
      <table
        className="tw:w-full tw:min-w-[720px]"
        style={{ fontSize: typography.fontSize.sm }}
      >
        <thead>
          <tr
            style={{
              color: colors.text.secondary,
              fontSize: typography.fontSize.xs,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              borderBottom: `1px solid ${colors.border.light}`,
            }}
          >
            <th className={`${head} tw:w-[12rem]`}>Service</th>
            <th className={head}>Live vs main</th>
            <th className={head}>Vs latest .py</th>
            <th className={head}>.py</th>
            <th className={head}>{modelLabel}</th>
            <th className={`${head} tw:min-w-[12rem]`}>Data build</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const servedKnown =
              row.served.status === "matches" ||
              row.served.status === "differs" ||
              row.served.status === "no_worker";
            const noWorker = row.served.status === "no_worker";
            return (
              <tr
                key={row.surface.id}
                style={{ borderBottom: `1px solid ${colors.border.light}` }}
              >
                <td className={cell}>
                  <div
                    style={{
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
                    }}
                  >
                    {row.surface.label}
                  </div>
                  <div
                    style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary,
                    }}
                  >
                    {row.surface.serves}
                    <br />
                    <ExternalLink
                      href={`https://github.com/${row.surface.repository}`}
                    >
                      {row.surface.repository.replace("PolicyEngine/", "")}
                    </ExternalLink>
                    {row.lock_url && (
                      <>
                        {" · "}
                        <ExternalLink href={row.lock_url}>lock</ExternalLink>
                      </>
                    )}
                    {row.served.source_url && (
                      <>
                        {" · "}
                        <ExternalLink href={row.served.source_url}>
                          report
                        </ExternalLink>
                      </>
                    )}
                  </div>
                </td>
                <td className={cell}>
                  <Pill
                    {...SERVED[row.served.status]}
                    title={row.served.detail}
                  />
                </td>
                <td className={cell}>
                  <Pill {...DECLARED[row.status]} title={row.detail} />
                </td>
                <td className={cell}>
                  <DriftValue
                    declared={row.py_version}
                    served={row.served.py_version}
                    servedKnown={servedKnown}
                  />
                </td>
                <td className={cell}>
                  <DriftValue
                    declared={row.model_version}
                    served={row.served.model_version}
                    servedKnown={servedKnown}
                    lines={channelLines(row)}
                  />
                </td>
                <td className={cell}>
                  {noWorker ? (
                    <span style={{ color: TONES.danger.text }}>
                      No gateway worker for .py {row.served.py_version}
                    </span>
                  ) : (
                    <DriftValue
                      declared={row.data_build_id}
                      served={row.served.data_build_id}
                      servedKnown={servedKnown}
                      short={shortBuildId}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function useDeployments(country: DeploymentCountry | null) {
  const [data, setData] = useState<DeploymentsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(country !== null);

  useEffect(() => {
    if (!country) return;
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/deployments?country=${country}`);
        const body = (await response.json()) as
          | DeploymentsResponse
          | { error: string };
        if (!response.ok) {
          throw new Error(
            "error" in body
              ? body.error
              : `Failed to read deployments (${response.status})`,
          );
        }
        if (!cancelled) setData(body as DeploymentsResponse);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to read deployments",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [country]);

  return { data, error, loading };
}

export default function DeploymentsClient({
  countryId,
}: {
  countryId: string;
}) {
  const country = isDeploymentCountry(countryId) ? countryId : null;
  const { data, error, loading } = useDeployments(country);

  if (!country) {
    return (
      <div style={sectionStyle}>
        <Alert>
          <AlertTitle>No certified data for this country</AlertTitle>
          <AlertDescription>
            policyengine.py certifies data builds for{" "}
            {DEPLOYMENT_COUNTRIES.map((code, index) => (
              <span key={code}>
                {index > 0 && " and "}
                <Link href={`/${code}/dev-tools/deployments`}>
                  {COUNTRY_LABELS[code]}
                </Link>
              </span>
            ))}{" "}
            only.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="tw:flex tw:items-center tw:justify-center"
        style={{ ...sectionStyle, minHeight: "320px" }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={sectionStyle}>
        <Alert variant="destructive">
          <AlertTitle>Unable to read deployments</AlertTitle>
          <AlertDescription>{error ?? "No data returned"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const modelLabel = data.model_package ?? "Country model";

  return (
    <div style={sectionStyle}>
      <div
        style={{
          ...cardStyle,
          padding: spacing.xl,
          marginBottom: spacing["2xl"],
        }}
      >
        <div
          style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          Latest versions: {COUNTRY_LABELS[country]}
        </div>
        <div className="tw:overflow-x-auto" style={{ marginTop: spacing.md }}>
          <table
            className="tw:w-full tw:min-w-[560px]"
            style={{ fontSize: typography.fontSize.sm }}
          >
            <thead>
              <tr style={labelStyle}>
                <th className="tw:py-1 tw:pr-6 tw:text-left tw:font-semibold" />
                <th className="tw:py-1 tw:pr-6 tw:text-left tw:font-semibold">
                  .py
                </th>
                <th className="tw:py-1 tw:pr-6 tw:text-left tw:font-semibold">
                  {modelLabel}
                </th>
                <th className="tw:py-1 tw:pr-6 tw:text-left tw:font-semibold">
                  Core
                </th>
                <th className="tw:py-1 tw:text-left tw:font-semibold">
                  Data build
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th
                  className="tw:py-1 tw:pr-6 tw:text-left tw:font-normal"
                  style={{ color: colors.text.secondary }}
                >
                  Certified by the latest .py
                </th>
                {data.latest ? (
                  <>
                    <td className="tw:py-1 tw:pr-6">
                      <PyVersion value={data.latest.py_version} />
                    </td>
                    <td className="tw:py-1 tw:pr-6">
                      <Version value={data.latest.certified_model_version} />
                    </td>
                    <td className="tw:py-1 tw:pr-6">
                      <Version value={data.latest.core_version} />
                    </td>
                    <td className="tw:py-1">
                      <BuildId
                        buildId={data.latest.data_build_id}
                        country={country}
                      />
                    </td>
                  </>
                ) : (
                  <td colSpan={4} className="tw:py-1" style={mutedText}>
                    Unknown:{" "}
                    {data.latest_error ??
                      "the latest .py bundle could not be read."}
                  </td>
                )}
              </tr>
              <tr>
                <th
                  className="tw:py-1 tw:pr-6 tw:text-left tw:font-normal"
                  style={{ color: colors.text.secondary }}
                >
                  Newest release
                </th>
                <td className="tw:py-1 tw:pr-6">
                  <PyVersion value={data.newest.py_version} />
                </td>
                <td className="tw:py-1 tw:pr-6">
                  <Version value={data.newest.model_version} />
                </td>
                <td className="tw:py-1 tw:pr-6">
                  <Version value={data.newest.core_version} />
                </td>
                <td className="tw:py-1">
                  <BuildId
                    buildId={data.newest.data_build_id}
                    country={country}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <Overview rows={data.rows} modelLabel={modelLabel} />
    </div>
  );
}
