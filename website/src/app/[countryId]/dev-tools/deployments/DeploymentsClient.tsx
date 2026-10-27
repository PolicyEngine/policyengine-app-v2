"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  ShadcnTable,
  Spinner,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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

const detailStyle = {
  marginTop: spacing.xs,
  fontSize: typography.fontSize.xs,
  color: colors.text.secondary,
  lineHeight: typography.lineHeight.relaxed,
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

function ServiceCell({ row }: { row: DeploymentRow }) {
  const { surface } = row;
  return (
    <>
      <div style={{ fontWeight: typography.fontWeight.semibold }}>
        {surface.label}
      </div>
      <div style={detailStyle}>{surface.serves}</div>
      <div style={detailStyle}>
        <ExternalLink href={`https://github.com/${surface.repository}`}>
          {surface.repository.replace("PolicyEngine/", "")}
        </ExternalLink>
        {row.lock_url && (
          <>
            {" · "}
            <ExternalLink href={row.lock_url}>lock</ExternalLink>
          </>
        )}
      </div>
    </>
  );
}

function ServedCell({
  row,
  country,
}: {
  row: DeploymentRow;
  country: DeploymentCountry;
}) {
  const { served } = row;
  return (
    <>
      <Pill {...SERVED[served.status]} />
      {served.py_version && (
        <dl
          className="tw:grid tw:grid-cols-[auto_1fr] tw:gap-x-2"
          style={{ marginTop: spacing.xs, fontSize: typography.fontSize.xs }}
        >
          <dt style={{ color: colors.text.secondary }}>.py</dt>
          <dd>
            <Version value={served.py_version} />
          </dd>
          <dt style={{ color: colors.text.secondary }}>Model</dt>
          <dd>
            <Version value={served.model_version} />
          </dd>
          {served.data_build_id && (
            <>
              <dt style={{ color: colors.text.secondary }}>Data</dt>
              <dd>
                <BuildId buildId={served.data_build_id} country={country} />
                {served.data_basis === "served_py_bundle" && (
                  <span style={{ color: colors.text.secondary }}>
                    {" "}
                    (via served .py)
                  </span>
                )}
              </dd>
            </>
          )}
        </dl>
      )}
      <div style={detailStyle}>
        {served.detail}
        {served.source_url && (
          <>
            {" "}
            <ExternalLink href={served.source_url}>Source</ExternalLink>
          </>
        )}
      </div>
    </>
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

const sectionStyle = {
  flex: 1,
  backgroundColor: colors.background.tertiary,
  paddingTop: spacing["4xl"],
  paddingBottom: spacing["4xl"],
  paddingLeft: "6.125%",
  paddingRight: "6.125%",
};

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
        className="tw:flex tw:flex-wrap tw:items-center tw:gap-4"
        style={{
          padding: spacing.xl,
          marginBottom: spacing["2xl"],
          backgroundColor: colors.white,
          border: `1px solid ${colors.border.light}`,
          borderRadius: spacing.radius.container,
        }}
      >
        <div style={{ flex: "1 1 280px" }}>
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
            <Text style={detailStyle}>
              .py <PyVersion value={data.latest.py_version} /> certifies{" "}
              {modelLabel}{" "}
              <Version value={data.latest.certified_model_version} /> with data
              build{" "}
              <BuildId buildId={data.latest.data_build_id} country={country} />.
            </Text>
          ) : (
            <Text style={detailStyle}>
              Unknown:{" "}
              {data.latest_error ?? "the latest .py bundle could not be read."}
            </Text>
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

      <div
        className="tw:overflow-x-auto"
        style={{
          backgroundColor: colors.white,
          border: `1px solid ${colors.border.light}`,
          borderRadius: spacing.radius.container,
        }}
      >
        <ShadcnTable className="tw:min-w-[1100px]">
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Declared status</TableHead>
              <TableHead>Served</TableHead>
              <TableHead>Declared .py</TableHead>
              <TableHead>{modelLabel}</TableHead>
              <TableHead>Core</TableHead>
              <TableHead>Declared data build</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.map((row) => (
              <TableRow key={row.surface.id} className="tw:align-top">
                <TableCell className="tw:whitespace-normal tw:align-top tw:min-w-[200px]">
                  <ServiceCell row={row} />
                </TableCell>
                <TableCell className="tw:whitespace-normal tw:align-top tw:max-w-[260px]">
                  <Pill {...DECLARED[row.status]} />
                  <div style={detailStyle}>{row.detail}</div>
                </TableCell>
                <TableCell className="tw:whitespace-normal tw:align-top tw:max-w-[300px]">
                  <ServedCell row={row} country={country} />
                </TableCell>
                <TableCell className="tw:align-top">
                  <PyVersion value={row.py_version} />
                </TableCell>
                <TableCell className="tw:align-top">
                  <Version value={row.model_version} />
                </TableCell>
                <TableCell className="tw:align-top">
                  <Version value={row.core_version} />
                </TableCell>
                <TableCell className="tw:whitespace-normal tw:align-top tw:min-w-[240px]">
                  <BuildId buildId={row.data_build_id} country={country} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </ShadcnTable>
      </div>

      <Text
        style={{
          ...detailStyle,
          marginTop: spacing.lg,
        }}
      >
        Declared: the lock file on each repository&apos;s default branch, and
        the data build that its .py certifies. Served: what the running service
        reports. Checked {new Date(data.checked_at).toLocaleString("en-US")};
        cached for 15 minutes.
      </Text>
    </div>
  );
}
