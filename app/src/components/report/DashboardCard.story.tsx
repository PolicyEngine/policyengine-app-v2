import type { Meta, StoryObj } from '@storybook/react';
import { IconCoin, IconScale, IconUsers } from '@tabler/icons-react';
import { Group, Text } from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import DashboardCard from './DashboardCard';
import MetricCard from './MetricCard';

function CardHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Group gap="sm" wrap="nowrap">
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: spacing.radius.element,
          backgroundColor: colors.primary[50],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.primary[600],
        }}
      >
        {icon}
      </div>
      <Text
        fw={600}
        style={{
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Group>
  );
}

const meta: Meta<typeof DashboardCard> = {
  title: 'Report output/DashboardCard',
  component: DashboardCard,
  decorators: [
    (Story) => (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
          padding: 24,
          maxWidth: 900,
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DashboardCard>;

export const Shrunken: Story = {
  args: {
    mode: 'shrunken',
    zIndex: 1,
    expandDirection: 'down-right',
    shrunkenHeader: <CardHeader icon={<IconCoin size={20} />} label="Budgetary impact" />,
    shrunkenBody: <MetricCard label="Net cost" value="-$2.1B" trend="negative" hero />,
    expandedContent: <div>Expanded budgetary charts</div>,
    onToggleMode: () => {},
  },
};

export const WithColSpan: Story = {
  args: {
    mode: 'shrunken',
    zIndex: 1,
    expandDirection: 'down-right',
    colSpan: 2,
    shrunkenHeader: (
      <CardHeader icon={<IconUsers size={20} />} label="Congressional district impact" />
    ),
    shrunkenBody: <Text c={colors.text.secondary}>Map and rankings displayed here</Text>,
    expandedContent: <div>Expanded map view</div>,
    onToggleMode: () => {},
  },
};

export const CustomBackground: Story = {
  args: {
    mode: 'shrunken',
    zIndex: 1,
    expandDirection: 'down-left',
    shrunkenBackground: colors.primary[50],
    shrunkenBorderColor: colors.primary[200],
    shrunkenHeader: <CardHeader icon={<IconScale size={20} />} label="Inequality" />,
    shrunkenBody: (
      <Group gap="sm" grow>
        <MetricCard label="Gini index" value="-0.2%" trend="positive" centered />
        <MetricCard label="Top 10%" value="-0.5%" trend="positive" centered />
      </Group>
    ),
    expandedContent: <div>Expanded inequality charts</div>,
    onToggleMode: () => {},
  },
};
