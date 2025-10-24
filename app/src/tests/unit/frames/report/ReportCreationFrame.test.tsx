import { configureStore } from '@reduxjs/toolkit';
import { screen, userEvent } from '@test-utils';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { MantineProvider } from '@mantine/core';
import ReportCreationFrame from '@/frames/report/ReportCreationFrame';
import flowReducer from '@/reducers/flowReducer';
import metadataReducer from '@/reducers/metadataReducer';
import policyReducer from '@/reducers/policyReducer';
import populationReducer from '@/reducers/populationReducer';
import reportReducer, * as reportActions from '@/reducers/reportReducer';
import simulationsReducer from '@/reducers/simulationsReducer';
import {
  CREATE_REPORT_BUTTON_LABEL,
  EMPTY_REPORT_LABEL,
  REPORT_CREATION_FRAME_TITLE,
  REPORT_NAME_INPUT_LABEL,
  TEST_REPORT_LABEL,
} from '@/tests/fixtures/frames/ReportCreationFrame';

// Mock useBackButton hook
const mockHandleBack = vi.fn();
vi.mock('@/hooks/useBackButton', () => ({
  useBackButton: vi.fn(() => ({ handleBack: mockHandleBack, canGoBack: false })),
}));

// Mock useCancelFlow
const mockHandleCancel = vi.fn();
vi.mock('@/hooks/useCancelFlow', () => ({
  useCancelFlow: vi.fn(() => ({ handleCancel: mockHandleCancel })),
}));

describe('ReportCreationFrame', () => {
  let store: any;
  let mockOnNavigate: ReturnType<typeof vi.fn>;
  let mockOnReturn: ReturnType<typeof vi.fn>;
  let defaultFlowProps: any;

  beforeEach(() => {
    mockHandleCancel.mockClear();
    vi.clearAllMocks();

    // Create a fresh store for each test
    store = configureStore({
      reducer: {
        report: reportReducer,
        simulations: simulationsReducer,
        flow: flowReducer,
        policy: policyReducer,
        population: populationReducer,
        household: populationReducer,
        metadata: metadataReducer,
      },
    });

    mockOnNavigate = vi.fn();
    mockOnReturn = vi.fn();

    // Default flow props to satisfy FlowComponentProps interface
    defaultFlowProps = {
      onNavigate: mockOnNavigate,
      onReturn: mockOnReturn,
      flowConfig: {
        component: 'ReportCreationFrame',
        on: {
          next: '__return__',
        },
      },
      isInSubflow: false,
      flowDepth: 0,
    };

    // Spy on the action creators
    vi.spyOn(reportActions, 'clearReport');
    vi.spyOn(reportActions, 'updateLabel');
  });

  // Helper to render with router context
  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <Provider store={store}>
        <MantineProvider>
          <MemoryRouter initialEntries={['/us/reports']}>
            <Routes>
              <Route path="/:countryId/*" element={component} />
            </Routes>
          </MemoryRouter>
        </MantineProvider>
      </Provider>
    );
  };

  test('given component mounts then clears report state', () => {
    // Given/When
    renderWithRouter(<ReportCreationFrame {...defaultFlowProps} />);

    // Then - should have cleared the report
    expect(reportActions.clearReport).toHaveBeenCalled();
  });

  test('given component renders then displays correct UI elements', () => {
    // Given/When
    renderWithRouter(
      <Provider store={store}>
        <ReportCreationFrame {...defaultFlowProps} />
      </Provider>
    );

    // Then - should display title, input and button
    expect(screen.getByRole('heading', { name: REPORT_CREATION_FRAME_TITLE })).toBeInTheDocument();
    expect(screen.getByLabelText(REPORT_NAME_INPUT_LABEL)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: CREATE_REPORT_BUTTON_LABEL })).toBeInTheDocument();
  });

  test('given user enters label then input value updates', async () => {
    // Given
    const user = userEvent.setup();
    renderWithRouter(
      <Provider store={store}>
        <ReportCreationFrame {...defaultFlowProps} />
      </Provider>
    );

    const input = screen.getByLabelText(REPORT_NAME_INPUT_LABEL) as HTMLInputElement;

    // When
    await user.type(input, TEST_REPORT_LABEL);

    // Then
    expect(input.value).toBe(TEST_REPORT_LABEL);
  });

  test('given user submits label then dispatches updateLabel action', async () => {
    // Given
    const user = userEvent.setup();
    renderWithRouter(
      <Provider store={store}>
        <ReportCreationFrame {...defaultFlowProps} />
      </Provider>
    );

    const input = screen.getByLabelText(REPORT_NAME_INPUT_LABEL);
    const submitButton = screen.getByRole('button', { name: CREATE_REPORT_BUTTON_LABEL });

    // When
    await user.type(input, TEST_REPORT_LABEL);
    await user.click(submitButton);

    // Then - should dispatch updateLabel to report reducer
    expect(reportActions.updateLabel).toHaveBeenCalledWith(TEST_REPORT_LABEL);

    // And - should navigate to next
    expect(mockOnNavigate).toHaveBeenCalledWith('next');
  });

  test('given user submits label then reducer state is updated', async () => {
    // Given
    const user = userEvent.setup();
    renderWithRouter(
      <Provider store={store}>
        <ReportCreationFrame {...defaultFlowProps} />
      </Provider>
    );

    const input = screen.getByLabelText(REPORT_NAME_INPUT_LABEL);
    const submitButton = screen.getByRole('button', { name: CREATE_REPORT_BUTTON_LABEL });

    // When
    await user.type(input, TEST_REPORT_LABEL);
    await user.click(submitButton);

    // Then - check reducer state
    const state = store.getState();
    expect(state.report.label).toBe(TEST_REPORT_LABEL);
  });

  test('given empty label then still dispatches to reducer', async () => {
    // Given
    const user = userEvent.setup();
    renderWithRouter(
      <Provider store={store}>
        <ReportCreationFrame {...defaultFlowProps} />
      </Provider>
    );

    const submitButton = screen.getByRole('button', { name: CREATE_REPORT_BUTTON_LABEL });

    // When - submit without entering a label
    await user.click(submitButton);

    // Then - should dispatch empty string to reducer
    expect(reportActions.updateLabel).toHaveBeenCalledWith(EMPTY_REPORT_LABEL);

    // And - should still navigate to next
    expect(mockOnNavigate).toHaveBeenCalledWith('next');
  });

  test('given component mounts multiple times then clears report each time', () => {
    // Given
    const { unmount } = renderWithRouter(
      <Provider store={store}>
        <ReportCreationFrame {...defaultFlowProps} />
      </Provider>
    );

    // Reset spy count after first mount
    vi.clearAllMocks();

    // When - unmount and mount a new instance
    unmount();
    renderWithRouter(
      <Provider store={store}>
        <ReportCreationFrame {...defaultFlowProps} />
      </Provider>
    );

    // Then - should clear report again on new mount
    expect(reportActions.clearReport).toHaveBeenCalledTimes(1);
  });

  test('given pre-existing report data then clears on mount', async () => {
    // Given - populate report with existing data
    store.dispatch(reportActions.updateLabel('Existing Report'));
    store.dispatch(reportActions.addSimulationId('123'));

    // Verify pre-existing data
    let state = store.getState();
    expect(state.report.label).toBe('Existing Report');
    expect(state.report.simulationIds).toContain('123');

    // When
    renderWithRouter(<ReportCreationFrame {...defaultFlowProps} />);

    // Then - report should be cleared (wait for async thunk)
    expect(reportActions.clearReport).toHaveBeenCalled();
    await waitFor(() => {
      state = store.getState();
      expect(state.report.label).toBeNull();
      expect(state.report.simulationIds).toHaveLength(0);
    });
  });
});
