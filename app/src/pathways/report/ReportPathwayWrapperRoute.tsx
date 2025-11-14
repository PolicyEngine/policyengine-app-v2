/**
 * ReportPathwayWrapperRoute - Route wrapper for ReportPathwayWrapper
 *
 * Extracts countryId from URL params and passes to PathwayWrapper.
 * Provides completion/cancellation handlers for navigation.
 */

import { useNavigate, useParams } from 'react-router-dom';
import ReportPathwayWrapper from './ReportPathwayWrapper';

export default function ReportPathwayWrapperRoute() {
  const { countryId } = useParams<{ countryId: string}>();
  const navigate = useNavigate();

  if (!countryId) {
    return <div>Error: Country ID not found</div>;
  }

  const handleComplete = () => {
    console.log('[ReportPathwayWrapperRoute] Pathway completed');
    navigate(`/${countryId}/reports`);
  };

  const handleCancel = () => {
    console.log('[ReportPathwayWrapperRoute] Pathway cancelled');
    navigate(`/${countryId}/reports`);
  };

  return (
    <ReportPathwayWrapper
      countryId={countryId}
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
}
