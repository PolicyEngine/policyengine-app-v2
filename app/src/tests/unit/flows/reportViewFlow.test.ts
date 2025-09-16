import { describe, expect, test } from 'vitest';
import { ReportViewFlow } from '@/flows/reportViewFlow';
import { SimulationViewFlow } from '@/flows/simulationViewFlow';

describe('ReportViewFlow', () => {
  test('given ReportViewFlow then has correct structure', () => {
    // Then
    expect(ReportViewFlow).toBeDefined();
    expect(ReportViewFlow.initialFrame).toBe('ReportReadView');
    expect(ReportViewFlow.frames).toBeDefined();
  });

  test('given ReportViewFlow then has ReportReadView frame', () => {
    // Then
    expect(ReportViewFlow.frames.ReportReadView).toBeDefined();
    expect(ReportViewFlow.frames.ReportReadView.component).toBe('ReportReadView');
    expect(ReportViewFlow.frames.ReportReadView.on).toBeDefined();
    expect(ReportViewFlow.frames.ReportReadView.on.next).toBe('__return__');
  });

  test('given ReportViewFlow then is valid flow structure', () => {
    // Then
    expect(ReportViewFlow).toHaveProperty('initialFrame');
    expect(ReportViewFlow).toHaveProperty('frames');
    expect(typeof ReportViewFlow.initialFrame).toBe('string');
    expect(typeof ReportViewFlow.frames).toBe('object');
  });

  test('given ReportViewFlow then follows same pattern as SimulationViewFlow', () => {
    // Then
    expect(ReportViewFlow.initialFrame).toBeDefined();
    expect(SimulationViewFlow.initialFrame).toBeDefined();

    if (ReportViewFlow.initialFrame && SimulationViewFlow.initialFrame) {
      expect(ReportViewFlow.initialFrame.replace('Report', 'Simulation')).toBe(
        SimulationViewFlow.initialFrame
      );
    }

    expect(Object.keys(ReportViewFlow.frames).length).toBe(
      Object.keys(SimulationViewFlow.frames).length
    );

    // Both should have single frame with __return__ action
    const reportFrame = ReportViewFlow.frames.ReportReadView;
    const simulationFrame = SimulationViewFlow.frames.SimulationReadView;
    expect(reportFrame.on.next).toBe(simulationFrame.on.next);
    expect(reportFrame.on.next).toBe('__return__');
  });
});
