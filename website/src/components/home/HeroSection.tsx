"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";

// --- Typewriter prompt data ---

interface PromptData {
  text: string;
  winnerPct: number;
  loserPct: number;
}

const UK_PROMPTS: PromptData[] = [
  {
    text: "the impact of raising the basic rate to 25p",
    winnerPct: 0,
    loserPct: 0.65,
  },
  {
    text: "how a £2,000 UBI would affect child poverty",
    winnerPct: 0.75,
    loserPct: 0.2,
  },
  {
    text: "who gains from abolishing the personal allowance",
    winnerPct: 0,
    loserPct: 0.85,
  },
  {
    text: "revenue from a 50p additional rate",
    winnerPct: 0,
    loserPct: 0.02,
  },
  {
    text: "how removing the benefit cap affects single parents",
    winnerPct: 0.05,
    loserPct: 0,
  },
];

const US_PROMPTS: PromptData[] = [
  {
    text: "how tripling the standard deduction affects median income",
    winnerPct: 0.7,
    loserPct: 0,
  },
  {
    text: "the poverty impact of expanding the Child Tax Credit",
    winnerPct: 0.35,
    loserPct: 0,
  },
  {
    text: "the distributional impact of expanding the EITC",
    winnerPct: 0.3,
    loserPct: 0,
  },
  {
    text: "the impact of removing the SALT cap on high earners",
    winnerPct: 0.15,
    loserPct: 0,
  },
  {
    text: "the cost of making the standard deduction universal",
    winnerPct: 0.45,
    loserPct: 0.1,
  },
];

const TYPE_SPEED = 28;
const DELETE_SPEED = 18;
const PAUSE_AFTER_TYPE = 2400;
const PAUSE_AFTER_DELETE = 350;

function TypewriterPrompt({ countryId }: { countryId: string }) {
  const prompts = countryId === "uk" ? UK_PROMPTS : US_PROMPTS;
  const [displayText, setDisplayText] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "deleting" | "pausing">(
    "typing",
  );
  const charIndex = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const currentPrompt = prompts[promptIndex % prompts.length].text;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  useEffect(() => {
    if (phase !== "typing") return;
    if (charIndex.current >= currentPrompt.length) {
      timerRef.current = setTimeout(() => setPhase("deleting"), PAUSE_AFTER_TYPE);
      return clearTimer;
    }
    timerRef.current = setTimeout(() => {
      charIndex.current += 1;
      setDisplayText(currentPrompt.slice(0, charIndex.current));
    }, TYPE_SPEED);
    return clearTimer;
  }, [phase, displayText, currentPrompt, clearTimer]);

  useEffect(() => {
    if (phase !== "deleting") return;
    if (charIndex.current <= 0) {
      setPhase("pausing");
      return;
    }
    timerRef.current = setTimeout(() => {
      charIndex.current -= 1;
      setDisplayText(currentPrompt.slice(0, charIndex.current));
    }, DELETE_SPEED);
    return clearTimer;
  }, [phase, displayText, currentPrompt, clearTimer]);

  useEffect(() => {
    if (phase !== "pausing") return;
    timerRef.current = setTimeout(() => {
      setPromptIndex((prev) => (prev + 1) % prompts.length);
      charIndex.current = 0;
      setDisplayText("");
      setPhase("typing");
    }, PAUSE_AFTER_DELETE);
    return clearTimer;
  }, [phase, clearTimer, prompts.length]);

  return (
    <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: `0 ${spacing.lg}` }}>
      <div
        style={{
          display: "inline-block",
          background: `${colors.white}e6`,
          backdropFilter: "blur(8px)",
          borderRadius: spacing.radius.container,
          padding: `${spacing["2xl"]} ${spacing["3xl"]}`,
          boxShadow: `0 1px 3px ${colors.shadow.light}`,
          border: `1px solid ${colors.border.light}`,
          maxWidth: 700,
        }}
      >
        <span
          style={{
            fontFamily: typography.fontFamily.mono,
            fontSize: "clamp(14px, 2.5vw, 20px)",
            fontWeight: typography.fontWeight.medium,
            color: colors.text.secondary,
          }}
        >
          compute:{" "}
        </span>
        <span
          style={{
            fontFamily: typography.fontFamily.mono,
            fontSize: "clamp(14px, 2.5vw, 20px)",
            fontWeight: typography.fontWeight.medium,
            fontStyle: "italic",
            color: colors.primary[700],
          }}
        >
          {displayText}
        </span>
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: "1.2em",
            backgroundColor: colors.primary[500],
            marginLeft: 2,
            verticalAlign: "text-bottom",
            animation: "cursorBlink 1s step-end infinite",
          }}
        />
      </div>
      <style>{`@keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
    </div>
  );
}

// --- Household graph placeholder ---
// TODO: Port the full canvas-based HouseholdGraph with population centers,
// animated nodes, mouse hover interactions, and impact state visualization.
// The original uses a 10k-node canvas renderer with drift animations.
function HouseholdGraphPlaceholder() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: `radial-gradient(ellipse at center, ${colors.primary[50]} 0%, transparent 70%)`,
        opacity: 0.5,
      }}
    />
  );
}

export default function HeroSection({ countryId }: { countryId: string }) {
  const subtitle =
    countryId === "uk"
      ? "Free, open-source tax and benefit analysis. Model policy reforms across the UK."
      : "Free, open-source tax and benefit analysis. Model policy reforms across all 50 states.";

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing["2xl"],
        padding: `${spacing["5xl"]} ${spacing.xl}`,
        background: colors.white,
        overflow: "hidden",
      }}
    >
      <HouseholdGraphPlaceholder />

      {/* Logo */}
      <img
        src="/assets/logos/policyengine/teal.svg"
        alt="PolicyEngine"
        style={{
          position: "relative",
          zIndex: 1,
          width: "clamp(200px, 40vw, 360px)",
          height: "auto",
        }}
      />

      {/* Subtitle */}
      <p
        style={{
          position: "relative",
          zIndex: 1,
          fontSize: "clamp(16px, 2.5vw, 22px)",
          fontWeight: typography.fontWeight.normal,
          color: colors.text.secondary,
          fontFamily: typography.fontFamily.primary,
          lineHeight: 1.5,
          margin: 0,
          textAlign: "center",
          maxWidth: 580,
          padding: `0 ${spacing.lg}`,
        }}
      >
        {subtitle}
      </p>

      {/* Typewriter prompt */}
      <TypewriterPrompt countryId={countryId} />

      {/* CTA button */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <a
          href={`/${countryId}/calculator`}
          style={{
            display: "inline-block",
            background: colors.primary[500],
            color: colors.white,
            padding: `${spacing.lg} ${spacing["3xl"]}`,
            borderRadius: 40,
            fontFamily: typography.fontFamily.primary,
            fontWeight: typography.fontWeight.semibold,
            fontSize: typography.fontSize.lg,
            textDecoration: "none",
            boxShadow: `0 2px 12px ${colors.primary.alpha[40]}`,
            transition: "box-shadow 0.3s ease, transform 0.15s ease",
          }}
        >
          Enter PolicyEngine
        </a>
      </div>

      {/* Bottom fade */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          background: `linear-gradient(to bottom, transparent, ${colors.white})`,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
    </div>
  );
}
