import { Box, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

export interface SupportedProject {
  title: string;
  projectUrl?: string;
  amount: number;
  currency: 'USD' | 'GBP';
  awardDate: string; // Format: YYYY-MM
  description: string;
  supporterId: string;
}

export interface SupportedProjectProps {
  project: SupportedProject;
}

// Utility to format YYYY-MM date to "Month YYYY"
function formatDate(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function SupportedProject({ project }: SupportedProjectProps) {
  return (
    <Box
      style={{
        margin: '16px 0',
        padding: '16px',
        borderLeft: `4px solid ${colors.primary[500]}`,
        backgroundColor: colors.gray[50],
      }}
    >
      <Text
        component="h3"
        style={{
          marginTop: 0,
          marginBottom: spacing.sm,
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          fontFamily: typography.fontFamily.primary,
        }}
      >
        {project.projectUrl ? (
          <a
            href={project.projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: colors.blue[700],
              textDecoration: 'none',
            }}
          >
            {project.title}
          </a>
        ) : (
          project.title
        )}
      </Text>

      <Box
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: spacing.lg,
          marginBottom: spacing.sm,
        }}
      >
        <Text
          style={{
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.body,
          }}
        >
          <strong>Award:</strong> {project.currency === 'GBP' ? '£' : '$'}
          {project.amount.toLocaleString('en-US')}
        </Text>
        <Text
          style={{
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.body,
          }}
        >
          <strong>Date:</strong> {formatDate(project.awardDate)}
        </Text>
      </Box>

      <Text
        style={{
          fontSize: typography.fontSize.base,
          fontFamily: typography.fontFamily.body,
          lineHeight: typography.lineHeight.relaxed,
          margin: 0,
        }}
      >
        {project.description}
      </Text>
    </Box>
  );
}
