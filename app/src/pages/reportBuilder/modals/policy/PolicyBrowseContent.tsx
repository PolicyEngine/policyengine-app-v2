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
import { Button } from '@/components/ui/button';
import { Group } from '@/components/ui/Group';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Stack } from '@/components/ui/Stack';
import { Text } from '@/components/ui/Text';
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
      borderRadius: spacing.radius.feature,
      padding: spacing.lg,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative' as const,
      overflow: 'hidden',
    },
  };

  return (
    <Stack gap="lg" style={{ height: '100%' }}>
      <div style={modalStyles.searchBar}>
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <IconSearch size={16} color={colors.gray[400]} />
          </div>
          <Input
            placeholder="Search policies by name or parameter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              borderRadius: spacing.radius.container,
              border: `1px solid ${colors.border.light}`,
              fontSize: FONT_SIZES.small,
              paddingLeft: 34,
            }}
          />
        </div>
      </div>

      <Group justify="space-between" align="center">
        <Text fw={600} style={{ fontSize: FONT_SIZES.normal, color: colors.gray[800] }}>
          {getSectionTitle()}
        </Text>
        <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
          {displayedPolicies.length} {displayedPolicies.length === 1 ? 'policy' : 'policies'}
        </Text>
      </Group>

      <ScrollArea style={{ flex: 1 }}>
        {isLoading ? (
          <Stack gap="md">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="tw:h-[80px] tw:rounded-md" />
            ))}
          </Stack>
        ) : activeSection === 'public' ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing['4xl'],
              gap: spacing.md,
            }}
          >
            <div
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
            </div>
            <Text fw={500} c={colors.gray[600]}>
              Coming soon
            </Text>
            <Text
              c="dimmed"
              style={{ textAlign: 'center', maxWidth: 300, fontSize: FONT_SIZES.small }}
            >
              Search and browse policies created by other PolicyEngine users.
            </Text>
          </div>
        ) : displayedPolicies.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: spacing['4xl'],
              gap: spacing.md,
            }}
          >
            <div
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
            </div>
            <Text fw={500} c={colors.gray[600]}>
              {searchQuery ? 'No policies match your search' : 'No policies yet'}
            </Text>
            <Text
              c="dimmed"
              style={{ textAlign: 'center', maxWidth: 300, fontSize: FONT_SIZES.small }}
            >
              {searchQuery
                ? 'Try adjusting your search terms or browse all policies'
                : 'Create your first policy to get started'}
            </Text>
            {!searchQuery && (
              <Button
                variant="outline"
                onClick={onEnterCreationMode}
                style={{ marginTop: spacing.sm }}
              >
                <IconPlus size={16} />
                Create policy
              </Button>
            )}
          </div>
        ) : (
          <div style={modalStyles.policyGrid}>
            {displayedPolicies.map((policy) => {
              const isSelected = selectedPolicyId === policy.id;
              return (
                <div
                  key={policy.id}
                  style={{
                    ...modalStyles.policyCard,
                    background: colors.white,
                    borderColor: isSelected ? colorConfig.border : colors.gray[200],
                  }}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectPolicy(policy)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectPolicy(policy);
                    }
                  }}
                >
                  <div
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
                  <Group justify="space-between" align="start" wrap="nowrap">
                    <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
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
                    <Group gap="xs" style={{ flexShrink: 0 }}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPolicyInfoClick(policy.id);
                        }}
                      >
                        <IconInfoCircle size={18} />
                      </Button>
                      <IconChevronRight size={16} color={colors.gray[400]} />
                    </Group>
                  </Group>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </Stack>
  );
}
