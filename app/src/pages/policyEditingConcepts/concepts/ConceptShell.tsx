/**
 * ConceptShell - Shared wrapper for each concept prototype page
 */
import { IconChevronLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Box, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

interface ConceptShellProps {
  number: number;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function ConceptShell({ number, title, description, children }: ConceptShellProps) {
  const navigate = useNavigate();
  const countryId = useCurrentCountry();

  return (
    <Box style={{ padding: spacing.xl, maxWidth: 1400, margin: '0 auto' }}>
      <Stack gap={spacing.lg}>
        {/* Back link */}
        <UnstyledButton
          onClick={() => navigate(`/${countryId}/policy-editing-concepts`)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <IconChevronLeft size={16} color={colors.gray[500]} />
          <Text style={{ fontSize: 13, color: colors.gray[500] }}>Back to concepts</Text>
        </UnstyledButton>

        {/* Header */}
        <Group gap={spacing.md} align="center">
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: colors.primary[500],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Text fw={700} style={{ fontSize: 14, color: colors.white }}>
              {number}
            </Text>
          </Box>
          <Text fw={700} style={{ fontSize: 20, color: colors.gray[900] }}>
            {title}
          </Text>
        </Group>

        <Text style={{ fontSize: 14, color: colors.gray[600], maxWidth: 700, lineHeight: 1.6 }}>
          {description}
        </Text>

        {/* Content area */}
        <Box
          style={{
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.radius.lg,
            overflow: 'hidden',
            background: colors.white,
            minHeight: 500,
          }}
        >
          {children}
        </Box>
      </Stack>
    </Box>
  );
}
