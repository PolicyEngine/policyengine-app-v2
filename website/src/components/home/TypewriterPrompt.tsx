"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";

export interface PromptData {
  text: string;
  winnerPct: number; // fraction of households that gain
  loserPct: number; // fraction that lose (remainder are unaffected)
}

// Winner/loser shares are computed against the PolicyEngine 2026 baseline by
// the policyengine-prompt-impacts package. Regenerate via:
//   policyengine-prompt-impacts run --country all --tsx prompts.tsx
// See https://github.com/PolicyEngine/policyengine-prompt-impacts.
const UK_PROMPTS: PromptData[] = [
  {
    text: "the impact of raising the basic rate to 25p",
    winnerPct: 0,
    loserPct: 0.71,
  },
  {
    text: "the poverty impact of a £40/week universal child benefit",
    winnerPct: 0.23,
    loserPct: 0,
  },
  {
    text: "who loses from abolishing the personal allowance",
    winnerPct: 0,
    loserPct: 0.88,
  },
  {
    text: "revenue from a 50p additional rate",
    winnerPct: 0,
    loserPct: 0.02,
  },
  {
    text: "how removing the benefit cap affects single parents",
    winnerPct: 0.009,
    loserPct: 0,
  },
  {
    text: "the poverty impact of cutting the UC standard allowance by £10/week",
    winnerPct: 0,
    loserPct: 0.19,
  },
  {
    text: "how reducing the UC taper rate to 45% affects workers",
    winnerPct: 0.09,
    loserPct: 0,
  },
  {
    text: "who loses from a 5% cut to the state pension",
    winnerPct: 0,
    loserPct: 0.25,
  },
  {
    text: "how raising NI thresholds affects low-income workers",
    winnerPct: 0.55,
    loserPct: 0,
  },
  {
    text: "who gains from doubling the UC work allowance",
    winnerPct: 0.07,
    loserPct: 0,
  },
  {
    text: "the poverty impact of a £25/week child benefit increase",
    winnerPct: 0.23,
    loserPct: 0,
  },
  {
    text: "the cost of doubling child benefit",
    winnerPct: 0.23,
    loserPct: 0,
  },
  {
    text: "how raising the higher rate threshold affects middle earners",
    winnerPct: 0.18,
    loserPct: 0,
  },
  {
    text: "who loses from lowering the higher rate threshold to £40,000",
    winnerPct: 0,
    loserPct: 0.28,
  },
  {
    text: "how doubling the marriage allowance affects couples",
    winnerPct: 0.08,
    loserPct: 0,
  },
  {
    text: "the impact of lowering the additional rate threshold",
    winnerPct: 0,
    loserPct: 0.03,
  },
];

const US_PROMPTS: PromptData[] = [
  {
    text: "how tripling the standard deduction affects median income",
    winnerPct: 0.62,
    loserPct: 0,
  },
  {
    text: "the poverty impact of expanding the Child Tax Credit",
    winnerPct: 0.14,
    loserPct: 0,
  },
  {
    text: "the distributional impact of expanding the EITC",
    winnerPct: 0.14,
    loserPct: 0,
  },
  {
    text: "the distributional impact of removing the SALT cap",
    winnerPct: 0.02,
    loserPct: 0,
  },
  {
    text: "the cost of making the Child Tax Credit fully refundable",
    winnerPct: 0.09,
    loserPct: 0,
  },
  {
    text: "the poverty impact of doubling SNAP benefits",
    winnerPct: 0.16,
    loserPct: 0,
  },
  {
    text: "the impact of raising all income tax rates by 5 points",
    winnerPct: 0,
    loserPct: 0.63,
  },
  {
    text: "who pays more from eliminating the payroll tax cap",
    winnerPct: 0,
    loserPct: 0.04,
  },
  {
    text: "how raising the top rate to 45% affects revenue",
    winnerPct: 0,
    loserPct: 0.008,
  },
  {
    text: "who benefits from doubling the Child and Dependent Care Credit",
    winnerPct: 0.03,
    loserPct: 0,
  },
  {
    text: "how raising SSI benefits by 25% affects poverty",
    winnerPct: 0.04,
    loserPct: 0,
  },
  {
    text: "the revenue from lowering the SALT cap to $10,000",
    winnerPct: 0,
    loserPct: 0.06,
  },
  {
    text: "the impact of restoring the expanded Child Tax Credit",
    winnerPct: 0.1,
    loserPct: 0,
  },
  {
    text: "who benefits from the senior bonus deduction",
    winnerPct: 0.13,
    loserPct: 0,
  },
  {
    text: "who benefits from the no-tax-on-tips deduction",
    winnerPct: 0.004,
    loserPct: 0,
  },
];

// Inject cursor blink keyframes once into document head
function ensureCursorBlinkStyle() {
  if (
    typeof document !== "undefined" &&
    !document.querySelector("[data-cursor-blink]")
  ) {
    const style = document.createElement("style");
    style.setAttribute("data-cursor-blink", "");
    style.textContent = `@keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`;
    document.head.appendChild(style);
  }
}

const TYPE_SPEED = 28; // ms per character
const DELETE_SPEED = 18; // ms per character (faster)
const PAUSE_AFTER_TYPE = 2400; // ms to hold after finishing typing
const PAUSE_AFTER_DELETE = 350; // ms pause before typing next

interface TypewriterPromptProps {
  countryId: string;
  onPromptComplete: (promptIndex: number, distribution: PromptData) => void;
  onPromptClearing: () => void;
}

export default function TypewriterPrompt({
  countryId,
  onPromptComplete,
  onPromptClearing,
}: TypewriterPromptProps) {
  useEffect(ensureCursorBlinkStyle, []);

  const prompts = countryId === "uk" ? UK_PROMPTS : US_PROMPTS;
  const [displayText, setDisplayText] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "deleting" | "pausing">(
    "typing",
  );
  const charIndex = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const currentPromptData = prompts[promptIndex % prompts.length];
  const currentPrompt = currentPromptData.text;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, []);

  // Typing phase
  useEffect(() => {
    if (phase !== "typing") {
      return;
    }
    if (charIndex.current >= currentPrompt.length) {
      // Done typing, hold and show impact
      onPromptComplete(promptIndex, currentPromptData);
      timerRef.current = setTimeout(() => {
        setPhase("deleting");
        onPromptClearing();
      }, PAUSE_AFTER_TYPE);
      return clearTimer;
    }
    timerRef.current = setTimeout(() => {
      charIndex.current += 1;
      setDisplayText(currentPrompt.slice(0, charIndex.current));
    }, TYPE_SPEED);
    return clearTimer;
  }, [
    phase,
    displayText,
    currentPrompt,
    currentPromptData,
    promptIndex,
    onPromptComplete,
    onPromptClearing,
    clearTimer,
  ]);

  // Deleting phase
  useEffect(() => {
    if (phase !== "deleting") {
      return;
    }
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

  // Pausing phase (between prompts)
  useEffect(() => {
    if (phase !== "pausing") {
      return;
    }
    timerRef.current = setTimeout(() => {
      setPromptIndex((prev) => (prev + 1) % prompts.length);
      charIndex.current = 0;
      setDisplayText("");
      setPhase("typing");
    }, PAUSE_AFTER_DELETE);
    return clearTimer;
  }, [phase, clearTimer, prompts.length]);

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        textAlign: "center",
        padding: `0 ${spacing.lg}`,
      }}
    >
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
    </div>
  );
}
