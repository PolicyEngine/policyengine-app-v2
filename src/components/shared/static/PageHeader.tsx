import { Container, Flex, Title, Text, Box } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

export interface PageHeaderProps {
  title: string;
  description: string;
}

export default function PageHeader({
  title,
  description,
}: PageHeaderProps) 
{
  return (
    <div 
      style={{
        backgroundColor: colors.background.secondary,
        display: 'flex',
        justifyContent: 'center',
        borderBottom: `1px solid ${colors.border.dark}`,
      }}
    >
      <Container 
        size="xl"
        px={{ base: spacing.container.xs, md: spacing.container.lg }}
        py={spacing['3xl']}
        style={{
          marginTop: 16,
          marginBottom: 0,
        }}
      >
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align="center"
          style={{ height: '100%' }}
          gap={{md: 0 }}
        >

          <Box w={{ base: '100%', md: 300 }}>
            <Title
              style={{
                margin: 16,
                color: colors.primary[600],
                fontSize: typography.fontSize['4xl'],
                fontWeight: typography.fontWeight.semibold,
                fontFamily: typography.fontFamily.primary,
              }}
            >
              {title}
            </Title>
          </Box>
          
          <Box
            w={{ base: '100%', md: '0.5px' }}
            h={{ base: '0.5px', md: '100%' }}
            style={{
              backgroundColor: colors.border.dark,
            }}
          />
          
          <Box 
            w={{ base: '100%', md: 800 }}
            style={{
              maxWidth: 800,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                margin: 30,
                color: colors.text.primary,
                fontSize: typography.fontSize.lg,
                lineHeight: typography.lineHeight.relaxed,
                fontFamily: typography.fontFamily.body,
                textAlign: { base: 'left', md: 'center'},
              }}
            >
              {description}
            </Text>
          </Box>
        </Flex>
      </Container>
    </div>
  );
}