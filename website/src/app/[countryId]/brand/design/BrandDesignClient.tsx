"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconArrowDown,
  IconArrowUp,
  IconCheck,
  IconChevronRight,
  IconDownload,
  IconInfoCircle,
  IconPlus,
  IconSearch,
  IconWorld,
  IconX,
} from "@tabler/icons-react";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";

const colorTokens = [
  { name: "primary.500", value: colors.primary[500], label: "Primary (Teal)" },
  { name: "primary.600", value: colors.primary[600], label: "Primary dark" },
  { name: "primary.400", value: colors.primary[400], label: "Primary light" },
  {
    name: "primary.100",
    value: colors.primary[100],
    label: "Primary subtle",
  },
  { name: "secondary.700", value: colors.secondary[700], label: "Gray" },
  {
    name: "secondary.500",
    value: colors.secondary[500],
    label: "Gray medium",
  },
  {
    name: "secondary.300",
    value: colors.secondary[300],
    label: "Gray light",
  },
  { name: "warning", value: colors.warning, label: "Warning" },
  { name: "error", value: colors.error, label: "Error" },
  { name: "primary.600", value: colors.primary[600], label: "Link" },
  { name: "white", value: colors.white, label: "White" },
];

const spacingTokens = [
  { name: "xs", value: spacing.xs },
  { name: "sm", value: spacing.sm },
  { name: "md", value: spacing.md },
  { name: "lg", value: spacing.lg },
  { name: "xl", value: spacing.xl },
  { name: "2xl", value: spacing["2xl"] },
  { name: "3xl", value: spacing["3xl"] },
  { name: "4xl", value: spacing["4xl"] },
];

const radiusTokens = [
  { name: "none", value: spacing.radius.none },
  { name: "chip", value: spacing.radius.chip },
  { name: "element", value: spacing.radius.element },
  { name: "container", value: spacing.radius.container },
  { name: "feature", value: spacing.radius.feature },
];

function ColorSwatch({
  value,
  label,
}: {
  name: string;
  value: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);
  const isLight = value === colors.white || value === colors.primary[100];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied!" : "Click to copy"}
      style={{
        background: "transparent",
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        overflow: "hidden",
        cursor: "pointer",
        padding: 0,
        transition: "all 150ms",
      }}
    >
      <div
        style={{
          height: 80,
          background: value,
          borderBottom: isLight ? `1px solid ${colors.border.light}` : "none",
        }}
      />
      <div style={{ padding: spacing.md, textAlign: "left" }}>
        <p
          style={{
            fontFamily: typography.fontFamily.mono,
            fontSize: typography.fontSize.sm,
            color: colors.text.primary,
            marginBottom: spacing.xs,
            marginTop: 0,
          }}
        >
          {label}
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
    </button>
  );
}

function SectionTitle({
  children,
  badge,
}: {
  children: string;
  badge?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: spacing.md,
        marginBottom: spacing.xl,
      }}
    >
      <h2
        style={{
          fontSize: typography.fontSize["2xl"],
          fontWeight: typography.fontWeight.semibold,
          fontFamily: typography.fontFamily.primary,
          color: colors.text.primary,
          margin: 0,
        }}
      >
        {children}
      </h2>
      {badge && (
        <span
          style={{
            fontSize: typography.fontSize.xs,
            fontFamily: typography.fontFamily.mono,
            padding: `${spacing.xs} ${spacing.sm}`,
            background: colors.primary[100],
            color: colors.primary[600],
            borderRadius: spacing.radius.container,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

export default function BrandDesignClient() {
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
          Design
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
          Design system
        </h1>
        <p
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.secondary,
            maxWidth: 600,
            margin: 0,
          }}
        >
          Tokens, typography, and spacing for building consistent PolicyEngine
          interfaces.
        </p>
      </div>

      {/* Content */}
      <div
        style={{
          paddingTop: spacing["4xl"],
          paddingBottom: spacing["4xl"],
          paddingLeft: "6.125%",
          paddingRight: "6.125%",
          maxWidth: 1200,
        }}
      >
        {/* Colors */}
        <div style={{ marginBottom: spacing["4xl"] }}>
          <SectionTitle badge={`${colorTokens.length} tokens`}>
            Colors
          </SectionTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: spacing.md,
            }}
          >
            {colorTokens.map((color) => (
              <ColorSwatch key={color.name} {...color} />
            ))}
          </div>
        </div>

        {/* Typography */}
        <div style={{ marginBottom: spacing["4xl"] }}>
          <SectionTitle>Typography</SectionTitle>
          <div
            style={{
              background: colors.white,
              border: `1px solid ${colors.border.light}`,
              borderRadius: spacing.radius.container,
              overflow: "hidden",
            }}
          >
            {[
              {
                label: "Primary",
                font: typography.fontFamily.primary,
                sample:
                  "Inter \u2014 The quick brown fox jumps over the lazy dog.",
              },
              {
                label: "Mono",
                font: typography.fontFamily.mono,
                sample: "JetBrains Mono \u2014 const x = fn(args);",
              },
            ].map((item, i) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: spacing.xl,
                  padding: spacing.lg,
                  borderBottom:
                    i < 1 ? `1px solid ${colors.border.light}` : "none",
                }}
              >
                <span
                  style={{
                    width: 100,
                    flexShrink: 0,
                    fontFamily: typography.fontFamily.mono,
                    fontSize: typography.fontSize.xs,
                    color: colors.text.tertiary,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: typography.fontSize.lg,
                    color: colors.text.primary,
                    fontFamily: item.font,
                  }}
                >
                  {item.sample}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Spacing */}
        <div style={{ marginBottom: spacing["4xl"] }}>
          <SectionTitle badge={`${spacingTokens.length} tokens`}>
            Spacing
          </SectionTitle>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing.sm,
            }}
          >
            {spacingTokens.map((space) => (
              <div
                key={space.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: spacing.lg,
                }}
              >
                <span
                  style={{
                    width: 60,
                    fontFamily: typography.fontFamily.mono,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.tertiary,
                  }}
                >
                  {space.name}
                </span>
                <div
                  style={{
                    height: 24,
                    background: colors.primary[500],
                    borderRadius: spacing.radius.element,
                    opacity: 0.6,
                    width: space.value,
                  }}
                />
                <span
                  style={{
                    fontFamily: typography.fontFamily.mono,
                    fontSize: typography.fontSize.xs,
                    color: colors.text.tertiary,
                  }}
                >
                  {space.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Border radius */}
        <div style={{ marginBottom: spacing["4xl"] }}>
          <SectionTitle badge={`${radiusTokens.length} tokens`}>
            Border radius
          </SectionTitle>
          <div
            style={{
              display: "flex",
              gap: spacing.xl,
              flexWrap: "wrap",
            }}
          >
            {radiusTokens.map((radius) => (
              <div
                key={radius.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    background: colors.primary[500],
                    opacity: 0.3,
                    borderRadius: radius.value,
                  }}
                />
                <span
                  style={{
                    fontFamily: typography.fontFamily.mono,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.tertiary,
                  }}
                >
                  {radius.name} ({radius.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Icons */}
        <div style={{ marginBottom: spacing["4xl"] }}>
          <SectionTitle badge="Tabler Icons">Icons</SectionTitle>
          <p
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              marginBottom: spacing.xl,
              marginTop: 0,
            }}
          >
            PolicyEngine uses{" "}
            <a
              href="https://tabler.io/icons"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: colors.primary[500] }}
            >
              Tabler Icons
            </a>
            . Import from{" "}
            <code
              style={{
                fontFamily: typography.fontFamily.mono,
                fontSize: typography.fontSize.sm,
              }}
            >
              @tabler/icons-react
            </code>
            .
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
              gap: spacing.md,
            }}
          >
            {[
              { icon: IconSearch, name: "Search" },
              { icon: IconCheck, name: "Check" },
              { icon: IconX, name: "X" },
              { icon: IconPlus, name: "Plus" },
              { icon: IconChevronRight, name: "ChevronRight" },
              { icon: IconArrowUp, name: "ArrowUp" },
              { icon: IconArrowDown, name: "ArrowDown" },
              { icon: IconDownload, name: "Download" },
              { icon: IconInfoCircle, name: "InfoCircle" },
              { icon: IconWorld, name: "World" },
            ].map(({ icon: Icon, name }) => (
              <div
                key={name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: spacing.xs,
                  padding: spacing.md,
                  background: colors.white,
                  border: `1px solid ${colors.border.light}`,
                  borderRadius: spacing.radius.container,
                }}
              >
                <Icon size={24} color={colors.text.secondary} />
                <span
                  style={{
                    fontFamily: typography.fontFamily.mono,
                    fontSize: typography.fontSize.xs,
                    color: colors.text.tertiary,
                  }}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Usage */}
        <div>
          <SectionTitle>Usage</SectionTitle>
          <div
            style={{
              padding: spacing.xl,
              borderRadius: spacing.radius.container,
              background: colors.secondary[900],
            }}
          >
            <pre
              style={{
                fontFamily: typography.fontFamily.mono,
                fontSize: typography.fontSize.sm,
                color: colors.secondary[300],
                margin: 0,
                overflow: "auto",
              }}
            >
              {`// Import design tokens
import { colors, spacing, typography } from '@policyengine/design-system/tokens';

// Use in styles
<div
  style={{
    color: colors.primary[500],
    padding: spacing.lg,
    borderRadius: spacing.radius.container,
    fontFamily: typography.fontFamily.primary,
  }}
>
  Content
</div>`}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}
