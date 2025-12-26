import { Box, Image, Text } from '@mantine/core';
import { colors, typography } from '@/designTokens';
import SupportedProject, { SupportedProject as SupportedProjectType } from './SupportedProject';

export interface Supporter {
  id: string;
  name: string;
  websiteUrl?: string;
  logoUrl?: string;
  description: string;
}

export interface SupporterCardProps {
  supporter: Supporter;
  projects: SupportedProjectType[];
}

export default function SupporterCard({ supporter, projects }: SupporterCardProps) {
  return (
    <Box
      style={{
        marginBottom: 48,
        padding: 24,
        border: `1px solid ${colors.border.light}`,
        borderRadius: 4,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header with logo and description */}
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        {supporter.logoUrl && (
          <a
            href={supporter.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginRight: 24 }}
          >
            <Image
              src={supporter.logoUrl}
              alt={`${supporter.name} logo`}
              w={200}
              h={80}
              fit="contain"
              style={{
                objectPosition: 'left center',
              }}
            />
          </a>
        )}
        <Text
          style={{
            margin: 0,
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.body,
            lineHeight: typography.lineHeight.relaxed,
          }}
        >
          {supporter.websiteUrl ? (
            <a
              href={supporter.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: colors.blue[700],
                fontWeight: typography.fontWeight.bold,
                textDecoration: 'none',
              }}
            >
              {supporter.name}
            </a>
          ) : (
            <span style={{ fontWeight: typography.fontWeight.bold }}>{supporter.name}</span>
          )}{' '}
          — {supporter.description}
        </Text>
      </Box>

      {/* Projects */}
      {projects.map((project, index) => (
        <SupportedProject key={index} project={project} />
      ))}
    </Box>
  );
}
