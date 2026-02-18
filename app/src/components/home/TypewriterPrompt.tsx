import { useCallback, useEffect, useRef, useState } from 'react';
import { colors, spacing, typography } from '@/designTokens';

export interface PromptData {
  text: string;
  winnerPct: number; // fraction of households that gain
  loserPct: number; // fraction that lose (remainder are unaffected)
}

const UK_PROMPTS: PromptData[] = [
  { text: 'the impact of raising the basic rate to 25p', winnerPct: 0, loserPct: 0.65 },
  { text: 'how a £2,000 UBI would affect child poverty', winnerPct: 0.75, loserPct: 0.2 },
  { text: 'who gains from abolishing the personal allowance', winnerPct: 0, loserPct: 0.85 },
  { text: 'revenue from a 50p additional rate', winnerPct: 0, loserPct: 0.02 },
  { text: 'how removing the benefit cap affects single parents', winnerPct: 0.05, loserPct: 0 },
  { text: 'whether Universal Credit cuts push families into poverty', winnerPct: 0, loserPct: 0.3 },
  { text: 'how flat tax at 30% compares to the current system', winnerPct: 0.35, loserPct: 0.45 },
  { text: 'who loses from means-testing the state pension', winnerPct: 0, loserPct: 0.4 },
  { text: 'how raising NI thresholds affects low-income workers', winnerPct: 0.45, loserPct: 0 },
  { text: 'the marginal tax rate cliff at Universal Credit taper', winnerPct: 0, loserPct: 0.15 },
  { text: 'the poverty impact of a £25/week child benefit increase', winnerPct: 0.35, loserPct: 0 },
  {
    text: 'how scrapping the two-child limit affects large families',
    winnerPct: 0.08,
    loserPct: 0,
  },
  { text: 'the cost of a citizens pension at £200/week', winnerPct: 0.55, loserPct: 0.3 },
  { text: 'who benefits from tapering the higher rate threshold', winnerPct: 0, loserPct: 0.15 },
  { text: 'how doubling the marriage allowance affects couples', winnerPct: 0.12, loserPct: 0 },
  { text: 'the impact of lowering the additional rate threshold', winnerPct: 0, loserPct: 0.05 },
];

const US_PROMPTS: PromptData[] = [
  {
    text: 'how tripling the standard deduction affects median income',
    winnerPct: 0.7,
    loserPct: 0,
  },
  { text: 'the poverty impact of expanding the Child Tax Credit', winnerPct: 0.35, loserPct: 0 },
  { text: 'the distributional impact of expanding the EITC', winnerPct: 0.3, loserPct: 0 },
  { text: 'the impact of removing the SALT cap on high earners', winnerPct: 0.15, loserPct: 0 },
  { text: 'the cost of a negative income tax at $15,000', winnerPct: 0.6, loserPct: 0.35 },
  { text: 'the poverty impact of doubling SNAP benefits', winnerPct: 0.2, loserPct: 0 },
  { text: 'how a flat tax at 25% compares to the current system', winnerPct: 0.4, loserPct: 0.4 },
  { text: 'who pays more from eliminating the payroll tax cap', winnerPct: 0, loserPct: 0.06 },
  { text: 'how raising the top rate to 45% affects revenue', winnerPct: 0, loserPct: 0.03 },
  { text: 'who benefits from expanding the child care credit', winnerPct: 0.25, loserPct: 0 },
  { text: 'the poverty impact of a $300/month child allowance', winnerPct: 0.4, loserPct: 0 },
  {
    text: 'how capping itemized deductions at $50,000 affects revenue',
    winnerPct: 0,
    loserPct: 0.12,
  },
  { text: 'the impact of restoring the expanded CTC permanently', winnerPct: 0.35, loserPct: 0 },
  {
    text: 'how lowering the Social Security retirement age affects benefits',
    winnerPct: 0.3,
    loserPct: 0,
  },
  { text: 'the impact of making the TCJA provisions permanent', winnerPct: 0.6, loserPct: 0.05 },
];

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
  const prompts = countryId === 'uk' ? UK_PROMPTS : US_PROMPTS;
  const [displayText, setDisplayText] = useState('');
  const [promptIndex, setPromptIndex] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'holding' | 'deleting' | 'pausing'>('typing');
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
    if (phase !== 'typing') {
      return;
    }
    if (charIndex.current >= currentPrompt.length) {
      // Done typing, hold and show impact
      onPromptComplete(promptIndex, currentPromptData);
      timerRef.current = setTimeout(() => {
        setPhase('deleting');
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
    if (phase !== 'deleting') {
      return;
    }
    if (charIndex.current <= 0) {
      setPhase('pausing');
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
    if (phase !== 'pausing') {
      return;
    }
    timerRef.current = setTimeout(() => {
      setPromptIndex((prev) => (prev + 1) % prompts.length);
      charIndex.current = 0;
      setDisplayText('');
      setPhase('typing');
    }, PAUSE_AFTER_DELETE);
    return clearTimer;
  }, [phase, clearTimer]);

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        padding: `0 ${spacing.lg}`,
      }}
    >
      <div
        style={{
          display: 'inline-block',
          background: `${colors.white}e6`,
          backdropFilter: 'blur(8px)',
          borderRadius: spacing.radius.lg,
          padding: `${spacing['2xl']} ${spacing['3xl']}`,
          boxShadow: `0 1px 3px ${colors.shadow.light}`,
          border: `1px solid ${colors.border.light}`,
          maxWidth: 700,
        }}
      >
        <span
          style={{
            fontFamily: typography.fontFamily.mono,
            fontSize: 'clamp(14px, 2.5vw, 20px)',
            fontWeight: typography.fontWeight.medium,
            color: colors.text.secondary,
          }}
        >
          compute:{' '}
        </span>
        <span
          style={{
            fontFamily: typography.fontFamily.mono,
            fontSize: 'clamp(14px, 2.5vw, 20px)',
            fontWeight: typography.fontWeight.medium,
            fontStyle: 'italic',
            color: colors.primary[700],
          }}
        >
          {displayText}
        </span>
        <span
          style={{
            display: 'inline-block',
            width: 2,
            height: '1.2em',
            backgroundColor: colors.primary[500],
            marginLeft: 2,
            verticalAlign: 'text-bottom',
            animation: 'cursorBlink 1s step-end infinite',
          }}
        />
        <style>{`
          @keyframes cursorBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}
