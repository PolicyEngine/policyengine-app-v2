import { Box, Grid, Paper, Title } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

interface TwoColumnViewProps {
  title: string;
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
  backgroundColor?: 'primary' | 'secondary';
}

const TwoColumnView = ({ title, leftColumn, rightColumn, backgroundColor }: TwoColumnViewProps) => {
  const getBackgroundColor = () => {
    if (backgroundColor === 'primary') {
      return colors.primary[100];
    }
    if (backgroundColor === 'secondary') {
      return colors.secondary[100];
    }
    return colors.white;
  };

  return (
    <Box
      style={{
        maxWidth: 1300,
        margin: '0 auto',
        paddingTop: spacing['2xl'],
        paddingBottom: spacing['2xl'],
      }}
    >
      <Paper bg={getBackgroundColor()} radius={spacing.radius.lg} style={{ minHeight: '400px' }}>
        <Title
          variant="colored"
          ff={typography.fontFamily.primary}
          size={typography.fontSize['4xl']}
          fw={typography.fontWeight.medium}
          c={colors.text.title}
          mb={spacing['2xl']}
          ta="left"
        >
          {title}
        </Title>
        <Grid gutter={spacing['3xl']} align="center">
          <Grid.Col span={{ base: 12, sm: 6 }}>{leftColumn}</Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>{rightColumn}</Grid.Col>
        </Grid>
      </Paper>
    </Box>
  );
};

export default TwoColumnView;
