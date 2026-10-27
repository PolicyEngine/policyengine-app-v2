"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Spinner,
  Text,
} from "@/components/ui";
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
  matches: { label: "Deployed", tone: "success" },
  differs: { label: "Not deployed", tone: "danger" },
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

function Pill({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className="tw:inline-flex tw:items-center tw:rounded-full tw:px-2 tw:py-0.5 tw:text-xs tw:font-medium tw:whitespace-nowrap"
      style={{ backgroundColor: TONES[tone].bg, color: TONES[tone].text }}
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
  const text = (
    <span style={{ ...mono, wordBreak: "break-all" }}>{buildId}</span>
  );
  return isMicrocosmBuild(buildId) ? (
    <ExternalLink href={microcosmBuildUrl(country, buildId)}>
      {text}
    </ExternalLink>
  ) : (
    text
  );
}

// Label/value rows; a null value shows a dash.
function Facts({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl
      className="tw:grid tw:grid-cols-[max-content_minmax(0,1fr)] tw:gap-x-3 tw:gap-y-1"
      style={{ marginTop: spacing.sm, fontSize: typography.fontSize.sm }}
    >
      {items.map(([label, value]) => (
        <div key={label} className="tw:contents">
          <dt style={{ color: colors.text.secondary }}>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Side({
  title,
  pill,
  facts,
  detail,
}: {
  title: string;
  pill: { label: string; tone: Tone };
  facts: [string, React.ReactNode][] | null;
  detail: React.ReactNode;
}) {
  return (
    <div className="tw:min-w-0">
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
        <span
          style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: colors.text.secondary,
          }}
        >
          {title}
        </span>
        <Pill {...pill} />
      </div>
      {facts && <Facts items={facts} />}
      <div style={{ ...mutedText, marginTop: spacing.sm }}>{detail}</div>
    </div>
  );
}

function ServiceCard({
  row,
  country,
  modelLabel,
}: {
  row: DeploymentRow;
  country: DeploymentCountry;
  modelLabel: string;
}) {
  const { surface, served } = row;
  return (
    <section
      id={`service-${surface.id}`}
      style={{
        ...cardStyle,
        padding: spacing.xl,
        scrollMarginTop: spacing["4xl"],
      }}
    >
      <div className="tw:flex tw:flex-wrap tw:items-baseline tw:justify-between tw:gap-x-4 tw:gap-y-1">
        <Text
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
          }}
        >
          {surface.label}
        </Text>
        <span style={mutedText}>
          {surface.serves} ·{" "}
          <ExternalLink href={`https://github.com/${surface.repository}`}>
            {surface.repository.replace("PolicyEngine/", "")}
          </ExternalLink>
          {row.lock_url && (
            <>
              {" · "}
              <ExternalLink href={row.lock_url}>lock</ExternalLink>
            </>
          )}
        </span>
      </div>

      <div
        className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-6"
        style={{ marginTop: spacing.lg }}
      >
        <Side
          title="Declared"
          pill={DECLARED[row.status]}
          facts={[
            [".py", <PyVersion key="py" value={row.py_version} />],
            [modelLabel, <Version key="model" value={row.model_version} />],
            ["Core", <Version key="core" value={row.core_version} />],
            [
              "Data build",
              <BuildId
                key="data"
                buildId={row.data_build_id}
                country={country}
              />,
            ],
          ]}
          detail={row.detail}
        />
        <Side
          title="Served"
          pill={SERVED[served.status]}
          facts={
            served.py_version
              ? [
                  [".py", <Version key="py" value={served.py_version} />],
                  [
                    modelLabel,
                    <Version key="model" value={served.model_version} />,
                  ],
                  [
                    "Data build",
                    <span key="data">
                      <BuildId
                        buildId={served.data_build_id}
                        country={country}
                      />
                      {served.data_basis === "served_py_bundle" && (
                        <span style={{ color: colors.text.secondary }}>
                          {" "}
                          (via served .py)
                        </span>
                      )}
                    </span>,
                  ],
                ]
              : null
          }
          detail={
            <>
              {served.detail}
              {served.source_url && (
                <>
                  {" "}
                  <ExternalLink href={served.source_url}>Source</ExternalLink>
                </>
              )}
            </>
          }
        />
      </div>
    </section>
  );
}

const DRIFT_BG = TONES.danger.bg;

// One overview value: the declared value, or "lock → serving" when the
// running service reports something else.
function DriftValue({
  declared,
  served,
  servedKnown,
  short = (value: string) => value,
}: {
  declared: string | null;
  served: string | null;
  servedKnown: boolean;
  short?: (value: string) => string;
}) {
  const show = (value: string | null) =>
    value ? (
      <span style={{ ...mono, whiteSpace: "nowrap" }} title={value}>
        {short(value)}
      </span>
    ) : (
      <span style={{ color: colors.text.tertiary }}>—</span>
    );
  if (servedKnown && served && declared && served !== declared) {
    return (
      <span style={{ color: TONES.danger.text }}>
        <span className="tw:block tw:whitespace-nowrap">
          lock {show(declared)}
        </span>
        <span className="tw:block tw:whitespace-nowrap">
          serving {show(served)}
        </span>
      </span>
    );
  }
  return show(servedKnown ? (served ?? declared) : declared);
}

function differs(
  row: DeploymentRow,
  declared: string | null,
  served: string | null,
): boolean {
  return (
    row.served.status !== "not_reported" &&
    row.served.status !== "unavailable" &&
    Boolean(declared && served && declared !== served)
  );
}

function Overview({
  rows,
  modelLabel,
}: {
  rows: DeploymentRow[];
  modelLabel: string;
}) {
  const head = "tw:px-4 tw:py-2.5 tw:text-left tw:font-medium";
  const cell = "tw:px-4 tw:py-3 tw:align-top";
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
            <th className={head}>Service</th>
            <th className={head}>Deployment</th>
            <th className={head}>Vs latest .py</th>
            <th className={head}>.py</th>
            <th className={head}>{modelLabel}</th>
            <th className={head}>Data build</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const servedKnown =
              row.served.status === "matches" ||
              row.served.status === "differs";
            const cellStyle = (drift: boolean) =>
              drift ? { backgroundColor: DRIFT_BG } : undefined;
            return (
              <tr
                key={row.surface.id}
                style={{ borderBottom: `1px solid ${colors.border.light}` }}
              >
                <td className={cell}>
                  <a
                    href={`#service-${row.surface.id}`}
                    style={{
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
                    }}
                  >
                    {row.surface.label}
                  </a>
                  <div
                    style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary,
                    }}
                  >
                    {row.surface.serves}
                  </div>
                </td>
                <td className={cell}>
                  <Pill {...SERVED[row.served.status]} />
                </td>
                <td className={cell}>
                  <Pill {...DECLARED[row.status]} />
                </td>
                <td
                  className={cell}
                  style={cellStyle(
                    differs(row, row.py_version, row.served.py_version),
                  )}
                >
                  <DriftValue
                    declared={row.py_version}
                    served={row.served.py_version}
                    servedKnown={servedKnown}
                  />
                </td>
                <td
                  className={cell}
                  style={cellStyle(
                    differs(row, row.model_version, row.served.model_version),
                  )}
                >
                  <DriftValue
                    declared={row.model_version}
                    served={row.served.model_version}
                    servedKnown={servedKnown}
                  />
                </td>
                <td
                  className={cell}
                  style={cellStyle(
                    differs(row, row.data_build_id, row.served.data_build_id),
                  )}
                >
                  <DriftValue
                    declared={row.data_build_id}
                    served={row.served.data_build_id}
                    servedKnown={servedKnown}
                    short={shortBuildId}
                  />
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

  const notDeployed = data.rows.filter(
    (row) => row.served.status === "differs",
  ).length;
  const modelLabel = data.model_package ?? "Country model";

  return (
    <div style={sectionStyle}>
      <div
        className="tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-4"
        style={{
          ...cardStyle,
          padding: spacing.xl,
          marginBottom: spacing["2xl"],
        }}
      >
        <div className="tw:min-w-0" style={{ flex: "1 1 320px" }}>
          <Text
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            {COUNTRY_LABELS[country]}: latest certified bundle
          </Text>
          {data.latest ? (
            <Facts
              items={[
                [".py", <PyVersion key="py" value={data.latest.py_version} />],
                [
                  modelLabel,
                  <Version
                    key="model"
                    value={data.latest.certified_model_version}
                  />,
                ],
                [
                  "Data build",
                  <BuildId
                    key="data"
                    buildId={data.latest.data_build_id}
                    country={country}
                  />,
                ],
              ]}
            />
          ) : (
            <div style={{ ...mutedText, marginTop: spacing.sm }}>
              Unknown:{" "}
              {data.latest_error ?? "the latest .py bundle could not be read."}
            </div>
          )}
        </div>
        {notDeployed > 0 ? (
          <Pill
            label={`${notDeployed} ${notDeployed === 1 ? "service" : "services"} not deployed`}
            tone="danger"
          />
        ) : (
          <Pill label="Every reporting service is deployed" tone="success" />
        )}
      </div>

      <Overview rows={data.rows} modelLabel={modelLabel} />

      <Text
        style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary,
          marginBottom: spacing.md,
        }}
      >
        Details
      </Text>
      <div className="tw:flex tw:flex-col tw:gap-4">
        {data.rows.map((row) => (
          <ServiceCard
            key={row.surface.id}
            row={row}
            country={country}
            modelLabel={modelLabel}
          />
        ))}
      </div>

      <div style={{ ...mutedText, marginTop: spacing.lg }}>
        Declared: the lock file on each repository&apos;s default branch, and
        the data build that its .py certifies. Served: what the running service
        reports. Checked {new Date(data.checked_at).toLocaleString("en-US")};
        cached for 15 minutes.
      </div>
    </div>
  );
}
