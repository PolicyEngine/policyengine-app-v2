/**
 * PolicyReproducibility - Shows Python code to reproduce society-wide/microsimulation results
 *
 * Ported from policyengine-app v1:
 * https://github.com/PolicyEngine/policyengine-app/blob/main/src/pages/policy/output/PolicyReproducibility.jsx
 */
import { useState } from 'react';
import { IconClipboard, IconClipboardCheck, IconCode, IconExternalLink } from '@tabler/icons-react';
import {
  Button,
  Group,
  Stack,
  Text,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import { useReportYear } from '@/hooks/useReportYear';
import { trackPythonCodeCopied } from '@/utils/analytics';
import { getColabLink, getReproducibilityCodeBlock } from '@/utils/reproducibilityCode';

interface PolicyData {
  baseline: { data: Record<string, any> };
  reform: { data: Record<string, any> };
}

interface PolicyReproducibilityProps {
  countryId: string;
  policy: PolicyData;
  region?: string;
  dataset?: string | null;
}

export default function PolicyReproducibility({
  countryId,
  policy,
  region = 'us',
  dataset = null,
}: PolicyReproducibilityProps) {
  const [copied, setCopied] = useState(false);
  const reportYear = useReportYear();
  const timePeriod = reportYear ? parseInt(reportYear, 10) : 2024;

  const codeLines = getReproducibilityCodeBlock(
    'policy',
    countryId,
    policy,
    region,
    timePeriod,
    dataset
  );

  const codeText = codeLines.join('\n');
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
    <div>
      <h2>Reproduce these results</h2>

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
            <Text className="tw:text-sm" style={{ color: colors.text.primary }}>
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
                    style={{ marginLeft: 3, verticalAlign: 'middle', display: 'inline' }}
                  />
                </a>
              ) : (
                'Python notebook'
              )}{' '}
              to reproduce the microsimulation results.
            </Text>
          </Group>
        </div>

        {/* Code block card */}
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
                fontSize: '13px',
                lineHeight: 1.6,
                border: 'none',
                padding: 0,
              }}
            >
              {codeText}
            </code>
          </div>
        </div>
      </Stack>
    </div>
  );
}
