/**
 * SimulationCanvas - Renders simulation blocks and modals
 *
 * This is a thin render layer. All state management, data fetching,
 * and callback logic lives in useSimulationCanvas.
 */

import { Box } from '@mantine/core';
import { useSimulationCanvas } from '../hooks/useSimulationCanvas';
import {
  IngredientPickerModal,
  PolicyBrowseModal,
  PolicyCreationModal,
  PopulationBrowseModal,
} from '../modals';
import { styles } from '../styles';
import type { IngredientPickerState, ReportBuilderState } from '../types';
import { AddSimulationCard } from './AddSimulationCard';
import { SimulationBlock, type SimulationBlockProps } from './SimulationBlock';
import { SimulationCanvasSkeleton } from './SimulationCanvasSkeleton';

interface SimulationCanvasProps {
  reportState: ReportBuilderState;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState>>;
  pickerState: IngredientPickerState;
  setPickerState: React.Dispatch<React.SetStateAction<IngredientPickerState>>;
  BlockComponent?: React.ComponentType<SimulationBlockProps>;
}

export function SimulationCanvas({
  reportState,
  setReportState,
  pickerState,
  setPickerState,
  BlockComponent = SimulationBlock,
}: SimulationCanvasProps) {
  const canvas = useSimulationCanvas({ reportState, setReportState, pickerState, setPickerState });

  if (canvas.isInitialLoading) {
    return <SimulationCanvasSkeleton />;
  }

  return (
    <>
      <Box style={styles.canvasContainer}>
        <Box style={styles.canvasGrid} />
        <Box style={styles.simulationsGrid}>
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
            onEditPolicy={() => canvas.handleEditPolicy(0)}
            onCreateCustomPolicy={() => canvas.handleCreateCustom(0, 'policy')}
            onBrowseMorePolicies={() => canvas.handleBrowseMorePolicies(0)}
            onBrowseMorePopulations={() => canvas.handleBrowseMorePopulations(0)}
            canRemove={false}
            savedPolicies={canvas.savedPolicies}
            recentPopulations={canvas.recentPopulations}
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
              onEditPolicy={() => canvas.handleEditPolicy(1)}
              onCreateCustomPolicy={() => canvas.handleCreateCustom(1, 'policy')}
              onBrowseMorePolicies={() => canvas.handleBrowseMorePolicies(1)}
              onBrowseMorePopulations={() => canvas.handleBrowseMorePopulations(1)}
              onRemove={() => canvas.handleRemoveSimulation(1)}
              canRemove={!canvas.isGeographySelected}
              isRequired={canvas.isGeographySelected}
              populationInherited
              inheritedPopulation={reportState.simulations[0].population}
              savedPolicies={canvas.savedPolicies}
              recentPopulations={canvas.recentPopulations}
            />
          ) : (
            <AddSimulationCard onClick={canvas.handleAddSimulation} disabled={false} />
          )}
        </Box>
      </Box>

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
      />

      <PopulationBrowseModal
        isOpen={canvas.populationBrowseState.isOpen}
        onClose={canvas.closePopulationBrowse}
        onSelect={canvas.handlePopulationSelectFromBrowse}
        onCreateNew={() =>
          canvas.handleCreateCustom(canvas.populationBrowseState.simulationIndex, 'population')
        }
      />

      <PolicyCreationModal
        isOpen={canvas.policyCreationState.isOpen}
        onClose={canvas.closePolicyCreation}
        onPolicyCreated={(policy) =>
          canvas.handlePolicyCreated(canvas.policyCreationState.simulationIndex, policy)
        }
        simulationIndex={canvas.policyCreationState.simulationIndex}
        initialPolicy={canvas.policyCreationState.initialPolicy}
      />
    </>
  );
}
