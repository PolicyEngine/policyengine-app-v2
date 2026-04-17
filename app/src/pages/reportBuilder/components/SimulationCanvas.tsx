/**
 * SimulationCanvas - Renders simulation blocks and modals
 *
 * This is a thin render layer. All state management, data fetching,
 * and callback logic lives in useSimulationCanvas.
 */

import { useSimulationCanvas } from '../hooks/useSimulationCanvas';
import {
  HouseholdCreationModal,
  IngredientPickerModal,
  PolicyBrowseModal,
  PolicyCreationModal,
  PopulationBrowseModal,
} from '../modals';
import { styles } from '../styles';
import type { IngredientPickerState, ReportBuilderState, SimulationBlockProps } from '../types';
import { AddSimulationCard } from './AddSimulationCard';
import { SimulationBlock } from './SimulationBlock';
import { SimulationCanvasSkeleton } from './SimulationCanvasSkeleton';

interface SimulationCanvasProps {
  reportYear: string;
  reportState: ReportBuilderState;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState>>;
  pickerState: IngredientPickerState;
  setPickerState: React.Dispatch<React.SetStateAction<IngredientPickerState>>;
  BlockComponent?: React.ComponentType<SimulationBlockProps>;
  isReadOnly?: boolean;
}

export function SimulationCanvas({
  reportYear,
  reportState,
  setReportState,
  pickerState,
  setPickerState,
  BlockComponent = SimulationBlock,
  isReadOnly,
}: SimulationCanvasProps) {
  const canvas = useSimulationCanvas({ reportState, setReportState, pickerState, setPickerState });
  const isViewOnly = Boolean(isReadOnly);
  const noop = () => {};

  if (canvas.isInitialLoading) {
    return <SimulationCanvasSkeleton />;
  }

  return (
    <>
      <div style={styles.canvasContainer}>
        <div style={styles.canvasGrid} />
        <div style={styles.simulationsGrid}>
          <BlockComponent
            simulation={reportState.simulations[0]}
            index={0}
            countryId={canvas.countryId}
            onLabelChange={(label) => canvas.handleSimulationLabelChange(0, label)}
            onQuickSelectPolicy={() => canvas.handleQuickSelectPolicy(0)}
            onSelectSavedPolicy={(id, label, paramCount) =>
              canvas.handleSelectSavedPolicy(0, id, label, paramCount)
            }
            onQuickSelectPopulation={() => canvas.handleQuickSelectPopulation(0, 'nationwide')}
            onSelectRecentPopulation={(pop) => canvas.handleSelectRecentPopulation(0, pop)}
            onDeselectPolicy={() => canvas.handleDeselectPolicy(0)}
            onDeselectPopulation={() => canvas.handleDeselectPopulation(0)}
            onEditPolicy={isViewOnly ? noop : () => canvas.handleEditPolicy(0)}
            onViewPolicy={() => canvas.handleViewPolicy(0)}
            onViewPopulation={() => canvas.handleViewPopulation(0)}
            onCreateCustomPolicy={isViewOnly ? noop : () => canvas.handleCreateCustom(0, 'policy')}
            onBrowseMorePolicies={isViewOnly ? noop : () => canvas.handleBrowseMorePolicies(0)}
            onBrowseMorePopulations={
              isViewOnly ? noop : () => canvas.handleBrowseMorePopulations(0)
            }
            canRemove={false}
            savedPolicies={canvas.savedPolicies}
            recentPopulations={canvas.recentPopulations}
            isReadOnly={isReadOnly}
          />

          {reportState.simulations.length > 1 ? (
            <BlockComponent
              simulation={reportState.simulations[1]}
              index={1}
              countryId={canvas.countryId}
              onLabelChange={(label) => canvas.handleSimulationLabelChange(1, label)}
              onQuickSelectPolicy={() => canvas.handleQuickSelectPolicy(1)}
              onSelectSavedPolicy={(id, label, paramCount) =>
                canvas.handleSelectSavedPolicy(1, id, label, paramCount)
              }
              onQuickSelectPopulation={() => canvas.handleQuickSelectPopulation(1, 'nationwide')}
              onSelectRecentPopulation={(pop) => canvas.handleSelectRecentPopulation(1, pop)}
              onDeselectPolicy={() => canvas.handleDeselectPolicy(1)}
              onDeselectPopulation={() => canvas.handleDeselectPopulation(1)}
              onEditPolicy={isViewOnly ? noop : () => canvas.handleEditPolicy(1)}
              onViewPolicy={() => canvas.handleViewPolicy(1)}
              onViewPopulation={() => canvas.handleViewPopulation(1)}
              onCreateCustomPolicy={
                isViewOnly ? noop : () => canvas.handleCreateCustom(1, 'policy')
              }
              onBrowseMorePolicies={isViewOnly ? noop : () => canvas.handleBrowseMorePolicies(1)}
              onBrowseMorePopulations={
                isViewOnly ? noop : () => canvas.handleBrowseMorePopulations(1)
              }
              onRemove={() => canvas.handleRemoveSimulation(1)}
              canRemove={!canvas.isGeographySelected}
              isRequired={canvas.isGeographySelected}
              populationInherited
              inheritedPopulation={reportState.simulations[0].population}
              savedPolicies={canvas.savedPolicies}
              recentPopulations={canvas.recentPopulations}
              isReadOnly={isReadOnly}
            />
          ) : (
            <AddSimulationCard
              onClick={canvas.handleAddSimulation}
              disabled={Boolean(isReadOnly)}
            />
          )}
        </div>
      </div>

      <IngredientPickerModal
        isOpen={canvas.pickerState.isOpen}
        onClose={canvas.closeIngredientPicker}
        type={canvas.pickerState.ingredientType}
        onSelect={canvas.handleIngredientSelect}
        onCreateNew={() =>
          canvas.handleCreateCustom(
            canvas.pickerState.simulationIndex,
            canvas.pickerState.ingredientType
          )
        }
      />

      <PolicyBrowseModal
        isOpen={canvas.policyBrowseState.isOpen}
        onClose={canvas.closePolicyBrowse}
        onSelect={canvas.handlePolicySelectFromBrowse}
        reportYear={reportYear}
      />

      <PopulationBrowseModal
        isOpen={canvas.populationBrowseState.isOpen}
        onClose={canvas.closePopulationBrowse}
        onSelect={canvas.handlePopulationSelectFromBrowse}
        reportYear={reportYear}
        onCreateNew={() => {
          canvas.closePopulationBrowse();
          canvas.handleCreateCustom(canvas.populationBrowseState.simulationIndex, 'population');
        }}
      />

      <HouseholdCreationModal
        isOpen={canvas.householdEditorState.isOpen}
        onClose={canvas.closeHouseholdEditor}
        onHouseholdSaved={canvas.handleHouseholdSaved}
        reportYear={reportYear}
        initialPopulation={canvas.householdEditorState.initialPopulation}
        initialAssociation={canvas.householdEditorState.initialAssociation}
        initialEditorMode={canvas.householdEditorState.initialEditorMode}
        forceReadOnly={isViewOnly}
      />

      <PolicyCreationModal
        isOpen={canvas.policyCreationState.isOpen}
        onClose={canvas.closePolicyCreation}
        onPolicyCreated={(policy) =>
          canvas.handlePolicyCreated(canvas.policyCreationState.simulationIndex, policy)
        }
        simulationIndex={canvas.policyCreationState.simulationIndex}
        initialPolicy={canvas.policyCreationState.initialPolicy}
        initialEditorMode={canvas.policyCreationState.initialEditorMode}
        reportYear={reportYear}
        forceReadOnly={isViewOnly}
      />
    </>
  );
}
