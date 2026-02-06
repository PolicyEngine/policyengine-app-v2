import { useCallback, useEffect, useRef, useState } from 'react';
import { colors, spacing, typography } from '@/designTokens';

const UK_PROMPTS = [
  'the impact of raising the basic rate to 25p',
  'how a £2,000 UBI would affect child poverty',
  'who gains from abolishing the personal allowance',
  'the cost of extending free school meals to all children',
  'revenue from a 50p additional rate',
  'how removing the benefit cap affects single parents',
  'whether Universal Credit cuts push families into poverty',
  'how flat tax at 30% compares to the current system',
  'who loses from means-testing the state pension',
  'how raising NI thresholds affects low-income workers',
  'revenue from equalising capital gains and income tax',
  'how a land value tax would affect homeowners',
  'the marginal tax rate cliff at Universal Credit taper',
  'the impact of raising corporation tax to 28%',
  'the poverty impact of a £25/week child benefit increase',
  'how scrapping the two-child limit affects large families',
  'the cost of a citizens pension at £200/week',
  'who benefits from tapering the higher rate threshold',
  'the distributional impact of council tax reform',
  'how raising the inheritance tax threshold affects wealth',
];

const US_PROMPTS = [
  'how tripling the standard deduction affects median income',
  'the poverty impact of expanding the Child Tax Credit',
  'the distributional impact of expanding the EITC',
  'the impact of removing the SALT cap on high earners',
  'the cost of a negative income tax at $15,000',
  'the poverty impact of doubling SNAP benefits',
  'how a flat tax at 25% compares to the current system',
  'who gains from eliminating the payroll tax cap',
  'the impact of a $15/hour minimum wage on poverty',
  'how raising the top rate to 45% affects revenue',
  'the cost of universal pre-K funded by income tax',
  'who benefits from expanding the child care credit',
  'the distributional impact of eliminating step-up in basis',
  'how a carbon tax rebate would affect low-income households',
  'the revenue impact of taxing capital gains at death',
  'who loses from phasing out the mortgage interest deduction',
  'the poverty impact of a $300/month child allowance',
  'how capping itemized deductions at $50,000 affects revenue',
  'the impact of restoring the expanded CTC permanently',
  'who benefits from raising the estate tax exemption',
];

const TYPE_SPEED = 28; // ms per character
const DELETE_SPEED = 18; // ms per character (faster)
const PAUSE_AFTER_TYPE = 2400; // ms to hold after finishing typing
const PAUSE_AFTER_DELETE = 350; // ms pause before typing next

interface TypewriterPromptProps {
  countryId: string;
  onPromptComplete: (promptIndex: number) => void;
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

  const currentPrompt = prompts[promptIndex % prompts.length];

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
      onPromptComplete(promptIndex);
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
