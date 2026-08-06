"use client";

import { colors, spacing, typography } from "@/designTokens";
import { aiWork, type AiWorkEntry } from "./aiWork";

const CONTAINER: React.CSSProperties = {
  maxWidth: 1080,
  marginLeft: "auto",
  marginRight: "auto",
  paddingLeft: "6.125%",
  paddingRight: "6.125%",
};

function EntryCard({ entry }: { entry: AiWorkEntry }) {
  return (
    <a
      href={entry.href}
      target={entry.external ? "_blank" : undefined}
      rel={entry.external ? "noopener noreferrer" : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        border: `1px solid ${colors.border.light}`,
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: colors.white,
      }}
    >
      <div
        style={{
          aspectRatio: "1200 / 630",
          overflow: "hidden",
          borderBottom: `1px solid ${colors.border.light}`,
          backgroundColor: colors.gray[100],
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.image}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top",
            display: "block",
          }}
        />
      </div>
      <div style={{ padding: spacing.lg, flex: 1 }}>
        <div
          style={{
            fontFamily: typography.fontFamily.primary,
            fontSize: "18px",
            fontWeight: 600,
            color: colors.gray[900],
            lineHeight: 1.35,
          }}
        >
          {entry.title}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: "15px",
            color: colors.gray[600],
            lineHeight: 1.55,
          }}
        >
          {entry.hook}
        </div>
      </div>
    </a>
  );
}

function Strand({
  heading,
  entries,
}: {
  heading: string;
  entries: AiWorkEntry[];
}) {
  return (
    <section style={{ marginTop: spacing["4xl"] }}>
      <h2
        style={{
          fontFamily: typography.fontFamily.primary,
          fontSize: "26px",
          fontWeight: 700,
          color: colors.gray[900],
        }}
      >
        {heading}
      </h2>
      <div
        style={{
          marginTop: spacing.lg,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: spacing.xl,
        }}
      >
        {entries
          .slice()
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((entry) => (
            <EntryCard key={entry.href} entry={entry} />
          ))}
      </div>
    </section>
  );
}

export default function AiHubClient({ countryId }: { countryId: string }) {
  const economy = aiWork.filter((e) => e.strand === "economy");
  const methods = aiWork.filter((e) => e.strand === "methods");
  return (
    <main
      style={{
        paddingTop: spacing["4xl"],
        paddingBottom: spacing["4xl"],
        backgroundColor: colors.white,
      }}
    >
      <div style={CONTAINER}>
        <h1
          style={{
            fontFamily: typography.fontFamily.primary,
            fontSize: "42px",
            fontWeight: 700,
            color: colors.gray[900],
            letterSpacing: "-0.5px",
          }}
        >
          AI at PolicyEngine
        </h1>
        <p
          style={{
            marginTop: spacing.sm,
            fontSize: "20px",
            color: colors.gray[700],
            lineHeight: 1.5,
            maxWidth: 640,
          }}
        >
          We model what AI does to the economy, and we use AI to do the
          modeling.
        </p>
        <Strand heading="AI and the economy" entries={economy} />
        <Strand heading="AI-native modeling" entries={methods} />
        <p style={{ marginTop: spacing["4xl"], fontSize: "15.5px" }}>
          <a
            href={`/${countryId}/research`}
            style={{ color: colors.primary[600] }}
          >
            All research
          </a>
        </p>
      </div>
    </main>
  );
}
