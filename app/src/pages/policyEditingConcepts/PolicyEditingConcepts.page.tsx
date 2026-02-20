/**
 * PolicyEditingConcepts hub page - Grid of 5 concept cards
 */
import {
  IconArrowRight,
  IconColumns,
  IconCopy,
  IconGitFork,
  IconLayoutList,
  IconPencil,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Box, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

const CONCEPTS = [
  {
    id: '1-fork-and-edit',
    number: 1,
    title: 'Fork & edit',
    description:
      'Browse grid with a "Fork" action on each policy card. Clicking enters creation mode pre-populated with that policy\'s parameters.',
    icon: IconGitFork,
  },
  {
    id: '2-inline-drawer-edit',
    number: 2,
    title: 'Inline drawer edit',
    description:
      'Policy detail panel with per-row edit buttons. Click the pencil on any parameter to edit its value inline.',
    icon: IconPencil,
  },
  {
    id: '3-split-pane-comparison',
    number: 3,
    title: 'Split-pane comparison',
    description:
      'Side-by-side view: original policy (read-only) vs. modified version with diff indicators.',
    icon: IconColumns,
  },
  {
    id: '4-duplicate-summary',
    number: 4,
    title: 'Duplicate with summary',
    description:
      'Three-step flow: browse → full summary overlay → editor. Orientation step before editing.',
    icon: IconCopy,
  },
  {
    id: '5-tabbed-detail-view',
    number: 5,
    title: 'Tabbed detail view',
    description:
      'Sidebar with parameter tree + tabbed main area (Overview, Edit, History) for a comprehensive view.',
    icon: IconLayoutList,
  },
  {
    id: '6-live-parameter-editor',
    number: 6,
    title: 'Live parameter editor',
    description:
      'Full-page reproduction of the policy creation modal using the real components wired to live Redux metadata.',
    icon: IconPlayerPlay,
  },
];

export default function PolicyEditingConceptsPage() {
  const navigate = useNavigate();
  const countryId = useCurrentCountry();

  return (
    <Box style={{ padding: spacing.xl, maxWidth: 1200, margin: '0 auto' }}>
      <Stack gap={spacing.xl}>
        <Stack gap={spacing.xs}>
          <Text fw={700} style={{ fontSize: 24, color: colors.gray[900] }}>
            Policy editing concepts
          </Text>
          <Text style={{ fontSize: 14, color: colors.gray[500], maxWidth: 600 }}>
            Five approaches for integrating policy editing into the browse modal. Each concept is an
            interactive prototype with sample data.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={spacing.lg}>
          {CONCEPTS.map((concept) => {
            const Icon = concept.icon;
            return (
              <Paper
                key={concept.id}
                style={{
                  border: `1px solid ${colors.border.light}`,
                  borderRadius: spacing.radius.lg,
                  padding: spacing.lg,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onClick={() => navigate(`/${countryId}/policy-editing-concepts/${concept.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.primary[300];
                  e.currentTarget.style.boxShadow = `0 2px 8px ${colors.primary[50]}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border.light;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Top accent bar */}
                <Box
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${colors.primary[400]}, ${colors.primary[600]})`,
                  }}
                />

                <Stack gap={spacing.md}>
                  <Group justify="space-between" align="center">
                    <Group gap={spacing.sm}>
                      <Box
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: colors.primary[50],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text fw={700} style={{ fontSize: 12, color: colors.primary[700] }}>
                          {concept.number}
                        </Text>
                      </Box>
                      <Icon size={18} color={colors.primary[500]} />
                    </Group>
                    <IconArrowRight size={16} color={colors.gray[400]} />
                  </Group>

                  <Text fw={600} style={{ fontSize: 15, color: colors.gray[900] }}>
                    {concept.title}
                  </Text>

                  <Text style={{ fontSize: 13, color: colors.gray[500], lineHeight: 1.5 }}>
                    {concept.description}
                  </Text>
                </Stack>
              </Paper>
            );
          })}
        </SimpleGrid>
      </Stack>
    </Box>
  );
}
