import type { CountryId } from '@/libs/countries';
import { BaseModel } from './BaseModel';
import { buildComparableHousehold } from './household/comparable';
import type {
  CanonicalHouseholdInputData,
  CanonicalHouseholdInputEnvelope,
  CanonicalHouseholdSetup,
  ComparableHousehold,
  HouseholdModelData,
} from './household/canonicalTypes';
import type { V1HouseholdCreateEnvelope, V1HouseholdMetadataEnvelope } from './household/v1Types';
import type {
  V2CreateHouseholdEnvelope,
  V2StoredHouseholdEnvelope,
} from './household/v2Types';
import {
  cloneValue,
  deepEqual,
  inferYearFromData,
  normalizeCanonicalSetup,
} from './household/utils';
import { buildAppHouseholdData, parseAppHouseholdInput } from './household/appCodec';
import {
  buildV1CreateEnvelope,
  parseV1CreateEnvelope,
  parseV1MetadataEnvelope,
} from './household/v1Codec';
import {
  buildV2CreateEnvelope,
  parseV2HouseholdEnvelope,
} from './household/v2Codec';

export type { ComparableHousehold, HouseholdModelData } from './household/canonicalTypes';
export type { HouseholdInput } from './household/types';

export class Household extends BaseModel<HouseholdModelData> {
  readonly id: string;

  private readonly setup: CanonicalHouseholdSetup;

  private constructor(args: { id: string; setup: CanonicalHouseholdSetup }) {
    super();

    if (!args.id) {
      throw new Error('Household requires an id');
    }

    this.id = args.id;
    this.setup = normalizeCanonicalSetup(args.setup);
  }

  get countryId(): CountryId {
    return this.setup.countryId;
  }

  get label(): string | null {
    return this.setup.label;
  }

  get year(): number | null {
    return this.setup.year;
  }

  get data(): CanonicalHouseholdInputData {
    return buildAppHouseholdData(this.setup);
  }

  get householdData(): CanonicalHouseholdInputData {
    return this.data;
  }

  get people(): CanonicalHouseholdInputData['people'] {
    return cloneValue(this.data.people);
  }

  get personCount(): number {
    return Object.keys(this.setup.people).length;
  }

  get personNames(): string[] {
    return Object.keys(this.setup.people);
  }

  static fromCanonical(
    setup: CanonicalHouseholdSetup,
    options: {
      id?: string;
    } = {}
  ): Household {
    const normalizedSetup = normalizeCanonicalSetup(setup);

    return new Household({
      id: options.id ?? 'draft-household',
      setup: {
        ...normalizedSetup,
        year: normalizedSetup.year ?? inferYearFromData(normalizedSetup),
      },
    });
  }

  static fromInput(input: CanonicalHouseholdInputEnvelope): Household {
    return Household.fromCanonical(
      parseAppHouseholdInput(input),
      { id: input.id ?? 'draft-household' }
    );
  }

  static fromDraft(args: {
    countryId: CanonicalHouseholdInputEnvelope['countryId'];
    householdData: CanonicalHouseholdInputData;
    label?: string | null;
    year?: number | null;
    id?: string;
  }): Household {
    return Household.fromInput({
      id: args.id,
      countryId: args.countryId,
      householdData: args.householdData,
      label: args.label,
      year: args.year,
    });
  }

  static fromV1Metadata(metadata: V1HouseholdMetadataEnvelope): Household {
    return Household.fromCanonical(parseV1MetadataEnvelope(metadata), {
      id: String(metadata.id),
    });
  }

  static fromV1CreationPayload(
    payload: V1HouseholdCreateEnvelope,
    options: {
      id?: string;
      label?: string | null;
    } = {}
  ): Household {
    return Household.fromCanonical(
      {
        ...parseV1CreateEnvelope(payload),
        label: options.label ?? payload.label ?? null,
      },
      { id: options.id ?? 'draft-household' }
    );
  }

  static fromV2Response(response: V2StoredHouseholdEnvelope): Household {
    return Household.fromCanonical(parseV2HouseholdEnvelope(response), {
      id: response.id,
    });
  }

  static fromV2CreateEnvelope(envelope: V2CreateHouseholdEnvelope): Household {
    return Household.fromCanonical(
      parseV2HouseholdEnvelope(envelope),
      { id: 'draft-household' }
    );
  }

  withId(id: string): Household {
    return Household.fromCanonical(this.toCanonical(), { id });
  }

  withLabel(label: string | null): Household {
    return Household.fromCanonical(
      {
        ...this.toCanonical(),
        label,
      },
      { id: this.id }
    );
  }

  toCanonical(): CanonicalHouseholdSetup {
    return cloneValue(this.setup);
  }

  toV1CreationPayload(): V1HouseholdCreateEnvelope {
    return buildV1CreateEnvelope(this.toCanonical());
  }

  toV2CreateRequest(): V2CreateHouseholdEnvelope {
    return buildV2CreateEnvelope(this.toCanonical());
  }

  toV2Shape(): V2CreateHouseholdEnvelope {
    return this.toV2CreateRequest();
  }

  toComparable(): ComparableHousehold {
    return buildComparableHousehold({
      id: this.id,
      setup: this.setup,
    });
  }

  toJSON(): HouseholdModelData {
    return {
      id: this.id,
      countryId: this.countryId,
      label: this.label,
      year: this.year,
      data: this.data,
    };
  }

  isEqual(other: Household): boolean {
    return deepEqual(
      { id: this.id, setup: this.setup },
      { id: other.id, setup: other.toCanonical() }
    );
  }
}
