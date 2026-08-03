import { IconArrowRight, IconTrash, IconX } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getReformStore } from '@/api/reformStore';
import { Button, Stack, Text } from '@/components/ui';
import { MOCK_USER_ID } from '@/constants';
import { useAppNavigate } from '@/contexts/NavigationContext';
import { colors, spacing, typography } from '@/designTokens';
import {
  clearDraftReform,
  DraftReform,
  draftToReform,
  removeDraftProvision,
  setDraftLabel,
  updateDraftProvisionValue,
} from '@/libs/draftReform';
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

/**
 * The trust layer of the flagship shell: every provision the draft
 * reform will simulate, spelled out with baseline → new value, editable
 * before anything is saved or run.
 */
export default function ReformPreviewCard({ draft }: { draft: DraftReform }) {
  const nav = useAppNavigate();
  const queryClient = useQueryClient();

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
      nav.push(`/${draft.countryId}/library`);
    },
  });

  const hasEditedValue = draft.provisions.some((p) => p.value !== p.baselineValue);

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
      <Stack
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: spacing.md,
          padding: `${spacing.md} ${spacing.lg}`,
          background: colors.primary[50],
        }}
      >
        <Text
          style={{
            fontWeight: typography.fontWeight.semibold,
            color: colors.primary[700],
            fontSize: typography.fontSize.sm,
          }}
        >
          {draft.editingReformId ? 'Editing reform' : "Here's your draft reform"}
        </Text>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          {SOURCE_NOTES[draft.source]} · baseline: current law
        </Text>
      </Stack>

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
                style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                }}
              >
                {provision.breadcrumb || provision.path}
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

      <Stack style={{ gap: spacing.md, padding: spacing.lg }}>
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
        {saveMutation.isError && (
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.error }}>
            Could not save the reform. Try again.
          </Text>
        )}
        <Stack style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
          <Button
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
    </Stack>
  );
}
