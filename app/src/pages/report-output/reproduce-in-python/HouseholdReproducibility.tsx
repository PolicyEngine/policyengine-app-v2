/**
 * HouseholdReproducibility - Shows Python code to reproduce household simulation results
 *
 * Ported from policyengine-app v1:
 * https://github.com/PolicyEngine/policyengine-app/blob/main/src/pages/household/output/HouseholdReproducibility.jsx
 */
import { useState } from 'react';
import { IconClipboard, IconClipboardCheck, IconCode, IconExternalLink } from '@tabler/icons-react';
import { ActionIcon, Anchor, Box, Code, Group, Stack, Switch, Text, Tooltip } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { useReportYear } from '@/hooks/useReportYear';
import { trackPythonCodeCopied } from '@/utils/analytics';
import { getColabLink, getReproducibilityCodeBlock } from '@/utils/reproducibilityCode';

interface PolicyData {
  baseline: { data: Record<string, any> };
  reform: { data: Record<string, any> };
}

interface HouseholdReproducibilityProps {
  countryId: string;
  policy: PolicyData;
  householdInput: any;
  region?: string;
  dataset?: string | null;
}

export default function HouseholdReproducibility({
  countryId,
  policy,
  householdInput,
  region = 'us',
  dataset = null,
}: HouseholdReproducibilityProps) {
  const [earningVariation, setEarningVariation] = useState(false);
  const [copied, setCopied] = useState(false);
  const reportYear = useReportYear();
  const year = reportYear ? parseInt(reportYear, 10) : 2024;

  const lines = getReproducibilityCodeBlock(
    'household',
    countryId,
    policy,
    region,
    year,
    dataset,
    householdInput,
    earningVariation
  );

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
    <div>
      <h2>Reproduce these results</h2>

      <Stack gap={spacing.lg}>
        {/* Instructions card */}
        <Box
          p={spacing.lg}
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: spacing.radius.container,
            border: `1px solid ${colors.border.light}`,
          }}
        >
          <Group gap={spacing.md} align="center">
            <Box
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.gray[100],
                borderRadius: spacing.radius.element,
                flexShrink: 0,
              }}
            >
              <IconCode size={20} color={colors.gray[600]} stroke={1.5} />
            </Box>
            <Box style={{ flex: 1 }}>
              <Text size="sm" c={colors.text.primary} mb={spacing.xs}>
                Run the code below in a{' '}
                {colabLink ? (
                  <Anchor
                    href={colabLink}
                    target="_blank"
                    rel="noreferrer"
                    size="sm"
                    style={{ color: colors.primary[600] }}
                  >
                    Python notebook
                    <IconExternalLink
                      size={12}
                      style={{ marginLeft: 3, verticalAlign: 'middle', display: 'inline' }}
                    />
                  </Anchor>
                ) : (
                  'Python notebook'
                )}{' '}
                to reproduce the results.
              </Text>
              <Group gap={spacing.sm} align="center">
                <Text size="sm" c={colors.text.secondary}>
                  Include earning variation
                </Text>
                <Switch
                  checked={earningVariation}
                  onChange={() => setEarningVariation(!earningVariation)}
                  size="sm"
                />
              </Group>
            </Box>
          </Group>
        </Box>

        {/* Code block card */}
        <Box
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: spacing.radius.container,
            border: `1px solid ${colors.border.light}`,
            overflow: 'hidden',
          }}
        >
          {/* Header with copy button */}
          <Group
            justify="space-between"
            align="center"
            px={spacing.lg}
            py={spacing.sm}
            style={{
              borderBottom: `1px solid ${colors.border.light}`,
              backgroundColor: colors.gray[50],
            }}
          >
            <Text size="sm" c={colors.text.secondary}>
              Python
            </Text>
            <Tooltip label={copied ? 'Copied!' : 'Copy to clipboard'} position="left">
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={handleCopy}
                aria-label="Copy code to clipboard"
              >
                {copied ? (
                  <IconClipboardCheck size={16} color={colors.primary[600]} />
                ) : (
                  <IconClipboard size={16} color={colors.text.secondary} />
                )}
              </ActionIcon>
            </Tooltip>
          </Group>

          {/* Code content */}
          <Box p={spacing.lg} style={{ backgroundColor: colors.white }}>
            <Code
              block
              style={{
                whiteSpace: 'pre',
                overflow: 'auto',
                maxHeight: '400px',
                fontSize: '13px',
                lineHeight: 1.6,
                backgroundColor: 'transparent',
                border: 'none',
                padding: 0,
              }}
            >
              {codeText}
            </Code>
          </Box>
        </Box>
      </Stack>
    </div>
  );
}
