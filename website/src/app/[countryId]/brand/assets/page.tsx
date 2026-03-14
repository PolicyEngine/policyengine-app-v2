import type { Metadata } from "next";
import Link from "next/link";
import { IconCheck, IconX } from "@tabler/icons-react";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";

export const metadata: Metadata = {
  title: "Assets",
};

function SectionTitle({ children }: { children: string }) {
  return (
    <h2
      style={{
        fontSize: typography.fontSize["2xl"],
        fontWeight: typography.fontWeight.semibold,
        fontFamily: typography.fontFamily.primary,
        color: colors.text.primary,
        marginBottom: spacing.lg,
      }}
    >
      {children}
    </h2>
  );
}

function LogoCard({
  variant,
  background,
  logoSrc,
}: {
  variant: string;
  background: string;
  logoSrc: string;
}) {
  return (
    <div
      style={{
        background: colors.white,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: spacing.xl,
          background,
          minHeight: 120,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt={`PolicyEngine logo - ${variant}`}
          style={{ height: 48 }}
        />
      </div>
      <div style={{ padding: spacing.md }}>
        <p
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: spacing.sm,
            marginTop: 0,
            textAlign: "center",
          }}
        >
          {variant}
        </p>
        <a
          href={logoSrc}
          download
          style={{
            display: "block",
            width: "100%",
            textAlign: "center",
            padding: `${spacing.sm} ${spacing.md}`,
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.radius.element,
            color: colors.text.primary,
            textDecoration: "none",
            fontSize: typography.fontSize.sm,
            background: colors.white,
          }}
        >
          Download PNG
        </a>
      </div>
    </div>
  );
}

function UsageCard({ type, items }: { type: "do" | "dont"; items: string[] }) {
  const isDo = type === "do";
  return (
    <div
      style={{
        padding: spacing.lg,
        background: isDo ? `${colors.primary[500]}08` : `${colors.error}08`,
        border: `1px solid ${isDo ? colors.primary[500] : colors.error}20`,
        borderRadius: spacing.radius.container,
        flex: 1,
      }}
    >
      <p
        style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          color: isDo ? colors.primary[500] : colors.error,
          marginBottom: spacing.md,
          marginTop: 0,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {isDo ? <IconCheck size={14} /> : <IconX size={14} />}
        {isDo ? "Do" : "Don't"}
      </p>
      <ul
        style={{
          color: colors.text.secondary,
          fontSize: typography.fontSize.sm,
          paddingLeft: 20,
          margin: 0,
        }}
      >
        {items.map((item, i) => (
          <li key={i} style={{ marginBottom: spacing.xs }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ColorSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: spacing.radius.container,
        overflow: "hidden",
        border: `1px solid ${colors.border.light}`,
      }}
    >
      <div style={{ height: 60, background: value }} />
      <div style={{ padding: spacing.sm, background: colors.white }}>
        <p
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            marginBottom: spacing.xs,
            marginTop: 0,
          }}
        >
          {name}
        </p>
        <p
          style={{
            fontFamily: typography.fontFamily.mono,
            fontSize: typography.fontSize.xs,
            color: colors.text.tertiary,
            margin: 0,
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function BrandAssetsPage() {
  return (
    <>
      {/* Hero */}
      <div
        style={{
          paddingTop: spacing["4xl"],
          paddingBottom: spacing["4xl"],
          backgroundColor: colors.primary[50],
          borderBottom: `1px solid ${colors.border.dark}`,
          paddingLeft: "6.125%",
          paddingRight: "6.125%",
        }}
      >
        <p
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: spacing.md,
            marginTop: 0,
          }}
        >
          <Link
            href="../brand"
            style={{ color: colors.primary[500], textDecoration: "none" }}
          >
            Brand
          </Link>
          {" / "}
          Assets
        </p>
        <h1
          style={{
            fontSize: typography.fontSize["4xl"],
            fontWeight: typography.fontWeight.semibold,
            fontFamily: typography.fontFamily.primary,
            color: colors.text.primary,
            marginBottom: spacing.md,
            marginTop: 0,
          }}
        >
          Assets
        </h1>
        <p
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.secondary,
            maxWidth: 600,
            margin: 0,
          }}
        >
          Logo files, usage guidelines, and brand resources for partners and
          press.
        </p>
      </div>

      {/* Content */}
      <div
        style={{
          paddingTop: spacing["4xl"],
          paddingBottom: spacing["4xl"],
          paddingLeft: "6.125%",
          paddingRight: "6.125%",
          maxWidth: 1000,
        }}
      >
        {/* Logos */}
        <div style={{ marginBottom: spacing["4xl"] }}>
          <SectionTitle>Logos</SectionTitle>
          <p
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              marginBottom: spacing.xl,
              marginTop: 0,
            }}
          >
            Download official PolicyEngine logos for use in publications,
            presentations, and partner materials.
          </p>

          <p
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: spacing.md,
              marginTop: 0,
            }}
          >
            Full logo
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: spacing.lg,
              marginBottom: spacing.xl,
            }}
          >
            <LogoCard
              variant="Teal on white"
              background={colors.white}
              logoSrc="/assets/logos/policyengine/teal.png"
            />
            <LogoCard
              variant="White on dark"
              background={colors.primary[700]}
              logoSrc="/assets/logos/policyengine/white.png"
            />
          </div>

          <p
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: spacing.md,
              marginTop: 0,
            }}
          >
            Square mark
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: spacing.lg,
            }}
          >
            <LogoCard
              variant="Teal square"
              background={colors.white}
              logoSrc="/assets/logos/policyengine/teal-square.png"
            />
            <LogoCard
              variant="Teal square (transparent)"
              background={colors.gray[100]}
              logoSrc="/assets/logos/policyengine/teal-square-transparent.png"
            />
          </div>
        </div>

        {/* Clear space */}
        <div style={{ marginBottom: spacing["4xl"] }}>
          <SectionTitle>Clear space</SectionTitle>
          <p
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              marginBottom: spacing.xl,
              marginTop: 0,
            }}
          >
            Maintain clear space around the logo equal to at least half the
            height of the logomark.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: spacing.xl,
              marginBottom: spacing.md,
              background: colors.white,
              border: `1px solid ${colors.border.light}`,
              borderRadius: spacing.radius.container,
            }}
          >
            <div
              style={{
                position: "relative",
                padding: spacing["2xl"],
                border: `2px dashed ${colors.primary[300]}`,
                borderRadius: spacing.radius.container,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/logos/policyengine/teal.png"
                alt="PolicyEngine logo"
                style={{ height: 40 }}
              />
              <span
                style={{
                  position: "absolute",
                  top: -20,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: typography.fontSize.xs,
                  fontFamily: typography.fontFamily.mono,
                  color: colors.primary[500],
                }}
              >
                0.5x
              </span>
            </div>
          </div>
          <p
            style={{
              textAlign: "center",
              fontSize: typography.fontSize.sm,
              color: colors.text.tertiary,
              margin: 0,
            }}
          >
            Minimum clear space around logo
          </p>
        </div>

        {/* Usage guidelines */}
        <div style={{ marginBottom: spacing["4xl"] }}>
          <SectionTitle>Usage guidelines</SectionTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: spacing.lg,
            }}
          >
            <UsageCard
              type="do"
              items={[
                "Use official logo files",
                "Maintain clear space",
                "Use on contrasting backgrounds",
                "Scale proportionally",
              ]}
            />
            <UsageCard
              type="dont"
              items={[
                "Stretch or distort the logo",
                "Change logo colors",
                "Add effects or shadows",
                "Place on busy backgrounds",
              ]}
            />
          </div>
        </div>

        {/* Brand colors */}
        <div>
          <SectionTitle>Brand colors</SectionTitle>
          <p
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              marginBottom: spacing.xl,
              marginTop: 0,
            }}
          >
            Primary brand colors for use alongside the PolicyEngine logo.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: spacing.md,
            }}
          >
            <ColorSwatch name="Primary teal" value={colors.primary[500]} />
            <ColorSwatch name="Primary dark" value={colors.primary[700]} />
            <ColorSwatch name="Gray" value={colors.secondary[700]} />
            <ColorSwatch name="White" value={colors.white} />
          </div>
        </div>
      </div>
    </>
  );
}
