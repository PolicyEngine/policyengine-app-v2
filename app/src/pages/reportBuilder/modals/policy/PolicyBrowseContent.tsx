/**
 * PolicyBrowseContent - Browse mode content (search bar + policy grid)
 */
import {
  IconChevronRight,
  IconFolder,
  IconInfoCircle,
  IconPlus,
  IconSearch,
  IconUsers,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Paper,
  ScrollArea,
  Skeleton,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { FONT_SIZES, INGREDIENT_COLORS } from '../../constants';

interface PolicyItem {
  id: string;
  associationId?: string;
  label: string;
  paramCount: number;
  createdAt?: string;
  updatedAt?: string;
}

type ActiveSection = 'my-policies' | 'public';

interface PolicyBrowseContentProps {
  displayedPolicies: PolicyItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeSection: ActiveSection;
  isLoading: boolean;
  selectedPolicyId: string | null;
  onSelectPolicy: (policy: PolicyItem) => void;
  onPolicyInfoClick: (policyId: string) => void;
  onEnterCreationMode: () => void;
  getSectionTitle: () => string;
}

export function PolicyBrowseContent({
  displayedPolicies,
  searchQuery,
  setSearchQuery,
  activeSection,
  isLoading,
  selectedPolicyId,
  onSelectPolicy,
  onPolicyInfoClick,
  onEnterCreationMode,
  getSectionTitle,
}: PolicyBrowseContentProps) {
  const colorConfig = INGREDIENT_COLORS.policy;

  const modalStyles = {
    searchBar: {
      position: 'relative' as const,
    },
    policyGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: spacing.md,
    },
    policyCard: {
      background: colors.white,
      border: `1px solid ${colors.border.light}`,
      borderRadius: spacing.radius.lg,
      padding: spacing.lg,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative' as const,
      overflow: 'hidden',
    },
  };

  return (
    <Stack gap={spacing.lg} style={{ height: '100%' }}>
      <Box style={modalStyles.searchBar}>
        <TextInput
          placeholder="Search policies by name or parameter..."
          leftSection={<IconSearch size={16} color={colors.gray[400]} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="sm"
          styles={{
            input: {
              borderRadius: spacing.radius.md,
              border: `1px solid ${colors.border.light}`,
              fontSize: FONT_SIZES.small,
            },
          }}
        />
      </Box>

      <Group justify="space-between" align="center">
        <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[800] }}>
          {getSectionTitle()}
        </Text>
        <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
          {displayedPolicies.length} {displayedPolicies.length === 1 ? 'policy' : 'policies'}
        </Text>
      </Group>

      <ScrollArea style={{ flex: 1 }} offsetScrollbars>
        {isLoading ? (
          <Stack gap={spacing.md}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={80} radius="md" />
            ))}
          </Stack>
        ) : activeSection === 'public' ? (
          <Box
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing['4xl'],
              gap: spacing.md,
            }}
          >
            <Box
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: colors.gray[100],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconUsers size={28} color={colors.gray[400]} />
            </Box>
            <Text fw={500} c={colors.gray[600]}>
              Coming soon
            </Text>
            <Text c="dimmed" ta="center" maw={300} style={{ fontSize: FONT_SIZES.small }}>
              Search and browse policies created by other PolicyEngine users.
            </Text>
          </Box>
        ) : displayedPolicies.length === 0 ? (
          <Box
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing['4xl'],
              gap: spacing.md,
            }}
          >
            <Box
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: colors.gray[100],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconFolder size={28} color={colors.gray[400]} />
            </Box>
            <Text fw={500} c={colors.gray[600]}>
              {searchQuery ? 'No policies match your search' : 'No policies yet'}
            </Text>
            <Text c="dimmed" ta="center" maw={300} style={{ fontSize: FONT_SIZES.small }}>
              {searchQuery
                ? 'Try adjusting your search terms or browse all policies'
                : 'Create your first policy to get started'}
            </Text>
            {!searchQuery && (
              <Button
                variant="outline"
                color="gray"
                leftSection={<IconPlus size={16} />}
                onClick={onEnterCreationMode}
                mt={spacing.sm}
              >
                Create policy
              </Button>
            )}
          </Box>
        ) : (
          <Box style={modalStyles.policyGrid}>
            {displayedPolicies.map((policy) => {
              const isSelected = selectedPolicyId === policy.id;
              return (
                <Paper
                  key={policy.id}
                  style={{
                    ...modalStyles.policyCard,
                    background: colors.white,
                    borderColor: isSelected ? colorConfig.border : colors.gray[200],
                  }}
                  onClick={() => onSelectPolicy(policy)}
                >
                  <Box
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: isSelected
                        ? `linear-gradient(90deg, ${colorConfig.accent}, ${colorConfig.icon})`
                        : colors.gray[200],
                      transition: 'all 0.2s ease',
                    }}
                  />
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Stack gap={spacing.xs} style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        fw={600}
                        style={{ fontSize: FONT_SIZES.normal, color: colors.gray[900] }}
                      >
                        {policy.label}
                      </Text>
                      <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
                        {policy.paramCount} param{policy.paramCount !== 1 ? 's' : ''} changed
                      </Text>
                    </Stack>
                    <Group gap={spacing.xs} style={{ flexShrink: 0 }}>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPolicyInfoClick(policy.id);
                        }}
                      >
                        <IconInfoCircle size={18} />
                      </ActionIcon>
                      <IconChevronRight size={16} color={colors.gray[400]} />
                    </Group>
                  </Group>
                </Paper>
              );
            })}
          </Box>
        )}
      </ScrollArea>
    </Stack>
  );
}
