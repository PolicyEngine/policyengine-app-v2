/**
 * PolicyEditingConceptPage - Routes to the correct concept by :conceptId param
 */
import { useParams } from 'react-router-dom';
import { Box, Text } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { Concept1ForkAndEdit } from './concepts/Concept1ForkAndEdit';
import { Concept2InlineDrawerEdit } from './concepts/Concept2InlineDrawerEdit';
import { Concept3SplitPaneComparison } from './concepts/Concept3SplitPaneComparison';
import { Concept4DuplicateSummary } from './concepts/Concept4DuplicateSummary';
import { Concept5TabbedDetailView } from './concepts/Concept5TabbedDetailView';
import { Concept6LiveParameterEditor } from './concepts/Concept6LiveParameterEditor';

const CONCEPT_MAP: Record<string, React.ComponentType> = {
  '1-fork-and-edit': Concept1ForkAndEdit,
  '2-inline-drawer-edit': Concept2InlineDrawerEdit,
  '3-split-pane-comparison': Concept3SplitPaneComparison,
  '4-duplicate-summary': Concept4DuplicateSummary,
  '5-tabbed-detail-view': Concept5TabbedDetailView,
  '6-live-parameter-editor': Concept6LiveParameterEditor,
};

export default function PolicyEditingConceptPage() {
  const { conceptId } = useParams<{ conceptId: string }>();
  const ConceptComponent = conceptId ? CONCEPT_MAP[conceptId] : null;

  if (!ConceptComponent) {
    return (
      <Box style={{ padding: spacing.xl }}>
        <Text c={colors.gray[500]}>Concept not found: {conceptId}</Text>
      </Box>
    );
  }

  return <ConceptComponent />;
}
