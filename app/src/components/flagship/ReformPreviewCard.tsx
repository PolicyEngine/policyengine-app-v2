import { useState } from 'react';
import {
  IconArrowRight,
  IconChartBar,
  IconChevronDown,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getReformStore } from '@/api/reformStore';
import { Button, Stack, Text } from '@/components/ui';
import { MOCK_USER_ID } from '@/constants';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import {
  clearDraftReform,
  DraftReform,
  draftToReform,
  removeDraftProvision,
  setDraftLabel,
  setDraftPopulation,
  updateDraftProvisionValue,
} from '@/libs/draftReform';
import { formatCompactBreadcrumb } from '@/utils/parameterLabels';
import { formatValue } from '@/utils/parameterValues';
import ValueInput from './ValueInput';

const SOURCE_NOTES: Record<string, string> = {
  manual: 'Hand-built',
  chat: 'Drafted from your question',
  bill: 'Drafted from a bill',
  tool: 'Drafted from a tool',
};

function ProvisionValueInput({ path, value }: { path: string; value: any }) {
  return (
    <ValueInput
      value={value}
      onChange={(next) => updateDraftProvisionValue(path, next)}
      ariaLabel={`New value for ${path}`}
    />
  );
}

/** Shared section header so every component of the draft reads the same way. */
function SectionHeader({ label, detail }: { label: string; detail?: string }) {
  return (
    <Stack
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: spacing.sm,
        padding: `${spacing.sm} ${spacing.lg} 0`,
      }}
    >
      <Text
        style={{
          fontSize: typography.fontSize.xs,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: colors.text.secondary,
          fontWeight: typography.fontWeight.semibold,
        }}
      >
        {label}
      </Text>
      {detail && (
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          {detail}
        </Text>
      )}
    </Stack>
  );
}

/**
 * The running overview of the draft — the trust layer of the flagship
 * shell. One section per component of the analysis (reform, population,
 * simulation), each spelled out and editable before anything is saved
 * or run. New components add sections here so every page displays the
 * construction identically.
 */
export default function ReformPreviewCard({ draft }: { draft: DraftReform }) {
  const nav = useAppNavigate();
  const queryClient = useQueryClient();
  const runReport = useRunFlagshipReport();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const store = getReformStore();
      const payload = draftToReform(draft, MOCK_USER_ID);
      if (draft.editingReformId) {
        return store.update(draft.editingReformId, {
          label: payload.label,
          parameters: payload.parameters,
          provenance: payload.provenance,
        });
      }
      return store.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reforms'] });
      clearDraftReform();
      nav.push(`/${draft.countryId}/reforms?filter=yours`);
    },
  });

  const hasEditedValue = draft.provisions.some((p) => p.value !== p.baselineValue);
  // The draft follows you across every page, so it has to be foldable
  // when you want the room back — open by default, since an unseen draft
  // is the thing this panel exists to prevent.
  const [open, setOpen] = useState(true);
  const provisionCount = `${draft.provisions.length} provision${
    draft.provisions.length === 1 ? '' : 's'
  }`;

  return (
    <Stack
      style={{
        gap: 0,
        border: `1px solid ${colors.primary[500]}`,
        borderRadius: 12,
        background: colors.background.primary,
        overflow: 'hidden',
      }}
      aria-label="Draft reform"
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="draft-reform-body"
        style={{
          all: 'unset',
          boxSizing: 'border-box',
          cursor: 'pointer',
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: spacing.md,
          padding: `${spacing.md} ${spacing.lg}`,
          background: colors.primary[50],
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, minWidth: 0 }}>
          <IconChevronDown
            size={14}
            color={colors.primary[700]}
            style={{
              flexShrink: 0,
              transform: open ? undefined : 'rotate(-90deg)',
              transition: 'transform 160ms ease',
            }}
          />
          <Text
            style={{
              fontWeight: typography.fontWeight.semibold,
              color: colors.primary[700],
              fontSize: typography.fontSize.sm,
            }}
          >
            {draft.editingReformId ? 'Editing reform' : "Here's your draft reform"}
          </Text>
        </span>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          {/* Folded, the count is all that is left to say what is in there. */}
          {open ? SOURCE_NOTES[draft.source] : provisionCount}
        </Text>
      </button>
      {open && (
        <div id="draft-reform-body">
          <SectionHeader label="Reform" detail={provisionCount} />
          <Stack style={{ gap: 0 }}>
            {draft.provisions.map((provision) => (
              <Stack
                key={provision.path}
                style={{
                  gap: spacing.xs,
                  padding: `${spacing.sm} ${spacing.lg}`,
                  borderBottom: `1px solid ${colors.border.light}`,
                }}
              >
                <Stack
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: spacing.sm,
                  }}
                >
                  <Text
                    title={provision.breadcrumb || provision.path}
                    style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.primary,
                    }}
                  >
                    {formatCompactBreadcrumb(provision.breadcrumb || provision.path)}
                  </Text>
                  <button
                    type="button"
                    onClick={() => removeDraftProvision(provision.path)}
                    aria-label={`Remove ${provision.breadcrumb || provision.path}`}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: colors.text.secondary,
                      padding: 2,
                      flexShrink: 0,
                    }}
                  >
                    <IconX size={14} />
                  </button>
                </Stack>
                <Stack
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    flexWrap: 'wrap',
                  }}
                >
                  <Text
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatValue(provision.baselineValue, provision.unit)} →
                  </Text>
                  <ProvisionValueInput path={provision.path} value={provision.value} />
                </Stack>
              </Stack>
            ))}
          </Stack>

          <Stack style={{ gap: spacing.sm, padding: `${spacing.sm} ${spacing.lg}` }}>
            <input
              value={draft.label}
              onChange={(event) => setDraftLabel(event.target.value)}
              placeholder="Name this reform, e.g. CTC expansion 2026"
              aria-label="Reform name"
              style={{
                padding: `${spacing.sm} ${spacing.md}`,
                border: `1px solid ${colors.border.light}`,
                borderRadius: 8,
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.primary,
              }}
            />
            {!hasEditedValue && draft.provisions.length > 0 && (
              <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                Values match current law so far — edit a value above to make this a reform.
              </Text>
            )}
          </Stack>

          <SectionHeader label="Population" />
          <Stack
            style={{
              flexDirection: 'row',
              gap: spacing.xs,
              padding: `${spacing.xs} ${spacing.lg} ${spacing.sm}`,
            }}
            role="group"
            aria-label="Population scope"
          >
            {(
              [
                { scope: 'national', label: 'Nationwide', enabled: true },
                { scope: 'household', label: 'A household', enabled: false },
              ] as const
            ).map(({ scope, label, enabled }) => {
              const active = draft.population.scope === scope;
              return (
                <button
                  key={scope}
                  type="button"
                  disabled={!enabled}
                  aria-pressed={active}
                  title={enabled ? undefined : 'Household analysis arrives with the run bridge'}
                  onClick={() => setDraftPopulation({ scope })}
                  style={{
                    padding: `${spacing.xs} ${spacing.md}`,
                    borderRadius: 999,
                    border: `1px solid ${active ? colors.primary[500] : colors.border.light}`,
                    background: active ? colors.primary[50] : colors.background.primary,
                    color: enabled
                      ? active
                        ? colors.primary[700]
                        : colors.text.primary
                      : colors.gray[400],
                    fontSize: typography.fontSize.xs,
                    fontFamily: typography.fontFamily.primary,
                    fontWeight: active
                      ? typography.fontWeight.medium
                      : typography.fontWeight.normal,
                    cursor: enabled ? 'pointer' : 'not-allowed',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </Stack>

          <SectionHeader label="Simulation" />
          <Stack style={{ gap: spacing.xs, padding: `${spacing.xs} ${spacing.lg} ${spacing.sm}` }}>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
              Baseline: current law · {new Date().getFullYear()}
            </Text>
            {runReport.error && (
              <Text style={{ fontSize: typography.fontSize.xs, color: colors.error }}>
                {runReport.error}
              </Text>
            )}
          </Stack>

          <Stack style={{ gap: spacing.md, padding: spacing.lg, paddingTop: spacing.sm }}>
            {saveMutation.isError && (
              <Text style={{ fontSize: typography.fontSize.sm, color: colors.error }}>
                Could not save the reform. Try again.
              </Text>
            )}
            <Stack style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
              <Button
                onClick={() =>
                  runReport.run(
                    draft.label || 'Draft reform',
                    SOURCE_NOTES[draft.source] ?? 'Draft reform',
                    draft.provisions
                  )
                }
                disabled={draft.provisions.length === 0 || runReport.isRunning}
              >
                <IconChartBar size={16} />
                {runReport.isRunning ? 'Starting report…' : 'Run report'}
              </Button>
              <Button
                variant="outline"
                onClick={() => saveMutation.mutate()}
                disabled={draft.provisions.length === 0 || saveMutation.isPending}
              >
                {draft.editingReformId ? 'Save changes' : 'Save to library'}
                <IconArrowRight size={16} />
              </Button>
              <Button variant="outline" onClick={() => clearDraftReform()}>
                <IconTrash size={16} />
                Discard draft
              </Button>
            </Stack>
          </Stack>
        </div>
      )}
    </Stack>
  );
}
