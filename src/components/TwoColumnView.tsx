import { Grid, Title } from '@mantine/core';
import { colors, typography, spacing } from '../designTokens';

interface TwoColumnViewProps {
    title: string;
    leftColumn: React.ReactNode;
    rightColumn: React.ReactNode;
    backgroundColor?: 'white' | 'dark_green' | 'light_gray';
}

const TwoColumnView = ({ title, leftColumn, rightColumn, backgroundColor = 'white' }: TwoColumnViewProps) => {
    const getBackgroundColor = () => {
        switch (backgroundColor) {
            case 'dark_green':
                return colors.primary[700];
            case 'light_gray':
                return colors.gray[100];
            default:
                return colors.white;
        }
    };

    return (
        <div 
            style={{ 
                backgroundColor: getBackgroundColor(),
                padding: spacing.container.lg,
                borderRadius: spacing.radius.lg,
                minHeight: '400px',
            }}
        >
            <Title 
                order={2} 
                variant="colored"
                style={{
                    fontFamily: typography.fontFamily.primary,
                    fontSize: typography.fontSize['3xl'],
                    fontWeight: typography.fontWeight.bold,
                    color: colors.text.title,
                    marginBottom: spacing['3xl'],
                    textAlign: 'left'
                }}
            >
                {title}
            </Title>
            <Grid gutter={spacing['3xl']} align="center">
                <Grid.Col span={6}>
                    {leftColumn}
                </Grid.Col>
                <Grid.Col span={6}>
                    {rightColumn}
                </Grid.Col>
            </Grid>
        </div>
    );
};

export default TwoColumnView;