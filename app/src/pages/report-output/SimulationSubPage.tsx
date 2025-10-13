import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Policy } from '@/types/ingredients/Policy';
import { Simulation } from '@/types/ingredients/Simulation';
import { UserSimulation } from '@/types/ingredients/UserSimulation';

interface SimulationSubPageProps {
  simulations?: Simulation[];
  policies?: Policy[];
  households?: Household[];
  geographies?: Geography[];
  userSimulations?: UserSimulation[];
}

/**
 * SimulationSubPage - Displays simulation information for a report
 *
 * This component shows all simulations used in the report (baseline and reform)
 * with their relationships to policies and populations.
 */
export default function SimulationSubPage({
  simulations,
  policies,
  households,
  geographies,
  userSimulations,
}: SimulationSubPageProps) {
  if (!simulations || simulations.length === 0) {
    return <div>No simulation data available</div>;
  }

  return (
    <div>
      <h2>Simulation Sub-Page (Placeholder)</h2>
      <p>Number of Simulations: {simulations.length}</p>
      <p>Number of Policies: {policies?.length || 0}</p>
      <p>Number of Households: {households?.length || 0}</p>
      <p>Number of Geographies: {geographies?.length || 0}</p>
      <p>Number of User Simulations: {userSimulations?.length || 0}</p>
    </div>
  );
}
