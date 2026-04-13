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
  V2HouseholdShape,
  V2StoredHouseholdEnvelope,
} from './household/v2Types';
import {
  buildCanonicalSetupFromStructuredState,
  buildStructuredHouseholdDataFromCanonicalSetup,
  buildStructuredStateFromCanonicalSetup,
  cloneValue,
  deepEqual,
  inferYearFromData,
  normalizeCanonicalSetup,
  normalizeCountryId,
} from './household/utils';
import {
  buildAppHouseholdData,
  buildV1PayloadData,
  parseAppHouseholdData,
  parseV1HouseholdData,
} from './household/v1Codec';
import {
  buildV2CreateRequest,
  buildV2HouseholdShape,
  parseV2HouseholdShape,
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

  private toStructuredState() {
    return buildStructuredStateFromCanonicalSetup({
      id: this.id,
      setup: this.setup,
    });
  }

  private toStructuredData() {
    return buildStructuredHouseholdDataFromCanonicalSetup(this.setup);
  }

  get data(): CanonicalHouseholdInputData {
    return buildAppHouseholdData(this.toStructuredData());
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
      buildCanonicalSetupFromStructuredState({
        countryId: normalizeCountryId(input.countryId),
        label: input.label ?? null,
        year: input.year ?? inferYearFromData(input.householdData),
        data: parseAppHouseholdData(input.householdData),
      }),
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
    return Household.fromV1Payload({
      id: String(metadata.id),
      countryId: metadata.country_id,
      householdData: metadata.household_json,
      label: metadata.label ?? null,
    });
  }

  static fromV1CreationPayload(
    payload: V1HouseholdCreateEnvelope,
    options: {
      id?: string;
      label?: string | null;
    } = {}
  ): Household {
    return Household.fromV1Payload({
      id: options.id ?? 'draft-household',
      countryId: payload.country_id,
      householdData: payload.data,
      label: options.label ?? payload.label ?? null,
    });
  }

  static fromV1Payload(args: {
    id: string;
    countryId: string;
    householdData: V1HouseholdCreateEnvelope['data'];
    label?: string | null;
  }): Household {
    return Household.fromCanonical(
      buildCanonicalSetupFromStructuredState({
        countryId: normalizeCountryId(args.countryId),
        label: args.label ?? null,
        year: null,
        data: parseV1HouseholdData(args.householdData),
      }),
      { id: String(args.id) }
    );
  }

  static fromV2Response(response: V2StoredHouseholdEnvelope): Household {
    return Household.fromV2Shape(response);
  }

  static fromV2Shape(shape: V2StoredHouseholdEnvelope | V2HouseholdShape): Household {
    return Household.fromCanonical(
      buildCanonicalSetupFromStructuredState({
        countryId: normalizeCountryId(shape.country_id),
        label: shape.label ?? null,
        year: shape.year ?? null,
        data: parseV2HouseholdShape(shape),
      }),
      { id: shape.id }
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
    return {
      country_id: this.countryId,
      data: buildV1PayloadData(this.toStructuredData()),
      label: this.label ?? undefined,
    };
  }

  toV2CreateRequest(): V2CreateHouseholdEnvelope {
    return buildV2CreateRequest(this.toStructuredState());
  }

  toV2Shape(): V2HouseholdShape {
    return buildV2HouseholdShape(this.toStructuredState());
  }

  toComparable(): ComparableHousehold {
    return buildComparableHousehold(this.toStructuredState());
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
