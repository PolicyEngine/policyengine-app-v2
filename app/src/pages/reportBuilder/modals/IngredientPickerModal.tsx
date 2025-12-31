import { useState, Fragment } from 'react';
import {
  Box,
  Group,
  Text,
  Modal,
  Stack,
  Paper,
  Divider,
  ScrollArea,
  Button,
  ActionIcon,
  Tooltip,
  Loader,
} from '@mantine/core';
import {
  IconPlus,
  IconScale,
  IconUsers,
  IconChartLine,
  IconHome,
  IconChevronRight,
  IconInfoCircle,
  IconSparkles,
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { colors, spacing } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { PolicyStateProps, PopulationStateProps } from '@/types/pathwayState';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { MOCK_USER_ID } from '@/constants';
import { RootState } from '@/store';
import { getHierarchicalLabels, formatLabelParts } from '@/utils/parameterLabels';
import { formatParameterValue } from '@/utils/policyTableHelpers';
import { formatPeriod } from '@/utils/dateUtils';
import { countPolicyModifications } from '@/utils/countParameterChanges';
import { FONT_SIZES, INGREDIENT_COLORS, COUNTRY_CONFIG } from '../constants';
import { IngredientType } from '../types';
import { CountryMapIcon } from '../components/shared/CountryMapIcon';

interface IngredientPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: IngredientType;
  onSelect: (item: PolicyStateProps | PopulationStateProps | null) => void;
  onCreateNew: () => void;
}

export function IngredientPickerModal({
  isOpen,
  onClose,
  type,
  onSelect,
  onCreateNew,
}: IngredientPickerModalProps) {
  const countryId = useCurrentCountry() as 'us' | 'uk';
  const countryConfig = COUNTRY_CONFIG[countryId] || COUNTRY_CONFIG.us;
  const userId = MOCK_USER_ID.toString();
  const { data: policies, isLoading: policiesLoading } = useUserPolicies(userId);
  const { data: households, isLoading: householdsLoading } = useUserHouseholds(userId);
  const colorConfig = INGREDIENT_COLORS[type];
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);
  const parameters = useSelector((state: RootState) => state.metadata.parameters);

  const getTitle = () => {
    switch (type) {
      case 'policy': return 'Select policy';
      case 'population': return 'Select population';
      case 'dynamics': return 'Configure dynamics';
    }
  };

  const getIcon = () => {
    const iconProps = { size: 20, color: colorConfig.icon };
    switch (type) {
      case 'policy': return <IconScale {...iconProps} />;
      case 'population': return <IconUsers {...iconProps} />;
      case 'dynamics': return <IconChartLine {...iconProps} />;
    }
  };

  const handleSelectPolicy = (policyId: string, label: string, paramCount: number) => {
    onSelect({ id: policyId, label, parameters: Array(paramCount).fill({}) });
    onClose();
  };

  const handleSelectCurrentLaw = () => {
    onSelect({ id: 'current-law', label: 'Current law', parameters: [] });
    onClose();
  };

  const handleSelectHousehold = (householdId: string, label: string) => {
    onSelect({
      label,
      type: 'household',
      household: { id: householdId, countryId, householdData: { people: {} } },
      geography: null,
    });
    onClose();
  };

  const handleSelectGeography = (geoId: string, label: string, scope: 'national' | 'subnational') => {
    onSelect({
      label,
      type: 'geography',
      household: null,
      geography: { id: geoId, countryId, scope, geographyId: geoId, name: label },
    });
    onClose();
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={
        <Group gap={spacing.sm}>
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: spacing.radius.sm,
              background: colorConfig.bg,
              border: `1px solid ${colorConfig.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {getIcon()}
          </Box>
          <Text fw={600} style={{ fontSize: FONT_SIZES.normal }}>{getTitle()}</Text>
        </Group>
      }
      size="xl"
      radius="lg"
      styles={{
        content: { width: '80vw', maxWidth: '1200px' },
        header: { borderBottom: `1px solid ${colors.border.light}`, paddingBottom: spacing.md },
        body: { padding: spacing.xl },
      }}
    >
      <Stack gap={spacing.lg}>
        {type === 'policy' && (
          <>
            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={handleSelectCurrentLaw}>
              <Group gap={spacing.md}>
                <Box style={{ width: 36, height: 36, borderRadius: spacing.radius.md, background: colorConfig.bg, border: `1px solid ${colorConfig.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconScale size={18} color={colorConfig.icon} />
                </Box>
                <Stack gap={2}>
                  <Text fw={600} style={{ fontSize: FONT_SIZES.normal }}>Current law</Text>
                  <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>Use existing tax and benefit rules without modifications</Text>
                </Stack>
              </Group>
            </Paper>
            <Divider label="Or select an existing policy" labelPosition="center" />
            <ScrollArea h={320}>
              {policiesLoading ? (
                <Box p={spacing.xl} ta="center">
                  <Loader size="sm" />
                </Box>
              ) : (
              <Stack gap={spacing.sm}>
                {policies?.map((p) => {
                  // Use association data for display (like Policies page)
                  const policyId = p.association.policyId.toString();
                  const label = p.association.label || `Policy #${policyId}`;
                  const paramCount = countPolicyModifications(p.policy); // Handles undefined gracefully
                  const policyParams = p.policy?.parameters || [];
                  const isExpanded = expandedPolicyId === policyId;

                  return (
                    <Paper
                      key={policyId}
                      radius="md"
                      withBorder
                      style={{
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        borderColor: isExpanded ? colorConfig.border : undefined,
                      }}
                    >
                      {/* Main clickable row */}
                      <Box
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: spacing.sm,
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onClick={() => handleSelectPolicy(policyId, label, paramCount)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.gray[50];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {/* Policy info - takes remaining space */}
                        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                          <Text fw={500} style={{ fontSize: FONT_SIZES.normal }}>{label}</Text>
                          <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>
                            {paramCount} param{paramCount !== 1 ? 's' : ''} changed
                          </Text>
                        </Stack>

                        {/* Info/expand button - isolated click zone */}
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent selection
                            setExpandedPolicyId(isExpanded ? null : policyId);
                          }}
                          style={{ marginRight: spacing.sm }}
                          aria-label={isExpanded ? 'Hide parameter details' : 'Show parameter details'}
                        >
                          <IconInfoCircle size={18} />
                        </ActionIcon>

                        {/* Select indicator */}
                        <IconChevronRight size={16} color={colors.gray[400]} />
                      </Box>

                      {/* Expandable parameter details - table-like display */}
                      <Box
                        style={{
                          maxHeight: isExpanded ? '400px' : '0px',
                          opacity: isExpanded ? 1 : 0,
                          overflow: isExpanded ? 'auto' : 'hidden',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          borderTop: isExpanded ? `1px solid ${colors.gray[200]}` : 'none',
                        }}
                      >
                        {/* Unified grid for header and data rows */}
                        <Box
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 180px',
                            gap: `0 ${spacing.md}`,
                          }}
                        >
                          {/* Header row */}
                          <Text
                            fw={600}
                            c="dimmed"
                            style={{
                              fontSize: FONT_SIZES.tiny,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              padding: spacing.md,
                              paddingBottom: spacing.xs,
                              borderBottom: `1px solid ${colors.gray[200]}`,
                            }}
                          >
                            Parameter
                          </Text>
                          <Text
                            fw={600}
                            c="dimmed"
                            style={{
                              fontSize: FONT_SIZES.tiny,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              textAlign: 'right',
                              padding: spacing.md,
                              paddingBottom: spacing.xs,
                              borderBottom: `1px solid ${colors.gray[200]}`,
                            }}
                          >
                            Changes
                          </Text>

                          {/* Data rows - grouped by parameter */}
                          {(() => {
                            // Build grouped list of parameters with their changes
                            const groupedParams: Array<{
                              paramName: string;
                              label: string;
                              changes: Array<{ period: string; value: string }>;
                            }> = [];

                            policyParams.forEach((param) => {
                              const paramName = param.name;
                              const hierarchicalLabels = getHierarchicalLabels(paramName, parameters);
                              const displayLabel = hierarchicalLabels.length > 0
                                ? formatLabelParts(hierarchicalLabels)
                                : paramName.split('.').pop() || paramName;
                              const metadata = parameters[paramName];

                              // Use value intervals directly from the Policy type
                              const changes = (param.values || []).map((interval) => ({
                                period: formatPeriod(interval.startDate, interval.endDate),
                                value: formatParameterValue(interval.value, metadata?.unit),
                              }));

                              groupedParams.push({ paramName, label: displayLabel, changes });
                            });

                            if (groupedParams.length === 0) {
                              return (
                                <>
                                  <Text c="dimmed" style={{ fontSize: FONT_SIZES.small, padding: spacing.md, gridColumn: '1 / -1' }}>
                                    No parameter details available
                                  </Text>
                                </>
                              );
                            }

                            const displayParams = groupedParams.slice(0, 10);
                            const remainingCount = groupedParams.length - 10;

                            return (
                              <>
                                {displayParams.map((param) => (
                                  <Fragment key={param.paramName}>
                                    {/* Parameter name cell */}
                                    <Box
                                      style={{
                                        padding: `${spacing.sm} ${spacing.md}`,
                                        borderBottom: `1px solid ${colors.gray[100]}`,
                                        minWidth: 0,
                                      }}
                                    >
                                      <Tooltip label={param.paramName} multiline w={300} withArrow>
                                        <Text
                                          style={{
                                            fontSize: FONT_SIZES.small,
                                            color: colors.gray[700],
                                            lineHeight: 1.4,
                                          }}
                                        >
                                          {param.label}
                                        </Text>
                                      </Tooltip>
                                    </Box>
                                    {/* Changes cell - multiple lines */}
                                    <Box
                                      style={{
                                        padding: `${spacing.sm} ${spacing.md}`,
                                        borderBottom: `1px solid ${colors.gray[100]}`,
                                        textAlign: 'right',
                                      }}
                                    >
                                      {param.changes.map((change, idx) => (
                                        <Text
                                          key={idx}
                                          style={{
                                            fontSize: FONT_SIZES.small,
                                            lineHeight: 1.5,
                                          }}
                                        >
                                          <Text component="span" style={{ color: colors.gray[500] }}>
                                            {change.period}:
                                          </Text>{' '}
                                          <Text component="span" fw={500} style={{ color: colorConfig.icon }}>
                                            {change.value}
                                          </Text>
                                        </Text>
                                      ))}
                                    </Box>
                                  </Fragment>
                                ))}
                                {remainingCount > 0 && (
                                  <Text
                                    c="dimmed"
                                    style={{
                                      fontSize: FONT_SIZES.tiny,
                                      textAlign: 'center',
                                      padding: spacing.sm,
                                      gridColumn: '1 / -1',
                                    }}
                                  >
                                    +{remainingCount} more parameter{remainingCount !== 1 ? 's' : ''}
                                  </Text>
                                )}
                              </>
                            );
                          })()}
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
                {(!policies || policies.length === 0) && <Text c="dimmed" ta="center" py="lg">No saved policies</Text>}
              </Stack>
              )}
            </ScrollArea>
            <Divider />
            <Button variant="light" color="teal" leftSection={<IconPlus size={16} />} onClick={() => { onCreateNew(); onClose(); }}>Create new policy</Button>
          </>
        )}

        {type === 'population' && (
          <>
            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => handleSelectGeography(countryConfig.nationwideId, countryConfig.nationwideLabel, 'national')}>
              <Group gap={spacing.md}>
                <Box style={{ width: 36, height: 36, borderRadius: spacing.radius.md, background: colorConfig.bg, border: `1px solid ${colorConfig.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CountryMapIcon countryId={countryId} size={18} color={colorConfig.icon} />
                </Box>
                <Stack gap={2}>
                  <Text fw={600} style={{ fontSize: FONT_SIZES.normal }}>{countryConfig.nationwideTitle}</Text>
                  <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>{countryConfig.nationwideSubtitle}</Text>
                </Stack>
              </Group>
            </Paper>
            <Paper p="md" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => handleSelectHousehold('sample-household', 'Sample household')}>
              <Group gap={spacing.md}>
                <Box style={{ width: 36, height: 36, borderRadius: spacing.radius.md, background: colorConfig.bg, border: `1px solid ${colorConfig.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconHome size={18} color={colorConfig.icon} />
                </Box>
                <Stack gap={2}>
                  <Text fw={600} style={{ fontSize: FONT_SIZES.normal }}>Sample household</Text>
                  <Text c="dimmed" style={{ fontSize: FONT_SIZES.small }}>Single household simulation</Text>
                </Stack>
              </Group>
            </Paper>
            <Divider label="Or select an existing household" labelPosition="center" />
            <ScrollArea h={150}>
              {householdsLoading ? (
                <Box p={spacing.xl} ta="center">
                  <Loader size="sm" />
                </Box>
              ) : (
              <Stack gap={spacing.sm}>
                {households?.map((h) => {
                  // Use association data for display (like Populations page)
                  const householdId = h.association.householdId.toString();
                  const label = h.association.label || `Household #${householdId}`;
                  return (
                    <Paper key={householdId} p="sm" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => handleSelectHousehold(householdId, label)}>
                      <Group justify="space-between">
                        <Text fw={500} style={{ fontSize: FONT_SIZES.normal }}>{label}</Text>
                        <IconChevronRight size={16} color={colors.gray[400]} />
                      </Group>
                    </Paper>
                  );
                })}
                {(!households || households.length === 0) && <Text c="dimmed" ta="center" py="lg">No saved households</Text>}
              </Stack>
              )}
            </ScrollArea>
            <Divider />
            <Button variant="light" color="teal" leftSection={<IconPlus size={16} />} onClick={() => { onCreateNew(); onClose(); }}>Create new household</Button>
          </>
        )}

        {type === 'dynamics' && (
          <Stack gap={spacing.lg} align="center" py="xl">
            <Box style={{ width: 64, height: 64, borderRadius: '50%', background: colorConfig.bg, border: `1px solid ${colorConfig.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconSparkles size={28} color={colorConfig.icon} />
            </Box>
            <Stack gap={spacing.xs} align="center">
              <Text fw={600} c={colors.gray[700]}>Dynamics coming soon</Text>
              <Text c="dimmed" ta="center" maw={300} style={{ fontSize: FONT_SIZES.small }}>Dynamic behavioral responses will be available in a future update.</Text>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}
