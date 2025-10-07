import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  MOCK_DEMO_HOUSEHOLD_ID,
  MOCK_DEMO_REPORT_ID,
} from '@/tests/fixtures/report/mockReportOutput';
import ReportOutputPage from './ReportOutput.page';

/**
 * Demo wrapper for ReportOutputPage
 * Provides a way to view the structural page with mock data
 * Automatically navigates to a special demo report ID that triggers mock data
 *
 * Supports two demo modes:
 * - /us/report-output-demo -> Economy report demo
 * - /us/household-output-demo -> Household report demo
 */
export default function ReportOutputPageDemo() {
  const navigate = useNavigate();
  const location = useLocation();
  const { reportId } = useParams<{ reportId?: string; subpage?: string }>();

  // Determine which demo type based on URL path
  const isHouseholdDemo = location.pathname.includes('household-output-demo');
  const demoReportId = isHouseholdDemo ? MOCK_DEMO_HOUSEHOLD_ID : MOCK_DEMO_REPORT_ID;

  // Redirect to the appropriate demo report ID if not already there
  useEffect(() => {
    if (!reportId) {
      navigate(`/us/report-output/${demoReportId}`, { replace: true });
    }
  }, [reportId, navigate, demoReportId]);

  // If we have a reportId in the URL, render the page
  if (reportId) {
    return <ReportOutputPage />;
  }

  // While redirecting, show nothing
  return null;
}
