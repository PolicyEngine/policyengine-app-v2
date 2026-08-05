import { useState } from 'react';
import {
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconDeviceFloppy,
  IconFileDescription,
  IconPlus,
  IconScale,
  IconSearch,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { getReformStore } from '@/api/reformStore';
import ValueInput from '@/components/flagship/ValueInput';
import { Button, Spinner, Stack, Text, Title } from '@/components/ui';
import { FOREVER, MOCK_USER_ID } from '@/constants';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { loadReformIntoDraft } from '@/libs/draftReform';
import { RootState } from '@/store';
import { Reform, ReformSource } from '@/types/ingredients/Reform';
import {
  formatCompactBreadcrumb,
  formatLabelParts,
  getHierarchicalLabels,
} from '@/utils/parameterLabels';
import { formatValue, getCurrentValue } from '@/utils/parameterValues';

const SOURCE_LABELS: Record<ReformSource, string> = {
  manual: 'Hand-built',
  chat: 'From a question',
  bill: 'From a bill',
  tool: 'From a tool',
};

/**
 * Library — saved reforms in the same dense, expandable-row structure
 * as the tracker, but amendable: expanding a reform exposes its
 * provisions with editable values, rename, and save — no detour
 * through Build for quick amendments.
 */
export default function LibraryPage() {
  const nav = useAppNavigate();
  const countryId = useCurrentCountry();
  const queryClient = useQueryClient();
  const parameters = useSelector((state: RootState) => state.metadata.parameters);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editedLabel, setEditedLabel] = useState('');
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});

  const {
    data: reforms,
    isPending,
    isError,
  } = useQuery({
    queryKey: ['reforms', MOCK_USER_ID, countryId],
    queryFn: () => getReformStore().findByUser(MOCK_USER_ID, countryId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['reforms'] });

  const saveMutation = useMutation({
    mutationFn: (reform: Reform) =>
      getReformStore().update(reform.id!, {
        label: editedLabel || null,
        parameters: reform.parameters.map((parameter) => ({
          name: parameter.name,
          values: [
            {
              startDate: parameter.values[0]?.startDate ?? `${new Date().getFullYear()}-01-01`,
              endDate: parameter.values[0]?.endDate ?? FOREVER,
              value: editedValues[parameter.name],
            },
          ],
        })),
      }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (reformId: string) => getReformStore().delete(reformId),
    onSuccess: () => {
      setExpandedId(null);
      invalidate();
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (reform: Reform) =>
      getReformStore().create({
        userId: reform.userId,
        countryId: reform.countryId,
        label: `${reform.label || 'Untitled reform'} (copy)`,
        parameters: reform.parameters,
        baseline: reform.baseline,
        provenance: reform.provenance,
      }),
    onSuccess: invalidate,
  });

  const toggleExpand = (reform: Reform) => {
    if (expandedId === reform.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(reform.id!);
    setEditedLabel(reform.label ?? '');
    setEditedValues(Object.fromEntries(reform.parameters.map((p) => [p.name, p.values[0]?.value])));
  };

  const resolveBreadcrumb = (path: string) =>
    parameters?.[path] ? formatLabelParts(getHierarchicalLabels(path, parameters)) : path;

  const addParametersInBuild = (reform: Reform) => {
    loadReformIntoDraft(reform, (path) => ({
      breadcrumb: resolveBreadcrumb(path),
      unit: parameters?.[path]?.unit ?? null,
      baselineValue: getCurrentValue(parameters?.[path]?.values),
    }));
    nav.push(`/${countryId}/build`);
  };

  const isDirty = (reform: Reform) =>
    editedLabel !== (reform.label ?? '') ||
    reform.parameters.some((p) => editedValues[p.name] !== p.values[0]?.value);

  return (
    <Stack style={{ maxWidth: 840, margin: '0 auto', gap: spacing.xl }}>
      <Stack
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: spacing.md,
        }}
      >
        <Stack style={{ gap: spacing.xs }}>
          <Title order={1}>Your library</Title>
          <Text style={{ color: colors.text.secondary }}>
            Saved reforms — expand one to amend it in place.
          </Text>
        </Stack>
        <Button onClick={() => nav.push(`/${countryId}/build`)}>
          New reform
          <IconPlus size={16} />
        </Button>
      </Stack>

      {isPending && <Spinner />}
      {isError && (
        <Text style={{ color: colors.error, fontSize: typography.fontSize.sm }}>
          Could not load your reforms. Try reloading the page.
        </Text>
      )}
      {reforms && reforms.length === 0 && (
        <Stack
          style={{
            padding: spacing['2xl'],
            border: `1px dashed ${colors.border.light}`,
            borderRadius: 8,
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <IconScale size={24} color={colors.text.secondary} />
          <Text style={{ color: colors.text.secondary, fontSize: typography.fontSize.sm }}>
            No saved reforms yet. Build one, or ask a policy question to get started.
          </Text>
        </Stack>
      )}

      {reforms && reforms.length > 0 && (
        <div
          style={{
            border: `1px solid ${colors.border.light}`,
            borderRadius: 12,
            background: colors.background.primary,
            overflow: 'hidden',
          }}
        >
          {reforms.map((reform, i) => {
            const isExpanded = expandedId === reform.id;
            const ChevronIcon = isExpanded ? IconChevronDown : IconChevronRight;
            return (
              <div
                key={reform.id}
                style={{ borderTop: i === 0 ? 'none' : `1px solid ${colors.border.light}` }}
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(reform)}
                  aria-expanded={isExpanded}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    width: '100%',
                    padding: `${spacing.sm} ${spacing.lg}`,
                    border: 'none',
                    background: isExpanded ? colors.gray[50] : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: typography.fontFamily.primary,
                  }}
                >
                  <ChevronIcon size={14} color={colors.text.secondary} style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      flex: 1,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.primary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {reform.label || 'Untitled reform'}
                  </span>
                  <span
                    style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {reform.parameters.length === 1
                      ? '1 provision'
                      : `${reform.parameters.length} provisions`}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '2px 8px',
                      borderRadius: 999,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      color: colors.primary[700],
                      background: colors.primary[50],
                    }}
                  >
                    {SOURCE_LABELS[reform.provenance.source]}
                  </span>
                </button>

                {isExpanded && (
                  <Stack style={{ gap: spacing.md, padding: `0 ${spacing.lg} ${spacing.lg} 40px` }}>
                    <input
                      value={editedLabel}
                      onChange={(event) => setEditedLabel(event.target.value)}
                      placeholder="Name this reform"
                      aria-label="Reform name"
                      style={{
                        padding: `${spacing.sm} ${spacing.md}`,
                        border: `1px solid ${colors.border.light}`,
                        borderRadius: 8,
                        fontSize: typography.fontSize.sm,
                        fontFamily: typography.fontFamily.primary,
                        maxWidth: 420,
                      }}
                    />

                    {reform.parameters.map((parameter) => {
                      const baseline = getCurrentValue(parameters?.[parameter.name]?.values);
                      const unit = parameters?.[parameter.name]?.unit ?? null;
                      return (
                        <Stack
                          key={parameter.name}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
                        >
                          <Stack style={{ flex: 1, gap: 2, minWidth: 0 }}>
                            <Text
                              title={resolveBreadcrumb(parameter.name)}
                              style={{
                                fontSize: typography.fontSize.sm,
                                color: colors.text.primary,
                              }}
                            >
                              {formatCompactBreadcrumb(resolveBreadcrumb(parameter.name))}
                            </Text>
                            <Text
                              style={{
                                fontSize: typography.fontSize.xs,
                                fontFamily: typography.fontFamily.mono,
                                color: colors.text.secondary,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {parameter.name}
                            </Text>
                          </Stack>
                          <Text
                            style={{
                              fontSize: typography.fontSize.sm,
                              color: colors.text.secondary,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatValue(baseline, unit)} →
                          </Text>
                          <ValueInput
                            value={editedValues[parameter.name]}
                            onChange={(next) =>
                              setEditedValues((current) => ({
                                ...current,
                                [parameter.name]: next,
                              }))
                            }
                            ariaLabel={`New value for ${parameter.name}`}
                          />
                        </Stack>
                      );
                    })}

                    {saveMutation.isError && (
                      <Text style={{ fontSize: typography.fontSize.sm, color: colors.error }}>
                        Could not save the changes. Try again.
                      </Text>
                    )}

                    <Stack style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                      <Button
                        size="sm"
                        disabled={!isDirty(reform) || saveMutation.isPending}
                        onClick={() => saveMutation.mutate(reform)}
                      >
                        <IconDeviceFloppy size={14} />
                        Save changes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addParametersInBuild(reform)}
                      >
                        <IconSearch size={14} />
                        Add parameters in Build
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={duplicateMutation.isPending}
                        onClick={() => duplicateMutation.mutate(reform)}
                      >
                        <IconCopy size={14} />
                        Duplicate
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(reform.id!)}
                      >
                        <IconTrash size={14} />
                        Delete
                      </Button>
                    </Stack>
                  </Stack>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Stack style={{ gap: spacing.md }}>
        <Text
          style={{
            fontSize: typography.fontSize.xs,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: colors.text.secondary,
            fontWeight: typography.fontWeight.semibold,
          }}
        >
          Everything else
        </Text>
        <Stack style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={() => nav.push(`/${countryId}/reports`)}>
            <IconFileDescription size={16} />
            Reports
          </Button>
          <Button variant="outline" onClick={() => nav.push(`/${countryId}/households`)}>
            <IconUsers size={16} />
            Households
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
