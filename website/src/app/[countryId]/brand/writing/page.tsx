import type { Metadata } from "next";
import Link from "next/link";
import { IconCheck, IconX } from "@tabler/icons-react";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";

export const metadata: Metadata = {
  title: "Writing guide",
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
        paddingBottom: spacing.md,
        borderBottom: `1px solid ${colors.border.light}`,
      }}
    >
      {children}
    </h2>
  );
}

function RuleTitle({ children }: { children: string }) {
  return (
    <h3
      style={{
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        fontFamily: typography.fontFamily.primary,
        color: colors.text.primary,
        marginBottom: spacing.sm,
        marginTop: 0,
      }}
    >
      {children}
    </h3>
  );
}

function RuleDescription({ children }: { children: string }) {
  return (
    <p
      style={{
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
        lineHeight: typography.lineHeight.relaxed,
        marginBottom: spacing.md,
        marginTop: 0,
      }}
    >
      {children}
    </p>
  );
}

function ExampleBox({
  type,
  children,
}: {
  type: "good" | "bad";
  children: React.ReactNode;
}) {
  const isGood = type === "good";
  return (
    <div
      style={{
        padding: spacing.md,
        background: isGood ? `${colors.primary[500]}10` : `${colors.error}10`,
        border: `1px solid ${isGood ? colors.primary[500] : colors.error}30`,
        borderRadius: spacing.radius.container,
      }}
    >
      <p
        style={{
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.semibold,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: isGood ? colors.primary[500] : colors.error,
          marginBottom: spacing.sm,
          marginTop: 0,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {isGood ? <IconCheck size={14} /> : <IconX size={14} />}
        {isGood ? "Correct" : "Incorrect"}
      </p>
      <div
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.primary,
          lineHeight: typography.lineHeight.relaxed,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function TermItem({ term, definition }: { term: string; definition: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: spacing.md,
        gap: spacing.lg,
        background: colors.white,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
      }}
    >
      <span
        style={{
          width: 140,
          flexShrink: 0,
          fontFamily: typography.fontFamily.mono,
          fontWeight: typography.fontWeight.semibold,
          color: colors.primary[600],
        }}
      >
        {term}
      </span>
      <span
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
        }}
      >
        {definition}
      </span>
    </div>
  );
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: spacing.lg,
        marginTop: spacing.lg,
        background: `${colors.primary[500]}08`,
        border: `1px solid ${colors.primary[500]}20`,
        borderRadius: spacing.radius.container,
      }}
    >
      <p
        style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          color: colors.primary[600],
          marginBottom: spacing.sm,
          marginTop: 0,
        }}
      >
        Pro tip
      </p>
      <p
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          lineHeight: typography.lineHeight.relaxed,
          margin: 0,
        }}
      >
        {children}
      </p>
    </div>
  );
}

function ExampleRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: spacing.md,
      }}
    >
      {children}
    </div>
  );
}

export default function BrandWritingPage() {
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
          Writing
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
          Writing guide
        </h1>
        <p
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.secondary,
            maxWidth: 600,
            margin: 0,
          }}
        >
          How PolicyEngine communicates. Voice, tone, and content guidelines for
          research-oriented writing.
        </p>
      </div>

      {/* Content */}
      <div
        style={{
          paddingTop: spacing["4xl"],
          paddingBottom: spacing["4xl"],
          paddingLeft: "6.125%",
          paddingRight: "6.125%",
          maxWidth: 800,
        }}
      >
        {/* Sentence case */}
        <div style={{ marginBottom: spacing["4xl"] }}>
          <SectionTitle>Sentence case</SectionTitle>
          <p
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
              marginBottom: spacing.xl,
              marginTop: 0,
            }}
          >
            Always use sentence case for headings, not title case. This follows
            the modern standard used by Apple, Google, Slack, Notion, and
            GOV.UK.
          </p>

          <div style={{ marginBottom: spacing.xl }}>
            <RuleTitle>The rule</RuleTitle>
            <RuleDescription>
              Capitalize only the first word of a heading and any proper nouns.
              Everything else stays lowercase.
            </RuleDescription>
            <ExampleRow>
              <ExampleBox type="good">
                How tax reform affects families
                <br />
                Understanding the EITC
                <br />
                Getting started with PolicyEngine
                <br />
                Why microsimulation matters
              </ExampleBox>
              <ExampleBox type="bad">
                How Tax Reform Affects Families
                <br />
                Understanding The EITC
                <br />
                Getting Started With PolicyEngine
                <br />
                Why Microsimulation Matters
              </ExampleBox>
            </ExampleRow>
          </div>

          <div style={{ marginBottom: spacing.xl }}>
            <RuleTitle>Proper nouns stay capitalized</RuleTitle>
            <RuleDescription>
              Brand names, acronyms, and proper nouns keep their capitalization.
            </RuleDescription>
            <ExampleRow>
              <ExampleBox type="good">
                How AI affects income distribution
                <br />
                Analyzing the American Rescue Plan
                <br />
                UK benefit calculations
                <br />
                Building with PolicyEngine
              </ExampleBox>
              <ExampleBox type="bad">
                How ai affects income distribution
                <br />
                Analyzing the american rescue plan
                <br />
                Uk benefit calculations
                <br />
                Building with policyengine
              </ExampleBox>
            </ExampleRow>
          </div>

          <div>
            <RuleTitle>Where this applies</RuleTitle>
            <RuleDescription>
              Use sentence case consistently across all content:
            </RuleDescription>
            <ul
              style={{
                color: colors.text.secondary,
                lineHeight: typography.lineHeight.relaxed,
                paddingLeft: spacing.xl,
              }}
            >
              <li style={{ marginBottom: spacing.xs }}>
                Page titles and headings
              </li>
              <li style={{ marginBottom: spacing.xs }}>Navigation labels</li>
              <li style={{ marginBottom: spacing.xs }}>Button text</li>
              <li style={{ marginBottom: spacing.xs }}>Form labels</li>
              <li style={{ marginBottom: spacing.xs }}>Documentation titles</li>
              <li style={{ marginBottom: spacing.xs }}>Blog post titles</li>
              <li style={{ marginBottom: spacing.xs }}>Error messages</li>
            </ul>
          </div>
        </div>

        {/* Voice and tone */}
        <div style={{ marginBottom: spacing["4xl"] }}>
          <SectionTitle>Voice and tone</SectionTitle>
          <p
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
              marginBottom: spacing.xl,
              marginTop: 0,
            }}
          >
            PolicyEngine&apos;s voice is research-oriented but accessible. We
            explain complex policy concepts clearly while maintaining rigor.
            When writing about our tools, the tone can be more natural and
            conversational.
          </p>

          <div style={{ marginBottom: spacing.xl }}>
            <RuleTitle>Use active voice</RuleTitle>
            <RuleDescription>
              Write in active voice. The subject should perform the action, not
              receive it.
            </RuleDescription>
            <ExampleRow>
              <ExampleBox type="good">
                The policy increases benefits by $1,200/year.
                <br />
                We validated against IRS data.
                <br />
                PolicyEngine calculates taxes for all 50 states.
              </ExampleBox>
              <ExampleBox type="bad">
                Benefits are increased by $1,200/year by the policy.
                <br />
                Validation was performed against IRS data.
                <br />
                Taxes for all 50 states are calculated by PolicyEngine.
              </ExampleBox>
            </ExampleRow>
          </div>

          <div style={{ marginBottom: spacing.xl }}>
            <RuleTitle>Be direct</RuleTitle>
            <RuleDescription>
              Get to the point. Avoid filler words and unnecessary qualifiers.
            </RuleDescription>
            <ExampleRow>
              <ExampleBox type="good">
                The reform costs $50 billion annually.
              </ExampleBox>
              <ExampleBox type="bad">
                It can be noted that the reform would cost approximately $50
                billion per year.
              </ExampleBox>
            </ExampleRow>
          </div>

          <div style={{ marginBottom: spacing.xl }}>
            <RuleTitle>Be precise</RuleTitle>
            <RuleDescription>
              Use specific numbers and concrete examples. Avoid vague claims.
            </RuleDescription>
            <ExampleRow>
              <ExampleBox type="good">
                The policy affects 42 million households.
              </ExampleBox>
              <ExampleBox type="bad">
                The policy affects many households.
              </ExampleBox>
            </ExampleRow>
          </div>

          <div style={{ marginBottom: spacing.xl }}>
            <RuleTitle>Present numbers dispassionately</RuleTitle>
            <RuleDescription>
              When presenting results from PolicyEngine, let the data speak for
              itself. Avoid adjectives or adverbs that aren&apos;t backed by the
              numbers themselves.
            </RuleDescription>
            <ExampleRow>
              <ExampleBox type="good">
                The policy reduces poverty by 15%.
                <br />
                Average benefits increase by $2,400/year.
                <br />
                The reform costs $80 billion annually.
              </ExampleBox>
              <ExampleBox type="bad">
                The policy dramatically slashes poverty by an impressive 15%.
                <br />
                Benefits skyrocket by a remarkable $2,400/year.
                <br />
                The reform has a surprisingly modest cost of just $80 billion.
              </ExampleBox>
            </ExampleRow>
          </div>
        </div>

        {/* Terminology */}
        <div style={{ marginBottom: spacing["4xl"] }}>
          <SectionTitle>Terminology</SectionTitle>
          <p
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
              marginBottom: spacing.xl,
              marginTop: 0,
            }}
          >
            Use these terms consistently across all PolicyEngine content.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing.sm,
            }}
          >
            <TermItem
              term="PolicyEngine"
              definition="The organization and platform. Capital P, capital E, one word."
            />
            <TermItem
              term="microsimulation"
              definition="One word, no hyphen. The technique for modeling policy effects."
            />
            <TermItem
              term="EITC"
              definition="Earned Income Tax Credit. Spell out on first use."
            />
            <TermItem
              term="CTC"
              definition="Child Tax Credit. Spell out on first use."
            />
            <TermItem
              term="UBI"
              definition="Universal Basic Income. Spell out on first use."
            />
            <TermItem
              term="poverty rate"
              definition="Lowercase. The share of people below the poverty line."
            />
            <TermItem
              term="Gini index"
              definition="Capital G. A measure of income inequality."
            />
          </div>

          <TipBox>
            When in doubt about capitalization, check how the term appears in
            official government sources or academic literature. Acronyms stay
            uppercase; their spelled-out forms follow normal capitalization
            rules.
          </TipBox>
        </div>

        {/* Numbers and formatting */}
        <div>
          <SectionTitle>Numbers and formatting</SectionTitle>

          <div style={{ marginBottom: spacing.xl }}>
            <RuleTitle>Numbers</RuleTitle>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: spacing.sm,
              }}
            >
              <TermItem
                term="1-9"
                definition='Spell out: "three states", "five scenarios"'
              />
              <TermItem
                term="10+"
                definition='Use numerals: "50 states", "100 households"'
              />
              <TermItem
                term="Large numbers"
                definition='Use commas: "1,000,000 households" or abbreviate: "1M households"'
              />
              <TermItem
                term="Percentages"
                definition='Use numerals with symbol: "15% reduction"'
              />
              <TermItem
                term="Money"
                definition='Use $ with numerals: "$50 billion", "$1,200/year"'
              />
            </div>
          </div>

          <div>
            <RuleTitle>Code references</RuleTitle>
            <RuleDescription>
              Use inline code formatting for variable names, function names,
              file paths, and API endpoints.
            </RuleDescription>
          </div>
        </div>
      </div>
    </>
  );
}
