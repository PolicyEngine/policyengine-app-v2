import type { Metadata } from "next";
import Link from "next/link";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";

type ReleasePageProps = {
  params: Promise<{ version: string }>;
};

function normalizeVersion(version: string): string {
  return version.replace(/^v/i, "");
}

function releaseLinks(version: string) {
  const tag = normalizeVersion(version);
  const encodedTag = encodeURIComponent(tag);
  const rawBase = `https://raw.githubusercontent.com/PolicyEngine/policyengine.py/${encodedTag}/src/policyengine/data/release_manifests`;

  return {
    githubRelease: `https://github.com/PolicyEngine/policyengine.py/releases/tag/${encodedTag}`,
    pypiRelease: `https://pypi.org/project/policyengine/${encodedTag}/`,
    sourceTree: `https://github.com/PolicyEngine/policyengine.py/tree/${encodedTag}`,
    usManifest: `${rawBase}/us.json`,
    ukManifest: `${rawBase}/uk.json`,
  };
}

export async function generateMetadata({
  params,
}: ReleasePageProps): Promise<Metadata> {
  const { version } = await params;
  const normalizedVersion = normalizeVersion(version);

  return {
    title: `PolicyEngine v${normalizedVersion}`,
    description: `Release details and reproducibility links for PolicyEngine v${normalizedVersion}.`,
  };
}

function ExternalLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "grid",
        gap: spacing.xs,
        padding: spacing.lg,
        borderTop: `1px solid ${colors.border.light}`,
        color: "inherit",
        textDecoration: "none",
      }}
    >
      <span
        style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: colors.primary[700],
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: typography.fontSize.sm,
          lineHeight: typography.lineHeight.relaxed,
          color: colors.text.secondary,
        }}
      >
        {description}
      </span>
    </a>
  );
}

export default async function ReleasePage({ params }: ReleasePageProps) {
  const { version } = await params;
  const normalizedVersion = normalizeVersion(version);
  const links = releaseLinks(normalizedVersion);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: colors.gray[50],
        color: colors.text.primary,
        fontFamily: typography.fontFamily.primary,
      }}
    >
      <header
        style={{
          padding: `${spacing.lg} 6.125%`,
          background: `linear-gradient(to right, ${colors.primary[800]}, ${colors.primary[600]})`,
        }}
      >
        <Link
          href="/us"
          style={{
            color: colors.white,
            fontWeight: typography.fontWeight.semibold,
            textDecoration: "none",
            letterSpacing: "0.01em",
          }}
        >
          PolicyEngine
        </Link>
      </header>

      <section
        style={{
          padding: `${spacing["4xl"]} 6.125%`,
          borderBottom: `1px solid ${colors.border.light}`,
          backgroundColor: colors.white,
        }}
      >
        <p
          style={{
            margin: 0,
            marginBottom: spacing.sm,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.primary[600],
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Release
        </p>
        <h1
          style={{
            margin: 0,
            maxWidth: 920,
            fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.06em",
            color: colors.primary[800],
          }}
        >
          PolicyEngine v{normalizedVersion}
        </h1>
        <p
          style={{
            maxWidth: 760,
            margin: 0,
            marginTop: spacing.xl,
            fontSize: typography.fontSize.xl,
            lineHeight: typography.lineHeight.relaxed,
            color: colors.text.secondary,
          }}
        >
          This is the public reproducibility boundary for PolicyEngine results.
          A single PolicyEngine version certifies the runtime model, data
          package, dataset artifact, and compatibility record used by tools and
          APIs.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 0.9fr) minmax(320px, 1.1fr)",
          gap: spacing["3xl"],
          padding: `${spacing["4xl"]} 6.125%`,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: typography.fontSize["2xl"],
              lineHeight: typography.lineHeight.tight,
              color: colors.text.primary,
            }}
          >
            What to cite
          </h2>
          <p
            style={{
              marginTop: spacing.md,
              fontSize: typography.fontSize.base,
              lineHeight: typography.lineHeight.relaxed,
              color: colors.text.secondary,
            }}
          >
            Cite results from this stack as{" "}
            <strong>PolicyEngine v{normalizedVersion}</strong>. The linked
            manifests expose the lower-level package and artifact versions for
            audit, debugging, and exact reconstruction.
          </p>
        </div>

        <div
          style={{
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.radius.container,
            backgroundColor: colors.white,
            overflow: "hidden",
            boxShadow: `0 12px 30px ${colors.shadow.light}`,
          }}
        >
          <ExternalLink
            href={links.githubRelease}
            label="GitHub release"
            description="Release notes, source tag, and attached package metadata."
          />
          <ExternalLink
            href={links.pypiRelease}
            label="PyPI package"
            description="Installable Python package for this PolicyEngine version."
          />
          <ExternalLink
            href={links.usManifest}
            label="US release manifest"
            description="Certified model, data, and artifact metadata bundled in this release."
          />
          <ExternalLink
            href={links.ukManifest}
            label="UK release manifest"
            description="Certified model, data, and artifact metadata bundled in this release."
          />
          <ExternalLink
            href={links.sourceTree}
            label="Source tree"
            description="The exact repository contents for this PolicyEngine release."
          />
        </div>
      </section>
    </main>
  );
}
