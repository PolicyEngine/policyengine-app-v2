import { render } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportBuilderPage from '@/pages/reportBuilder/ReportBuilderPage';

const { mockReportBuilderShell, mockUseReportSubmission } = vi.hoisted(() => ({
  mockReportBuilderShell: vi.fn(),
  mockUseReportSubmission: vi.fn(),
}));

vi.mock('@/hooks/useCurrentCountry', () => ({ useCurrentCountry: () => 'us' }));
vi.mock('@/contexts/NavigationContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/NavigationContext')>();
  return {
    ...actual,
    useAppNavigate: () => ({ push: vi.fn() }),
  };
});
vi.mock('@/pages/reportBuilder/hooks/useReportSubmission', () => ({
  useReportSubmission: (...args: unknown[]) => mockUseReportSubmission(...args),
}));
vi.mock('@/pages/reportBuilder/components', () => ({
  ReportBuilderShell: (props: unknown) => {
    mockReportBuilderShell(props);
    return <div />;
  },
  SimulationBlockFull: () => <div />,
}));

describe('ReportBuilderPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given no effective policy difference then run is disabled and the reason is visible', () => {
    mockUseReportSubmission.mockReturnValue({
      handleSubmit: vi.fn(),
      isSubmitting: false,
      isReportConfigured: true,
      reportPolicyActionability: {
        isActionable: false,
        reason: 'no-effective-policy-change',
        message: 'A report needs an effective policy change.',
        normalizedPolicies: [[]],
      },
    });

    render(<ReportBuilderPage />);

    const shellProps = mockReportBuilderShell.mock.lastCall?.[0];
    expect(shellProps.actions[0]).toMatchObject({
      disabled: true,
      disabledReason: 'A report needs an effective policy change.',
    });
    expect(shellProps.validationMessage).toBe('A report needs an effective policy change.');
  });

  test('given materially different policy configurations then run is enabled', () => {
    mockUseReportSubmission.mockReturnValue({
      handleSubmit: vi.fn(),
      isSubmitting: false,
      isReportConfigured: true,
      reportPolicyActionability: {
        isActionable: true,
        reason: null,
        message: null,
        normalizedPolicies: [[], [{ name: 'gov.test.amount', values: [] }]],
      },
    });

    render(<ReportBuilderPage />);

    const shellProps = mockReportBuilderShell.mock.lastCall?.[0];
    expect(shellProps.actions[0].disabled).toBe(false);
    expect(shellProps.validationMessage).toBeNull();
  });
});
