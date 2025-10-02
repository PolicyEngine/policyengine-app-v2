import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReportOutputPage from './ReportOutput.page';
import { MOCK_DEMO_REPORT_ID } from '@/tests/fixtures/report/mockReportOutput';

/**
 * Demo wrapper for ReportOutputPage
 * Provides a way to view the structural page with mock data
 * Automatically navigates to a special demo report ID that triggers mock data
 */
export default function ReportOutputPageDemo() {
  const navigate = useNavigate();
  const { reportId } = useParams<{ reportId?: string; subpage?: string }>();

  // Redirect to the demo report ID if not already there
  useEffect(() => {
    if (!reportId) {
      navigate(`/us/report-output/${MOCK_DEMO_REPORT_ID}`, { replace: true });
    }
  }, [reportId, navigate]);

  // If we have a reportId in the URL, render the page
  if (reportId) {
    return <ReportOutputPage />;
  }

  // While redirecting, show nothing
  return null;
}
