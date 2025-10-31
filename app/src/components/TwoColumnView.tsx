import { Grid, Paper, Title } from '@mantine/core';
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
    <Paper
      bg={getBackgroundColor()}
      p={spacing.container.lg}
      radius={spacing.radius.lg}
      style={{ minHeight: '400px' }}
    >
      <Title
        order={2}
        variant="colored"
        ff={typography.fontFamily.primary}
        size={typography.fontSize['3xl']}
        fw={typography.fontWeight.bold}
        c={colors.text.title}
        mb={spacing['3xl']}
        ta="left"
      >
        {title}
      </Title>
      <Grid gutter={spacing['3xl']} align="center">
        <Grid.Col span={{ base: 12, sm: 6 }}>{leftColumn}</Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>{rightColumn}</Grid.Col>
      </Grid>
    </Paper>
  );
};

export default TwoColumnView;
