/**
 * HouseholdReproducibility - Shows Python code to reproduce household simulation results
 *
 * Ported from policyengine-app v1:
 * https://github.com/PolicyEngine/policyengine-app/blob/main/src/pages/household/output/HouseholdReproducibility.jsx
 */
import { useState } from 'react';
import { IconClipboard, IconClipboardCheck, IconCode, IconExternalLink } from '@tabler/icons-react';
import {
  Button,
  Group,
  Stack,
  Switch,
  Text,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { trackPythonCodeCopied } from '@/utils/analytics';
import {
  getColabLink,
  getHouseholdReproducibilityCode,
  getHouseholdReproductionUnavailableReason,
  type HouseholdReproduction,
} from '@/utils/reproducibilityCode';

interface HouseholdReproducibilityProps {
  countryId: string;
  year: string | null;
  simulations: HouseholdReproduction[];
}

export default function HouseholdReproducibility({
  countryId,
  year: reportYear,
  simulations,
}: HouseholdReproducibilityProps) {
  const [earningVariation, setEarningVariation] = useState(false);
  const year = reportYear && /^\d{4}$/.test(reportYear) ? Number(reportYear) : null;

  return (
    <Stack className="tw:gap-lg">
      <h2 className="tw:text-2xl tw:font-bold tw:text-gray-900">Reproduce these results</h2>
      <Text>
        When reproduction is available, run each simulation in a separate, fresh Python notebook.
        Each block uses that simulation's household, policy, resolved package versions, and SPM
        settings.
      </Text>
      <Group className="tw:gap-sm tw:items-center">
        <Text className="tw:text-sm">Include earning variation</Text>
        <Switch
          aria-label="Include earning variation"
          checked={earningVariation}
          onCheckedChange={setEarningVariation}
        />
      </Group>
      {simulations.length === 0 ? <Text>No simulations are available to reproduce.</Text> : null}
      {simulations.map((simulation) => (
        <HouseholdSimulationCode
          key={simulation.role}
          countryId={countryId}
          simulation={simulation}
          year={year}
          earningVariation={earningVariation}
        />
      ))}
    </Stack>
  );
}

function HouseholdSimulationCode({
  countryId,
  simulation,
  year,
  earningVariation,
}: {
  countryId: string;
  simulation: HouseholdReproduction;
  year: number | null;
  earningVariation: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const { policyengineVersion, modelVersion } = simulation;
  const title = simulation.role === 'baseline' ? 'Baseline simulation' : 'Reform simulation';
  const lines = getHouseholdReproducibilityCode(countryId, simulation, year, earningVariation);
  const unavailableReason = getHouseholdReproductionUnavailableReason(countryId, simulation, year);

  const codeText = lines.join('\n');
  const colabLink = getColabLink(countryId);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      trackPythonCodeCopied();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <section aria-label={title}>
      <h3 className="tw:text-xl tw:font-bold tw:text-gray-900 tw:mb-md">{title}</h3>

      <Stack className="tw:gap-lg">
        {/* Instructions card */}
        <div
          className="tw:p-lg"
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: spacing.radius.container,
            border: `1px solid ${colors.border.light}`,
          }}
        >
          <Group className="tw:gap-md tw:items-center">
            <div
              className="tw:flex tw:items-center tw:justify-center tw:shrink-0"
              style={{
                width: 36,
                height: 36,
                backgroundColor: colors.gray[100],
                borderRadius: spacing.radius.element,
              }}
            >
              <IconCode size={20} color={colors.gray[600]} stroke={1.5} />
            </div>
            <div className="tw:flex-1">
              {lines.length > 0 ? (
                <Text className="tw:text-sm tw:mb-xs" style={{ color: colors.text.primary }}>
                  Run the code below in a{' '}
                  {colabLink ? (
                    <a
                      href={colabLink}
                      target="_blank"
                      rel="noreferrer"
                      className="tw:text-primary-600 tw:hover:underline tw:text-sm"
                    >
                      Python notebook
                      <IconExternalLink
                        size={12}
                        style={{
                          marginLeft: spacing.xs,
                          verticalAlign: 'middle',
                          display: 'inline',
                        }}
                      />
                    </a>
                  ) : (
                    'Python notebook'
                  )}{' '}
                  to reproduce the results.
                </Text>
              ) : null}
              {policyengineVersion ? (
                <Text className="tw:text-sm tw:mb-xs" style={{ color: colors.text.secondary }}>
                  Resolved with policyengine.py {policyengineVersion}
                </Text>
              ) : null}
              {modelVersion ? (
                <Text className="tw:text-sm tw:mb-xs" style={{ color: colors.text.secondary }}>
                  Resolved with policyengine-{countryId} {modelVersion}
                </Text>
              ) : null}
            </div>
          </Group>
        </div>

        {lines.length === 0 ? (
          <Text role="status">{unavailableReason}</Text>
        ) : (
          <div
            className="tw:overflow-hidden"
            style={{
              backgroundColor: colors.background.primary,
              borderRadius: spacing.radius.container,
              border: `1px solid ${colors.border.light}`,
            }}
          >
            {/* Header with copy button */}
            <Group
              className="tw:justify-between tw:items-center tw:px-lg tw:py-sm"
              style={{
                borderBottom: `1px solid ${colors.border.light}`,
                backgroundColor: colors.gray[50],
              }}
            >
              <Text className="tw:text-sm" style={{ color: colors.text.secondary }}>
                Python
              </Text>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    aria-label="Copy code to clipboard"
                    className="tw:h-8 tw:w-8"
                  >
                    {copied ? (
                      <IconClipboardCheck size={16} color={colors.primary[600]} />
                    ) : (
                      <IconClipboard size={16} color={colors.text.secondary} />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {copied ? 'Copied!' : 'Copy to clipboard'}
                </TooltipContent>
              </Tooltip>
            </Group>

            {/* Code content */}
            <div className="tw:p-lg" style={{ backgroundColor: colors.white }}>
              <code
                className="tw:bg-transparent tw:block tw:text-sm tw:font-mono"
                style={{
                  whiteSpace: 'pre',
                  overflow: 'auto',
                  maxHeight: '400px',
                  fontSize: typography.fontSize.sm,
                  lineHeight: typography.lineHeight.relaxed,
                  border: 'none',
                  padding: 0,
                }}
              >
                {codeText}
              </code>
            </div>
          </div>
        )}
      </Stack>
    </section>
  );
}
