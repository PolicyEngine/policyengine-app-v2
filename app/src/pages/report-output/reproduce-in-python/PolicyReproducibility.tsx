/**
 * PolicyReproducibility - Shows Python code to reproduce society-wide/microsimulation results
 *
 * Ported from policyengine-app v1:
 * https://github.com/PolicyEngine/policyengine-app/blob/main/src/pages/policy/output/PolicyReproducibility.jsx
 */
import { useState } from 'react';
import { IconClipboard, IconClipboardCheck, IconCode, IconExternalLink } from '@tabler/icons-react';
import { ActionIcon, Anchor, Box, Code, Group, Stack, Text, Tooltip } from '@mantine/core';
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
            <Text size="sm" c={colors.text.primary}>
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
              to reproduce the microsimulation results.
            </Text>
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
