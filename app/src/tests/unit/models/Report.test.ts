import { describe, expect, it } from 'vitest';
import { Report } from '@/models/Report';
import {
  BASELINE_ONLY_REPORT_DATA,
  COMPLETE_REPORT_DATA,
  ECONOMY_REPORT_DATA,
  ERROR_REPORT_DATA,
  HOUSEHOLD_REPORT_DATA,
  PENDING_REPORT_DATA,
} from '@/tests/fixtures/models/shared';

describe('Report', () => {
  describe('constructor', () => {
    it('given valid data then sets all fields correctly', () => {
      // Given
      const data = HOUSEHOLD_REPORT_DATA;

      // When
      const report = new Report(data);

      // Then
      expect(report.id).toBe(data.id);
      expect(report.countryId).toBe(data.countryId);
      expect(report.year).toBe(data.year);
      expect(report.outputType).toBe(data.outputType);
      expect(report.status).toBe(data.status);
      expect(report.label).toBe(data.label ?? null);
      expect(report.output).toBe(data.output ?? null);
    });

    it('given no id then throws error', () => {
      // Given
      const data = { ...HOUSEHOLD_REPORT_DATA, id: '' };

      // When / Then
      expect(() => new Report(data)).toThrow('Report requires an id');
    });

    it('given empty simulationIds then throws error', () => {
      // Given
      const data = { ...HOUSEHOLD_REPORT_DATA, simulationIds: [] };

      // When / Then
      expect(() => new Report(data)).toThrow('Report requires at least one simulationId');
    });

    it('given data without label then defaults label to null', () => {
      // Given
      const { label: _, ...dataWithoutLabel } = HOUSEHOLD_REPORT_DATA;

      // When
      const report = new Report(dataWithoutLabel);

      // Then
      expect(report.label).toBeNull();
    });

    it('given data without output then defaults output to null', () => {
      // Given
      const { output: _, ...dataWithoutOutput } = HOUSEHOLD_REPORT_DATA;

      // When
      const report = new Report(dataWithoutOutput);

      // Then
      expect(report.output).toBeNull();
    });
  });

  describe('simulationIds getter', () => {
    it('given report then returns readonly array of simulation ids', () => {
      // Given / When
      const report = new Report(HOUSEHOLD_REPORT_DATA);

      // Then
      expect(report.simulationIds).toEqual(HOUSEHOLD_REPORT_DATA.simulationIds);
    });

    it('given report then simulationIds is a defensive copy', () => {
      // Given
      const originalIds = [...HOUSEHOLD_REPORT_DATA.simulationIds];
      const data = {
        ...HOUSEHOLD_REPORT_DATA,
        simulationIds: [...HOUSEHOLD_REPORT_DATA.simulationIds],
      };
      const report = new Report(data);

      // When - mutate the data array passed to constructor
      data.simulationIds.push('injected-id');

      // Then - report is unaffected
      expect(report.simulationIds).toEqual(originalIds);
    });
  });

  describe('status getter', () => {
    it('given pending report then status returns pending', () => {
      // Given / When
      const report = new Report(PENDING_REPORT_DATA);

      // Then
      expect(report.status).toBe('pending');
    });

    it('given complete report then status returns complete', () => {
      // Given / When
      const report = new Report(COMPLETE_REPORT_DATA);

      // Then
      expect(report.status).toBe('complete');
    });
  });

  describe('label getter', () => {
    it('given report with label then returns the label', () => {
      // Given
      const data = { ...HOUSEHOLD_REPORT_DATA, label: 'My report' };

      // When
      const report = new Report(data);

      // Then
      expect(report.label).toBe('My report');
    });
  });

  describe('output getter', () => {
    it('given report with output then returns the output', () => {
      // Given
      const output = { budget: { total: 200 } };
      const data = { ...COMPLETE_REPORT_DATA, output };

      // When
      const report = new Report(data);

      // Then
      expect(report.output).toEqual(output);
    });
  });

  describe('isHouseholdReport', () => {
    it('given outputType is household then returns true', () => {
      // Given / When
      const report = new Report(HOUSEHOLD_REPORT_DATA);

      // Then
      expect(report.isHouseholdReport).toBe(true);
    });

    it('given outputType is economy then returns false', () => {
      // Given / When
      const report = new Report(ECONOMY_REPORT_DATA);

      // Then
      expect(report.isHouseholdReport).toBe(false);
    });
  });

  describe('isEconomyReport', () => {
    it('given outputType is economy then returns true', () => {
      // Given / When
      const report = new Report(ECONOMY_REPORT_DATA);

      // Then
      expect(report.isEconomyReport).toBe(true);
    });

    it('given outputType is household then returns false', () => {
      // Given / When
      const report = new Report(HOUSEHOLD_REPORT_DATA);

      // Then
      expect(report.isEconomyReport).toBe(false);
    });
  });

  describe('isComplete', () => {
    it('given status is complete then returns true', () => {
      // Given / When
      const report = new Report(COMPLETE_REPORT_DATA);

      // Then
      expect(report.isComplete).toBe(true);
    });

    it('given status is pending then returns false', () => {
      // Given / When
      const report = new Report(PENDING_REPORT_DATA);

      // Then
      expect(report.isComplete).toBe(false);
    });
  });

  describe('isPending', () => {
    it('given status is pending then returns true', () => {
      // Given / When
      const report = new Report(PENDING_REPORT_DATA);

      // Then
      expect(report.isPending).toBe(true);
    });

    it('given status is complete then returns false', () => {
      // Given / When
      const report = new Report(COMPLETE_REPORT_DATA);

      // Then
      expect(report.isPending).toBe(false);
    });
  });

  describe('isError', () => {
    it('given status is error then returns true', () => {
      // Given / When
      const report = new Report(ERROR_REPORT_DATA);

      // Then
      expect(report.isError).toBe(true);
    });

    it('given status is complete then returns false', () => {
      // Given / When
      const report = new Report(COMPLETE_REPORT_DATA);

      // Then
      expect(report.isError).toBe(false);
    });
  });

  describe('baselineSimulationId', () => {
    it('given report then returns first simulationId', () => {
      // Given / When
      const report = new Report(HOUSEHOLD_REPORT_DATA);

      // Then
      expect(report.baselineSimulationId).toBe(HOUSEHOLD_REPORT_DATA.simulationIds[0]);
    });
  });

  describe('reformSimulationId', () => {
    it('given report with two simulationIds then returns second element', () => {
      // Given / When
      const report = new Report(HOUSEHOLD_REPORT_DATA);

      // Then
      expect(report.reformSimulationId).toBe(HOUSEHOLD_REPORT_DATA.simulationIds[1]);
    });

    it('given report with one simulationId then returns null', () => {
      // Given / When
      const report = new Report(BASELINE_ONLY_REPORT_DATA);

      // Then
      expect(report.reformSimulationId).toBeNull();
    });
  });

  describe('hasReform', () => {
    it('given two or more simulationIds then returns true', () => {
      // Given / When
      const report = new Report(HOUSEHOLD_REPORT_DATA);

      // Then
      expect(report.hasReform).toBe(true);
    });

    it('given one simulationId then returns false', () => {
      // Given / When
      const report = new Report(BASELINE_ONLY_REPORT_DATA);

      // Then
      expect(report.hasReform).toBe(false);
    });
  });

  describe('label setter', () => {
    it('given new label then updates label', () => {
      // Given
      const report = new Report(HOUSEHOLD_REPORT_DATA);

      // When
      report.label = 'Renamed report';

      // Then
      expect(report.label).toBe('Renamed report');
    });

    it('given null then clears label', () => {
      // Given
      const report = new Report({
        ...HOUSEHOLD_REPORT_DATA,
        label: 'Some label',
      });

      // When
      report.label = null;

      // Then
      expect(report.label).toBeNull();
    });
  });

  describe('toJSON', () => {
    it('given report then returns plain data object', () => {
      // Given
      const data = HOUSEHOLD_REPORT_DATA;
      const report = new Report(data);

      // When
      const json = report.toJSON();

      // Then
      expect(json).toEqual({
        id: data.id,
        countryId: data.countryId,
        year: data.year,
        simulationIds: data.simulationIds,
        status: data.status,
        outputType: data.outputType,
        label: data.label ?? null,
        output: data.output ?? null,
      });
    });

    it('given report then toJSON roundtrips through constructor', () => {
      // Given
      const original = new Report(ECONOMY_REPORT_DATA);

      // When
      const roundtripped = new Report(original.toJSON());

      // Then
      expect(roundtripped.id).toBe(original.id);
      expect(roundtripped.countryId).toBe(original.countryId);
      expect(roundtripped.year).toBe(original.year);
      expect(roundtripped.outputType).toBe(original.outputType);
      expect(roundtripped.simulationIds).toEqual(original.simulationIds);
      expect(roundtripped.status).toBe(original.status);
      expect(roundtripped.label).toBe(original.label);
      expect(roundtripped.output).toEqual(original.output);
    });

    it('given report then toJSON simulationIds is a fresh copy', () => {
      // Given
      const report = new Report(HOUSEHOLD_REPORT_DATA);

      // When
      const json1 = report.toJSON();
      const json2 = report.toJSON();

      // Then - each call returns a distinct array
      expect(json1.simulationIds).not.toBe(json2.simulationIds);
      expect(json1.simulationIds).toEqual(json2.simulationIds);
    });
  });

  describe('isEqual', () => {
    it('given same id and status then returns true', () => {
      // Given
      const report1 = new Report(PENDING_REPORT_DATA);
      const report2 = new Report(PENDING_REPORT_DATA);

      // When / Then
      expect(report1.isEqual(report2)).toBe(true);
    });

    it('given same id but different status then returns false', () => {
      // Given
      const report1 = new Report(PENDING_REPORT_DATA);
      const report2 = new Report({
        ...PENDING_REPORT_DATA,
        status: 'complete',
      });

      // When / Then
      expect(report1.isEqual(report2)).toBe(false);
    });

    it('given different id but same status then returns false', () => {
      // Given
      const report1 = new Report(PENDING_REPORT_DATA);
      const report2 = new Report({
        ...PENDING_REPORT_DATA,
        id: 'different-report-id',
      });

      // When / Then
      expect(report1.isEqual(report2)).toBe(false);
    });
  });
});
