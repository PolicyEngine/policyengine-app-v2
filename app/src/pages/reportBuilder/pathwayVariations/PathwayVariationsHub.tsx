/**
 * PathwayVariationsHub - Landing page linking to all 5 pathway design variations
 */

import { Box, Group, Paper, Text, Stack, Badge, SimpleGrid } from '@mantine/core';
import { Link } from 'react-router-dom';
import {
  IconNumbers,
  IconArrowNarrowDown,
  IconTimeline,
  IconChecklist,
  IconFocus2,
  IconExternalLink,
  IconRefresh,
} from '@tabler/icons-react';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { colors, spacing, typography } from '@/designTokens';

interface VariationCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  keyChanges: string[];
  path: string;
  colorConfig: { primary: string; light: string };
}

function VariationCard({ icon, title, description, keyChanges, path, colorConfig }: VariationCardProps) {
  const countryId = useCurrentCountry();

  return (
    <Paper
      component={Link}
      to={`/${countryId}/${path}`}
      style={{
        padding: spacing.xl,
        borderRadius: spacing.radius.xl,
        background: colors.white,
        border: `1px solid ${colors.border.light}`,
        textDecoration: 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'block',
        position: 'relative',
        overflow: 'hidden',
      }}
      styles={{
        root: {
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 12px 40px ${colorConfig.primary}20`,
            borderColor: colorConfig.primary,
          },
        },
      }}
    >
      {/* Gradient accent */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${colorConfig.primary}, ${colorConfig.light})`,
        }}
      />

      <Group gap={spacing.md} mb={spacing.md}>
        <Box
          style={{
            width: 48,
            height: 48,
            borderRadius: spacing.radius.lg,
            background: colorConfig.light,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colorConfig.primary,
          }}
        >
          {icon}
        </Box>
        <Box style={{ flex: 1 }}>
          <Text
            fw={700}
            size="lg"
            c={colors.gray[900]}
            style={{ fontFamily: typography.fontFamily.primary }}
          >
            {title}
          </Text>
        </Box>
        <IconExternalLink size={18} color={colors.gray[400]} />
      </Group>

      <Text size="sm" c={colors.gray[600]} mb={spacing.md}>
        {description}
      </Text>

      <Box>
        <Text
          size="xs"
          fw={600}
          c={colors.gray[500]}
          mb={spacing.xs}
          style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          Key changes
        </Text>
        <Stack gap={4}>
          {keyChanges.map((change, i) => (
            <Group key={i} gap={spacing.xs}>
              <Box
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: colorConfig.primary,
                }}
              />
              <Text size="xs" c={colors.gray[600]}>
                {change}
              </Text>
            </Group>
          ))}
        </Stack>
      </Box>
    </Paper>
  );
}

export function PathwayVariationsHub() {
  const variations = [
    {
      icon: <IconNumbers size={24} />,
      title: 'Numbered steps',
      description: 'Adds numbered badges and breadcrumb progress to make the sequential nature clear.',
      keyChanges: [
        'Step badges (1, 2, 3) on each section',
        'Horizontal breadcrumb progress bar',
        '"Start here" callout on current step',
      ],
      path: 'report-builder/variants/numbered-steps',
      colorConfig: { primary: colors.secondary[500], light: colors.secondary[50] },
    },
    {
      icon: <IconArrowNarrowDown size={24} />,
      title: 'Guided funnel',
      description: 'Vertical funnel layout with connecting arrows emphasizing the flow.',
      keyChanges: [
        'Vertical funnel with narrowing steps',
        'Animated connecting arrows',
        'Large "NEXT STEP" indicator',
      ],
      path: 'report-builder/variants/guided-funnel',
      colorConfig: { primary: colors.primary[500], light: colors.primary[50] },
    },
    {
      icon: <IconTimeline size={24} />,
      title: 'Timeline',
      description: 'Horizontal timeline with milestone markers showing where you are in the process.',
      keyChanges: [
        'Prominent horizontal timeline',
        'Milestone markers with icons',
        'Progress line fills as you complete',
      ],
      path: 'report-builder/variants/timeline',
      colorConfig: { primary: '#6366f1', light: '#eef2ff' },
    },
    {
      icon: <IconChecklist size={24} />,
      title: 'Checklist',
      description: 'Clear checklist with sidebar navigation and progress percentage tracking.',
      keyChanges: [
        'Left sidebar checklist',
        'Progress percentage bar',
        'Main content shows current step only',
      ],
      path: 'report-builder/variants/checklist',
      colorConfig: { primary: '#10b981', light: '#d1fae5' },
    },
    {
      icon: <IconFocus2 size={24} />,
      title: 'Focused flow',
      description: 'Progressive disclosure showing only the current step prominently.',
      keyChanges: [
        'Only current step fully visible',
        'Completed steps collapsed',
        'Upcoming steps blurred/locked',
      ],
      path: 'report-builder/variants/focused-flow',
      colorConfig: { primary: '#f59e0b', light: '#fef3c7' },
    },
    {
      icon: <IconRefresh size={24} />,
      title: 'Report configuration',
      description: 'A re-run oriented view for modifying and re-running existing reports with small tweaks.',
      keyChanges: [
        'Pre-filled from previous report run',
        'Edit icons on each configured ingredient',
        '"Re-run" button instead of "Run"',
      ],
      path: 'report-builder/variants/report-config',
      colorConfig: { primary: colors.primary[600], light: colors.primary[50] },
    },
  ];

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: `
          radial-gradient(ellipse at 20% 0%, ${colors.primary[50]}80 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, ${colors.secondary[50]}60 0%, transparent 50%),
          ${colors.gray[50]}
        `,
        padding: `${spacing['2xl']} ${spacing['3xl']}`,
      }}
    >
      {/* Header */}
      <Box style={{ maxWidth: 900, margin: '0 auto', marginBottom: spacing['3xl'] }}>
        <Badge
          size="lg"
          variant="light"
          color="teal"
          mb={spacing.md}
          style={{ fontFamily: typography.fontFamily.primary }}
        >
          Design exploration
        </Badge>
        <Text
          style={{
            fontFamily: typography.fontFamily.primary,
            fontSize: '36px',
            fontWeight: 700,
            color: colors.gray[900],
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          Pathway design variations
        </Text>
        <Text size="lg" c={colors.gray[600]} mt={spacing.md} style={{ maxWidth: 600 }}>
          Five visual experiments exploring how to make the report builder setup flow clearer.
          Each preserves 75-85% of the current design while adding pathway guidance improvements.
        </Text>
      </Box>

      {/* Variation cards */}
      <Box style={{ maxWidth: 1200, margin: '0 auto' }}>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={spacing.xl}>
          {variations.map((variation) => (
            <VariationCard key={variation.path} {...variation} />
          ))}
        </SimpleGrid>
      </Box>

      {/* Footer note */}
      <Box
        style={{
          maxWidth: 600,
          margin: '0 auto',
          marginTop: spacing['3xl'],
          padding: spacing.xl,
          borderRadius: spacing.radius.xl,
          background: colors.white,
          border: `1px solid ${colors.border.light}`,
          textAlign: 'center',
        }}
      >
        <Text size="sm" c={colors.gray[600]}>
          <strong>Note:</strong> These are static mockups demonstrating visual approaches.
          The actual report builder functionality is available at{' '}
          <Text component="span" c={colors.primary[600]} fw={500}>
            /report-builder
          </Text>
        </Text>
      </Box>
    </Box>
  );
}
