"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import {
  colors,
  typography,
} from "@policyengine/design-system/tokens";
import {
  CATEGORY_DESCRIPTIONS,
  type ToolCategory,
  type ToolDefinition,
  type ToolTone,
} from "@/data/tools";

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const { ref, visible } = useInView();

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(24px)",
        transition:
          "opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const SECTION_X: React.CSSProperties = {
  paddingLeft: "6.125%",
  paddingRight: "6.125%",
};

const CONTAINER: React.CSSProperties = {
  maxWidth: 1240,
  marginLeft: "auto",
  marginRight: "auto",
};

const toneStyles: Record<
  ToolTone,
  {
    background: string;
    border: string;
    glow: string;
  }
> = {
  teal: {
    background:
      "linear-gradient(135deg, rgba(230,255,250,0.98), rgba(203,250,245,0.92))",
    border: "rgba(56, 178, 172, 0.28)",
    glow: "rgba(49, 151, 149, 0.12)",
  },
  slate: {
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.96))",
    border: "rgba(148, 163, 184, 0.28)",
    glow: "rgba(15, 23, 42, 0.22)",
  },
  amber: {
    background:
      "linear-gradient(135deg, rgba(255,251,235,0.98), rgba(254,243,199,0.95))",
    border: "rgba(217, 119, 6, 0.22)",
    glow: "rgba(245, 158, 11, 0.12)",
  },
  rose: {
    background:
      "linear-gradient(135deg, rgba(255,241,242,0.98), rgba(255,228,230,0.94))",
    border: "rgba(225, 29, 72, 0.18)",
    glow: "rgba(225, 29, 72, 0.1)",
  },
  sky: {
    background:
      "linear-gradient(135deg, rgba(240,249,255,0.98), rgba(224,242,254,0.94))",
    border: "rgba(2, 132, 199, 0.18)",
    glow: "rgba(2, 132, 199, 0.12)",
  },
};

const countryLabels: Record<string, string> = {
  us: "United States",
  uk: "United Kingdom",
  ca: "Canada",
  ng: "Nigeria",
  il: "Israel",
};

const categoryOrder: ToolCategory[] = [
  "Policy calculators",
  "Developer tools",
  "Emulators and analysis tools",
];

const terminalStyles = {
  comment: { prefix: "", color: "#6B7280", prefixColor: "#6B7280" },
  command: { prefix: "$ ", color: "#E5E7EB", prefixColor: "#7DD3FC" },
  prompt: { prefix: "> ", color: "#F8FAFC", prefixColor: "#5EEAD4" },
  output: { prefix: "  ", color: "#CBD5E1", prefixColor: "#CBD5E1" },
  success: { prefix: "  ", color: "#86EFAC", prefixColor: "#86EFAC" },
} as const;

function ActionLink({
  action,
}: {
  action: { label: string; href: string; external?: boolean };
}) {
  const sharedStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "13px 19px",
    borderRadius: "999px",
    textDecoration: "none",
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    transition: "transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease",
    boxShadow: "0 18px 40px -24px rgba(35,78,82,0.35)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
  };

  if (action.external) {
    return (
      <a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          ...sharedStyle,
          backgroundColor: colors.primary[500],
          color: colors.white,
          border: `1px solid ${colors.primary[500]}`,
        }}
      >
        <span>{action.label}</span>
        <IconArrowRight size={16} />
      </a>
    );
  }

  return (
    <Link
      href={action.href}
      style={{
        ...sharedStyle,
        backgroundColor: colors.primary[500],
        color: colors.white,
        border: `1px solid ${colors.primary[500]}`,
      }}
    >
      <span>{action.label}</span>
      <IconArrowRight size={16} />
    </Link>
  );
}

function ToolPreviewPanel({ tool }: { tool: ToolDefinition }) {
  if (tool.preview.type === "image") {
    return (
      <div
        style={{
          position: "relative",
          minHeight: 250,
          height: "100%",
          borderRadius: "24px",
          overflow: "hidden",
          border: `1px solid rgba(255,255,255,0.82)`,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(248,250,252,0.82) 100%)",
          boxShadow: `0 28px 70px -40px ${colors.shadow.dark}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(15,23,42,0.12) 100%)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tool.preview.src}
          alt={tool.preview.alt}
          style={{
            width: "100%",
            height: "100%",
            minHeight: 250,
            objectFit: "cover",
            objectPosition: tool.preview.objectPosition ?? "center",
            display: "block",
          }}
        />
      </div>
    );
  }

  if (tool.preview.type === "metrics") {
    return (
      <div
        style={{
          borderRadius: "24px",
          padding: "24px",
          minHeight: 250,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(248,250,252,0.84) 100%)",
          border: `1px solid rgba(255,255,255,0.82)`,
          boxShadow: `0 28px 70px -40px ${colors.shadow.dark}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 18,
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: colors.text.secondary,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            {tool.preview.eyebrow}
          </p>
          <h3
            style={{
              marginTop: 10,
              marginBottom: 0,
              fontSize: typography.fontSize["2xl"],
              lineHeight: 1.15,
              color: colors.gray[900],
              fontWeight: typography.fontWeight.bold,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            {tool.title}
          </h3>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
            gap: 12,
          }}
        >
          {tool.preview.items.map((item) => (
            <div
              key={item.label}
              style={{
                borderRadius: "16px",
                padding: "14px 12px",
                backgroundColor: "rgba(255,255,255,0.88)",
                border: `1px solid ${colors.border.light}`,
                boxShadow: "0 12px 26px -24px rgba(15,23,42,0.28)",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: colors.text.secondary,
                  marginBottom: 8,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.gray[900],
                  lineHeight: 1.1,
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: 250,
        borderRadius: "24px",
        padding: "24px",
        background:
          "radial-gradient(circle at top, rgba(30,41,59,0.98), rgba(15,23,42,0.98) 70%)",
        border: "1px solid rgba(148, 163, 184, 0.22)",
        boxShadow: "0 30px 70px -38px rgba(15,23,42,0.68)",
        fontFamily: typography.fontFamily.mono,
        fontSize: "12px",
        lineHeight: 1.8,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 22%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#F87171",
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#FBBF24",
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#34D399",
          }}
        />
      </div>
      {tool.preview.lines.map((line, index) => {
        const style = terminalStyles[line.kind];
        return (
          <div
            key={`${line.text}-${index}`}
            style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          >
            <span style={{ color: style.prefixColor }}>{style.prefix}</span>
            <span style={{ color: style.color }}>{line.text}</span>
          </div>
        );
      })}
    </div>
  );
}

function ToolCard({
  tool,
  featured = false,
}: {
  tool: ToolDefinition;
  featured?: boolean;
}) {
  const tone = toneStyles[tool.tone];
  const isDarkTone = tool.tone === "slate";
  const headingColor = isDarkTone ? colors.white : colors.gray[900];
  const bodyColor = isDarkTone ? "rgba(255,255,255,0.82)" : colors.text.secondary;

  return (
    <article
      style={{
        position: "relative",
        borderRadius: featured ? "34px" : "28px",
        padding: featured ? "34px" : "28px",
        background: tone.background,
        border: `1px solid ${tone.border}`,
        boxShadow: `0 34px 100px -56px ${tone.glow}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top right, rgba(255,255,255,0.62), transparent 38%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 26,
          right: 26,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.72), transparent)",
          pointerEvents: "none",
        }}
      />
      <div
        className={featured ? "grid gap-8 lg:grid-cols-[1.05fr,0.95fr]" : "grid gap-6"}
        style={{ position: "relative" }}
      >
        <div>
          <h2
            style={{
              marginTop: 0,
              marginBottom: 14,
              color: headingColor,
              fontSize: featured ? "clamp(30px, 4vw, 42px)" : "clamp(24px, 3vw, 30px)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              fontFamily: typography.fontFamily.primary,
              fontWeight: typography.fontWeight.bold,
              maxWidth: featured ? 520 : "none",
            }}
          >
            {tool.title}
          </h2>

          <p
            style={{
              marginTop: 0,
              marginBottom: 0,
              color: bodyColor,
              fontSize: featured ? typography.fontSize.lg : typography.fontSize.base,
              lineHeight: typography.lineHeight.relaxed,
              maxWidth: featured ? 520 : "none",
            }}
          >
            {tool.summary}
          </p>
        </div>

        <div
          style={{
            alignSelf: "stretch",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <ToolPreviewPanel tool={tool} />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "center",
            }}
          >
            <ActionLink action={tool.primaryAction} />
          </div>
        </div>
      </div>
    </article>
  );
}

function CategoryCards({ tools }: { tools: ToolDefinition[] }) {
  const grouped = useMemo(() => {
    return categoryOrder
      .map((category) => ({
        category,
        tools: tools.filter((tool) => tool.category === category),
      }))
      .filter((group) => group.tools.length > 0);
  }, [tools]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {grouped.map((group, index) => (
        <Reveal key={group.category} delay={index * 80}>
          <section
            style={{
              height: "100%",
              borderRadius: "24px",
              backgroundColor: colors.white,
              border: `1px solid ${colors.border.light}`,
              padding: "24px",
              boxShadow: `0 16px 48px -36px ${colors.shadow.dark}`,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: colors.primary[600],
                fontWeight: typography.fontWeight.semibold,
              }}
            >
              {group.category}
            </p>
            <h3
              style={{
                marginTop: 12,
                marginBottom: 10,
                fontSize: typography.fontSize["2xl"],
                lineHeight: 1.15,
                color: colors.gray[900],
                fontWeight: typography.fontWeight.bold,
              }}
            >
              {CATEGORY_DESCRIPTIONS[group.category].label}
            </h3>
            <p
              style={{
                marginTop: 0,
                marginBottom: 18,
                fontSize: typography.fontSize.base,
                lineHeight: typography.lineHeight.relaxed,
                color: colors.text.secondary,
              }}
            >
              {CATEGORY_DESCRIPTIONS[group.category].description}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {group.tools.map((tool) => (
                <span
                  key={tool.slug}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderRadius: "999px",
                    backgroundColor: colors.gray[50],
                    border: `1px solid ${colors.border.light}`,
                    fontSize: typography.fontSize.xs,
                    color: colors.gray[900],
                    fontWeight: typography.fontWeight.medium,
                  }}
                >
                  {tool.title}
                </span>
              ))}
            </div>
          </section>
        </Reveal>
      ))}
    </div>
  );
}

export default function ToolsShowcase({
  countryId,
  tools,
}: {
  countryId: string;
  tools: ToolDefinition[];
}) {
  const hasTools = tools.length > 0;
  const countryLabel = countryLabels[countryId] ?? "your country";
  const [spotlight, ...rest] = tools;

  return (
    <>
      <section
        style={{
          ...SECTION_X,
          paddingTop: 84,
          paddingBottom: 88,
          background:
            "linear-gradient(180deg, rgba(247,250,252,1) 0%, rgba(255,255,255,1) 48%, rgba(250,252,255,1) 100%)",
          borderBottom: `1px solid ${colors.border.light}`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -140,
            right: "-8%",
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(49,151,149,0.16) 0%, rgba(49,151,149,0.04) 48%, transparent 72%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -180,
            left: "-10%",
            width: 520,
            height: 520,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(2,132,199,0.12) 0%, rgba(2,132,199,0.03) 54%, transparent 74%)",
            pointerEvents: "none",
          }}
        />
        <div style={CONTAINER}>
          <div style={{ maxWidth: 760 }}>
            <Reveal>
              <h1
                style={{
                  marginTop: 0,
                  marginBottom: 22,
                  fontSize: "clamp(40px, 6vw, 68px)",
                  lineHeight: 0.96,
                  letterSpacing: "-0.05em",
                  color: colors.gray[900],
                  fontWeight: typography.fontWeight.bold,
                  fontFamily: typography.fontFamily.primary,
                  maxWidth: 640,
                }}
              >
                Tools for understanding public policy
              </h1>
            </Reveal>

            <Reveal delay={70}>
              <p
                style={{
                  marginTop: 0,
                  marginBottom: 0,
                  fontSize: typography.fontSize.xl,
                  lineHeight: typography.lineHeight.relaxed,
                  color: colors.text.secondary,
                  maxWidth: 660,
                }}
              >
                {hasTools
                  ? `A curated set of calculators, developer tooling, and analysis tools for ${countryLabel}. Built to be opened, tested, and used in real workflows.`
                  : `We do not have a country-specific tools lineup for ${countryLabel} yet. Research remains available now, and more tools will land here as coverage expands.`}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {hasTools && spotlight && (
        <section
          id="flagship-tools"
          style={{
            ...SECTION_X,
            paddingTop: 72,
            paddingBottom: 36,
            background:
              "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(249,250,251,1) 100%)",
          }}
        >
          <div style={CONTAINER}>
            <Reveal>
              <div style={{ marginBottom: 28 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: colors.primary[600],
                    fontWeight: typography.fontWeight.semibold,
                  }}
                >
                  Flagship tools
                </p>
                <h2
                  style={{
                    marginTop: 12,
                    marginBottom: 12,
                    fontSize: "clamp(30px, 4vw, 44px)",
                    lineHeight: 1.02,
                    letterSpacing: "-0.04em",
                    color: colors.gray[900],
                    fontWeight: typography.fontWeight.bold,
                  }}
                >
                  Built to invite action, not passive browsing.
                </h2>
                <p
                  style={{
                    margin: 0,
                    maxWidth: 720,
                    fontSize: typography.fontSize.lg,
                    lineHeight: typography.lineHeight.relaxed,
                    color: colors.text.secondary,
                  }}
                >
                  These tools earn attention by making the next step obvious:
                  install, launch, compare, or estimate.
                </p>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <ToolCard tool={spotlight} featured />
            </Reveal>
          </div>
        </section>
      )}

      {hasTools && rest.length > 0 && (
        <section
          style={{
            ...SECTION_X,
            paddingTop: 36,
            paddingBottom: 76,
            backgroundColor: colors.white,
            borderBottom: `1px solid ${colors.border.light}`,
          }}
        >
          <div style={CONTAINER}>
            <div className="grid gap-6 lg:grid-cols-2">
              {rest.map((tool, index) => (
                <Reveal key={tool.slug} delay={index * 80}>
                  <ToolCard tool={tool} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasTools && (
        <section
          style={{
            ...SECTION_X,
            paddingTop: 72,
            paddingBottom: 72,
            background:
              "linear-gradient(180deg, rgba(249,250,251,1) 0%, rgba(255,255,255,1) 100%)",
            borderBottom: `1px solid ${colors.border.light}`,
          }}
        >
          <div style={CONTAINER}>
            <Reveal>
              <div style={{ marginBottom: 28 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: "11px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: colors.primary[600],
                    fontWeight: typography.fontWeight.semibold,
                  }}
                >
                  Tool context
                </p>
                <h2
                  style={{
                    marginTop: 12,
                    marginBottom: 12,
                    fontSize: "clamp(28px, 4vw, 42px)",
                    lineHeight: 1.04,
                    letterSpacing: "-0.04em",
                    color: colors.gray[900],
                    fontWeight: typography.fontWeight.bold,
                  }}
                >
                  Use this page to launch a tool. Use research to read findings.
                </h2>
                <p
                  style={{
                    margin: 0,
                    maxWidth: 760,
                    fontSize: typography.fontSize.lg,
                    lineHeight: typography.lineHeight.relaxed,
                    color: colors.text.secondary,
                  }}
                >
                  Tools should feel like the next action. Research should
                  feel like supporting evidence and interpretation. Keeping that
                  distinction obvious makes the page faster to understand.
                </p>
              </div>
            </Reveal>

            <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
              <Reveal delay={60}>
                <div className="grid gap-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <section
                      style={{
                        height: "100%",
                        borderRadius: "28px",
                        padding: "28px",
                        background:
                          "linear-gradient(135deg, rgba(230,255,250,0.98), rgba(255,255,255,0.96))",
                        border: `1px solid ${colors.primary[200]}`,
                        boxShadow: "0 26px 60px -44px rgba(35,78,82,0.22)",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "11px",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: colors.primary[700],
                          fontWeight: typography.fontWeight.semibold,
                        }}
                      >
                        Tools
                      </p>
                      <h3
                        style={{
                          marginTop: 12,
                          marginBottom: 14,
                          fontSize: typography.fontSize["3xl"],
                          lineHeight: 1.08,
                          color: colors.gray[900],
                          fontWeight: typography.fontWeight.bold,
                        }}
                      >
                        Built for action.
                      </h3>
                      <p
                        style={{
                          marginTop: 0,
                          marginBottom: 0,
                          color: colors.text.secondary,
                          fontSize: typography.fontSize.base,
                          lineHeight: typography.lineHeight.relaxed,
                        }}
                      >
                        Launch a calculator, install a tool, compare scenarios,
                        or test inputs directly.
                      </p>
                    </section>

                    <section
                      style={{
                        height: "100%",
                        borderRadius: "28px",
                        padding: "28px",
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.86) 100%)",
                        border: `1px solid ${colors.border.light}`,
                        boxShadow: "0 26px 60px -48px rgba(15,23,42,0.16)",
                        backdropFilter: "blur(18px)",
                        WebkitBackdropFilter: "blur(18px)",
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "11px",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: colors.gray[700],
                          fontWeight: typography.fontWeight.semibold,
                        }}
                      >
                        Research
                      </p>
                      <h3
                        style={{
                          marginTop: 12,
                          marginBottom: 14,
                          fontSize: typography.fontSize["3xl"],
                          lineHeight: 1.08,
                          color: colors.gray[900],
                          fontWeight: typography.fontWeight.bold,
                        }}
                      >
                        Built for interpretation.
                      </h3>
                      <p
                        style={{
                          marginTop: 0,
                          marginBottom: 18,
                          color: colors.text.secondary,
                          fontSize: typography.fontSize.base,
                          lineHeight: typography.lineHeight.relaxed,
                        }}
                      >
                        Read findings, review charts, and understand the
                        context behind the numbers.
                      </p>
                      <Link
                        href={`/${countryId}/research`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          textDecoration: "none",
                          color: colors.primary[700],
                          fontWeight: typography.fontWeight.semibold,
                        }}
                      >
                        Go to research
                        <IconArrowRight size={16} />
                      </Link>
                    </section>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      {
                        title: "Action first",
                        body: "Each tool card leads with the next thing a visitor can do.",
                      },
                      {
                        title: "Distinct types",
                        body: "Calculators, developer tools, and emulators stay visibly separate.",
                      },
                      {
                        title: "Real proof",
                        body: "Previews show interfaces, outputs, and use cases instead of filler copy.",
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        style={{
                          borderRadius: "24px",
                          padding: "22px",
                          background:
                            "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(248,250,252,0.86) 100%)",
                          border: `1px solid ${colors.border.light}`,
                          boxShadow: "0 22px 56px -48px rgba(15,23,42,0.18)",
                          backdropFilter: "blur(16px)",
                          WebkitBackdropFilter: "blur(16px)",
                        }}
                      >
                        <h3
                          style={{
                            marginTop: 0,
                            marginBottom: 10,
                            fontSize: typography.fontSize.xl,
                            lineHeight: 1.15,
                            color: colors.gray[900],
                            fontWeight: typography.fontWeight.bold,
                          }}
                        >
                          {item.title}
                        </h3>
                        <p
                          style={{
                            margin: 0,
                            color: colors.text.secondary,
                            fontSize: typography.fontSize.sm,
                            lineHeight: typography.lineHeight.relaxed,
                          }}
                        >
                          {item.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={120}>
                <CategoryCards tools={tools} />
              </Reveal>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
