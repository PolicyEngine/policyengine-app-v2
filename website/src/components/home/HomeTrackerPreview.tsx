"use client";

import Link from "next/link";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";

export default function HomeTrackerPreview({
  countryId,
}: {
  countryId: string;
}) {
  if (countryId !== "us") return null;

  return (
    <div
      style={{
        backgroundColor: colors.primary[50],
        paddingTop: spacing["5xl"],
        paddingBottom: spacing["5xl"],
      }}
    >
      <div
        style={{
          maxWidth: spacing.layout.content,
          margin: "0 auto",
          padding: `0 ${spacing.xl}`,
        }}
      >
        {/* Section header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: spacing["3xl"],
          }}
        >
          <p
            style={{
              fontWeight: typography.fontWeight.bold,
              fontSize: typography.fontSize["3xl"],
              color: colors.primary[800],
              fontFamily: typography.fontFamily.primary,
              lineHeight: typography.lineHeight.tight,
              margin: 0,
            }}
          >
            Track legislative activity
          </p>
          <Link
            href={`/${countryId}/research`}
            style={{
              textDecoration: "none",
              color: colors.primary[600],
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            View all research &rarr;
          </Link>
        </div>

        {/* Tracker card */}
        <Link
          href={`/${countryId}/state-legislative-tracker`}
          style={{ textDecoration: "none", color: "inherit", display: "block" }}
        >
          <div
            style={{
              borderRadius: spacing.radius.feature,
              overflow: "hidden",
              backgroundColor: colors.white,
              border: `1px solid ${colors.border.light}`,
              transition: "box-shadow 0.25s ease, transform 0.25s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 8px 30px ${colors.shadow.medium}`;
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              {/* Left: Image */}
              <div
                style={{
                  minHeight: "280px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/posts/state-legislative-tracker.webp"
                  alt="2026 State legislative tracker showing US map with state session statuses"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                />
              </div>

              {/* Right: Content */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  padding: spacing["3xl"],
                }}
              >
                <p
                  style={{
                    color: colors.primary[600],
                    fontWeight: typography.fontWeight.semibold,
                    fontSize: typography.fontSize.xs,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontFamily: typography.fontFamily.primary,
                    marginBottom: spacing.sm,
                  }}
                >
                  Interactive tool
                </p>
                <p
                  style={{
                    fontWeight: typography.fontWeight.bold,
                    fontSize: typography.fontSize["2xl"],
                    lineHeight: typography.lineHeight.tight,
                    fontFamily: typography.fontFamily.primary,
                    color: colors.gray[900],
                    marginBottom: spacing.md,
                  }}
                >
                  2026 State legislative tracker
                </p>
                <p
                  style={{
                    fontSize: typography.fontSize.base,
                    color: colors.text.secondary,
                    lineHeight: typography.lineHeight.relaxed,
                    fontFamily: typography.fontFamily.primary,
                    marginBottom: spacing.lg,
                  }}
                >
                  Monitor tax and benefit legislation across all 50 US states.
                  See which states are in session, track active bills, and
                  explore PolicyEngine&apos;s research on state-level policy
                  reforms.
                </p>
                <p
                  style={{
                    fontWeight: typography.fontWeight.semibold,
                    fontSize: typography.fontSize.sm,
                    color: colors.primary[600],
                    fontFamily: typography.fontFamily.primary,
                  }}
                >
                  Explore the tracker &rarr;
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
