import { Box, Container, Title, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import StaticPageLayout from './StaticPageLayout';

export interface LegalSection {
  heading: string;
  content: React.ReactNode;
}

export interface LegalPageLayoutProps {
  title: string;
  sections: LegalSection[];
}

export default function LegalPageLayout({ title, sections }: LegalPageLayoutProps) {
  return (
    <StaticPageLayout title={title}>
      <Box
        py={spacing['4xl']}
        style={{
          backgroundColor: colors.white,
          paddingLeft: '6.125%',
          paddingRight: '6.125%',
        }}
      >
        <Container size="md" px={0}>
          <Title
            order={1}
            mb={spacing['3xl']}
            style={{
              fontSize: typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.semibold,
              fontFamily: typography.fontFamily.primary,
              color: colors.text.primary,
            }}
          >
            {title}
          </Title>

          {sections.map((section, index) => (
            <Box key={index} mb={spacing['2xl']}>
              <Title
                order={2}
                mb={spacing.lg}
                style={{
                  fontSize: typography.fontSize['2xl'],
                  fontWeight: typography.fontWeight.semibold,
                  fontFamily: typography.fontFamily.primary,
                  color: colors.text.primary,
                }}
              >
                {section.heading}
              </Title>

              <Box
                className="legal-content"
                style={{
                  fontSize: typography.fontSize.base,
                  lineHeight: typography.lineHeight.relaxed,
                  fontFamily: typography.fontFamily.body,
                  color: colors.text.secondary,
                }}
              >
                <style>{`
                  .legal-content p {
                    margin-bottom: ${spacing.md};
                    margin-top: 0;
                  }
                  .legal-content p:last-child {
                    margin-bottom: 0;
                  }
                  .legal-content strong,
                  .legal-content b {
                    font-weight: ${typography.fontWeight.semibold};
                    color: ${colors.text.primary};
                  }
                  .legal-content a {
                    color: ${colors.primary[600]};
                    text-decoration: underline;
                  }
                  .legal-content a:hover {
                    color: ${colors.primary[700]};
                  }
                  .legal-content ul,
                  .legal-content ol {
                    margin-bottom: ${spacing.md};
                    margin-top: ${spacing.sm};
                    padding-left: ${spacing.xl};
                  }
                  .legal-content li {
                    margin-bottom: ${spacing.xs};
                  }
                `}</style>
                {section.content}
              </Box>
            </Box>
          ))}
        </Container>
      </Box>
    </StaticPageLayout>
  );
}
