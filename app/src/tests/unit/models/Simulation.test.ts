import { describe, expect, it } from 'vitest';
import { Simulation } from '@/models/Simulation';
import {
  BASELINE_SIMULATION_DATA,
  COMPLETE_SIMULATION_DATA,
  ECONOMY_SIMULATION_DATA,
  ERROR_SIMULATION_DATA,
  HOUSEHOLD_SIMULATION_DATA,
  PENDING_SIMULATION_DATA,
  REFORM_SIMULATION_DATA,
  RUNNING_SIMULATION_DATA,
} from '@/tests/fixtures/models/shared';

describe('Simulation', () => {
  describe('constructor', () => {
    it('given valid data then sets all fields correctly', () => {
      // Given
      const data = BASELINE_SIMULATION_DATA;

      // When
      const sim = new Simulation(data);

      // Then
      expect(sim.id).toBe(data.id);
      expect(sim.countryId).toBe(data.countryId);
      expect(sim.populationType).toBe(data.populationType);
      expect(sim.isCreated).toBe(data.isCreated);
      expect(sim.policyId).toBe(data.policyId);
      expect(sim.populationId).toBe(data.populationId);
      expect(sim.status).toBe(data.status);
      expect(sim.label).toBe(data.label);
      expect(sim.output).toBeNull();
    });

    it('given data with output then stores output', () => {
      // Given
      const output = { income: 50000 };
      const data = { ...COMPLETE_SIMULATION_DATA, output };

      // When
      const sim = new Simulation(data);

      // Then
      expect(sim.output).toEqual(output);
    });

    it('given data without output then defaults output to null', () => {
      // Given
      const { output: _, ...dataWithoutOutput } = {
        ...BASELINE_SIMULATION_DATA,
        output: undefined,
      };

      // When
      const sim = new Simulation(dataWithoutOutput);

      // Then
      expect(sim.output).toBeNull();
    });
  });

  describe('getters', () => {
    it('given simulation then policyId getter returns correct value', () => {
      // Given / When
      const sim = new Simulation(REFORM_SIMULATION_DATA);

      // Then
      expect(sim.policyId).toBe(REFORM_SIMULATION_DATA.policyId);
    });

    it('given simulation then populationId getter returns correct value', () => {
      // Given / When
      const sim = new Simulation(BASELINE_SIMULATION_DATA);

      // Then
      expect(sim.populationId).toBe(BASELINE_SIMULATION_DATA.populationId);
    });

    it('given simulation then status getter returns correct value', () => {
      // Given / When
      const sim = new Simulation(PENDING_SIMULATION_DATA);

      // Then
      expect(sim.status).toBe('pending');
    });

    it('given simulation with label then label getter returns it', () => {
      // Given / When
      const sim = new Simulation(REFORM_SIMULATION_DATA);

      // Then
      expect(sim.label).toBe(REFORM_SIMULATION_DATA.label);
    });

    it('given simulation with output then output getter returns it', () => {
      // Given
      const output = { budget: { total: 100 } };
      const sim = new Simulation({ ...COMPLETE_SIMULATION_DATA, output });

      // Then
      expect(sim.output).toEqual(output);
    });
  });

  describe('isBaseline', () => {
    it('given policyId is null then returns true', () => {
      // Given / When
      const sim = new Simulation(BASELINE_SIMULATION_DATA);

      // Then
      expect(sim.isBaseline).toBe(true);
    });

    it('given policyId is not null then returns false', () => {
      // Given / When
      const sim = new Simulation(REFORM_SIMULATION_DATA);

      // Then
      expect(sim.isBaseline).toBe(false);
    });
  });

  describe('isReform', () => {
    it('given policyId is not null then returns true', () => {
      // Given / When
      const sim = new Simulation(REFORM_SIMULATION_DATA);

      // Then
      expect(sim.isReform).toBe(true);
    });

    it('given policyId is null then returns false', () => {
      // Given / When
      const sim = new Simulation(BASELINE_SIMULATION_DATA);

      // Then
      expect(sim.isReform).toBe(false);
    });
  });

  describe('isHousehold', () => {
    it('given populationType is household then returns true', () => {
      // Given / When
      const sim = new Simulation(HOUSEHOLD_SIMULATION_DATA);

      // Then
      expect(sim.isHousehold).toBe(true);
    });

    it('given populationType is geography then returns false', () => {
      // Given / When
      const sim = new Simulation(ECONOMY_SIMULATION_DATA);

      // Then
      expect(sim.isHousehold).toBe(false);
    });
  });

  describe('isEconomy', () => {
    it('given populationType is geography then returns true', () => {
      // Given / When
      const sim = new Simulation(ECONOMY_SIMULATION_DATA);

      // Then
      expect(sim.isEconomy).toBe(true);
    });

    it('given populationType is household then returns false', () => {
      // Given / When
      const sim = new Simulation(HOUSEHOLD_SIMULATION_DATA);

      // Then
      expect(sim.isEconomy).toBe(false);
    });
  });

  describe('isComplete', () => {
    it('given status is complete then returns true', () => {
      // Given / When
      const sim = new Simulation(COMPLETE_SIMULATION_DATA);

      // Then
      expect(sim.isComplete).toBe(true);
    });

    it('given status is pending then returns false', () => {
      // Given / When
      const sim = new Simulation(PENDING_SIMULATION_DATA);

      // Then
      expect(sim.isComplete).toBe(false);
    });
  });

  describe('isPending', () => {
    it('given status is pending then returns true', () => {
      // Given / When
      const sim = new Simulation(PENDING_SIMULATION_DATA);

      // Then
      expect(sim.isPending).toBe(true);
    });

    it('given status is running then returns true', () => {
      // Given / When
      const sim = new Simulation(RUNNING_SIMULATION_DATA);

      // Then
      expect(sim.isPending).toBe(true);
    });

    it('given status is complete then returns false', () => {
      // Given / When
      const sim = new Simulation(COMPLETE_SIMULATION_DATA);

      // Then
      expect(sim.isPending).toBe(false);
    });
  });

  describe('isError', () => {
    it('given status is error then returns true', () => {
      // Given / When
      const sim = new Simulation(ERROR_SIMULATION_DATA);

      // Then
      expect(sim.isError).toBe(true);
    });

    it('given status is complete then returns false', () => {
      // Given / When
      const sim = new Simulation(COMPLETE_SIMULATION_DATA);

      // Then
      expect(sim.isError).toBe(false);
    });
  });

  describe('label setter', () => {
    it('given new label then updates label', () => {
      // Given
      const sim = new Simulation(BASELINE_SIMULATION_DATA);

      // When
      sim.label = 'Updated label';

      // Then
      expect(sim.label).toBe('Updated label');
    });

    it('given null then clears label', () => {
      // Given
      const sim = new Simulation(REFORM_SIMULATION_DATA);

      // When
      sim.label = null;

      // Then
      expect(sim.label).toBeNull();
    });
  });

  describe('status setter - valid transitions', () => {
    it('given pending status then transition to running succeeds', () => {
      // Given
      const sim = new Simulation(PENDING_SIMULATION_DATA);

      // When
      sim.status = 'running';

      // Then
      expect(sim.status).toBe('running');
    });

    it('given pending status then transition to complete succeeds', () => {
      // Given
      const sim = new Simulation(PENDING_SIMULATION_DATA);

      // When
      sim.status = 'complete';

      // Then
      expect(sim.status).toBe('complete');
    });

    it('given pending status then transition to error succeeds', () => {
      // Given
      const sim = new Simulation(PENDING_SIMULATION_DATA);

      // When
      sim.status = 'error';

      // Then
      expect(sim.status).toBe('error');
    });

    it('given running status then transition to complete succeeds', () => {
      // Given
      const sim = new Simulation(RUNNING_SIMULATION_DATA);

      // When
      sim.status = 'complete';

      // Then
      expect(sim.status).toBe('complete');
    });

    it('given running status then transition to error succeeds', () => {
      // Given
      const sim = new Simulation(RUNNING_SIMULATION_DATA);

      // When
      sim.status = 'error';

      // Then
      expect(sim.status).toBe('error');
    });
  });

  describe('status setter - invalid transitions', () => {
    it('given complete status then transition to pending throws', () => {
      // Given
      const sim = new Simulation(COMPLETE_SIMULATION_DATA);

      // When / Then
      expect(() => {
        sim.status = 'pending';
      }).toThrow('Invalid status transition: complete');
    });

    it('given complete status then transition to running throws', () => {
      // Given
      const sim = new Simulation(COMPLETE_SIMULATION_DATA);

      // When / Then
      expect(() => {
        sim.status = 'running';
      }).toThrow('Invalid status transition: complete');
    });

    it('given error status then transition to running throws', () => {
      // Given
      const sim = new Simulation(ERROR_SIMULATION_DATA);

      // When / Then
      expect(() => {
        sim.status = 'running';
      }).toThrow('Invalid status transition: error');
    });

    it('given error status then transition to pending throws', () => {
      // Given
      const sim = new Simulation(ERROR_SIMULATION_DATA);

      // When / Then
      expect(() => {
        sim.status = 'pending';
      }).toThrow('Invalid status transition: error');
    });

    it('given running status then transition to pending throws', () => {
      const sim = new Simulation(RUNNING_SIMULATION_DATA);
      expect(() => {
        sim.status = 'pending';
      }).toThrow('Invalid status transition: running');
    });

    it('given pending status then self-transition throws', () => {
      const sim = new Simulation(PENDING_SIMULATION_DATA);
      expect(() => {
        sim.status = 'pending';
      }).toThrow('Invalid status transition: pending');
    });

    it('given complete status then self-transition throws', () => {
      const sim = new Simulation(COMPLETE_SIMULATION_DATA);
      expect(() => {
        sim.status = 'complete';
      }).toThrow('Invalid status transition: complete');
    });

    it('given error status then self-transition throws', () => {
      const sim = new Simulation(ERROR_SIMULATION_DATA);
      expect(() => {
        sim.status = 'error';
      }).toThrow('Invalid status transition: error');
    });

    it('given complete status then transition to error throws', () => {
      const sim = new Simulation(COMPLETE_SIMULATION_DATA);
      expect(() => {
        sim.status = 'error';
      }).toThrow('Invalid status transition: complete');
    });

    it('given error status then transition to complete throws', () => {
      const sim = new Simulation(ERROR_SIMULATION_DATA);
      expect(() => {
        sim.status = 'complete';
      }).toThrow('Invalid status transition: error');
    });
  });

  describe('toJSON', () => {
    it('given simulation then returns plain data object', () => {
      // Given
      const data = REFORM_SIMULATION_DATA;
      const sim = new Simulation(data);

      // When
      const json = sim.toJSON();

      // Then
      expect(json).toEqual({
        ...data,
        output: data.output ?? null,
      });
    });

    it('given simulation then toJSON roundtrips through constructor', () => {
      // Given
      const original = new Simulation(REFORM_SIMULATION_DATA);

      // When
      const roundtripped = new Simulation(original.toJSON());

      // Then
      expect(roundtripped.id).toBe(original.id);
      expect(roundtripped.countryId).toBe(original.countryId);
      expect(roundtripped.policyId).toBe(original.policyId);
      expect(roundtripped.populationId).toBe(original.populationId);
      expect(roundtripped.populationType).toBe(original.populationType);
      expect(roundtripped.status).toBe(original.status);
      expect(roundtripped.label).toBe(original.label);
      expect(roundtripped.isCreated).toBe(original.isCreated);
      expect(roundtripped.output).toEqual(original.output);
    });
  });

  describe('isEqual', () => {
    it('given same id and status then returns true', () => {
      // Given
      const sim1 = new Simulation(PENDING_SIMULATION_DATA);
      const sim2 = new Simulation(PENDING_SIMULATION_DATA);

      // When / Then
      expect(sim1.isEqual(sim2)).toBe(true);
    });

    it('given same id but different status then returns false', () => {
      // Given
      const sim1 = new Simulation(PENDING_SIMULATION_DATA);
      const sim2 = new Simulation({
        ...PENDING_SIMULATION_DATA,
        status: 'complete',
      });

      // When / Then
      expect(sim1.isEqual(sim2)).toBe(false);
    });

    it('given different id but same status then returns false', () => {
      // Given
      const sim1 = new Simulation(PENDING_SIMULATION_DATA);
      const sim2 = new Simulation({
        ...PENDING_SIMULATION_DATA,
        id: 'different-id',
      });

      // When / Then
      expect(sim1.isEqual(sim2)).toBe(false);
    });
  });
});
