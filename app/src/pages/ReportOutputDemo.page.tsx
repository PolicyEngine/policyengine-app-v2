import ReportOutputPage from './ReportOutput.page';

/**
 * Demo wrapper for ReportOutputPage
 * Provides a way to view the structural page with a mock report ID
 */
export default function ReportOutputPageDemo() {
  // This will use a mock report ID that should exist in your test data
  // The actual ReportOutputPage will fetch the data using this ID
  return <ReportOutputPage />;
}
