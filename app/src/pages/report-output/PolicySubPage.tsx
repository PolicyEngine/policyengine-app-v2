import { Policy } from '@/types/ingredients/Policy';
import { UserPolicy } from '@/types/ingredients/UserPolicy';

interface PolicySubPageProps {
  policies?: Policy[];
  userPolicies?: UserPolicy[];
  reportType: 'economy' | 'household';
}

/**
 * PolicySubPage - Displays policy information for a report
 *
 * This component shows all policies used in the report (baseline, reform, and
 * optionally current law for economy reports) with their parameters and values.
 */
export default function PolicySubPage({ policies, userPolicies, reportType }: PolicySubPageProps) {
  if (!policies || policies.length === 0) {
    return <div>No policy data available</div>;
  }

  return (
    <div>
      <h2>Policy Sub-Page (Placeholder)</h2>
      <p>Report Type: {reportType}</p>
      <p>Number of Policies: {policies.length}</p>
      <p>Number of User Policies: {userPolicies?.length || 0}</p>
    </div>
  );
}
