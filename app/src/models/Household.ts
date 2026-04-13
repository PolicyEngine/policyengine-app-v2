import type { V2HouseholdShape } from '@/api/v2/householdCalculation';
import type { HouseholdV2CreateRequest, HouseholdV2Response } from '@/api/v2/households';
import type { CountryId } from '@/libs/countries';
import type { HouseholdData as IngredientHouseholdData } from '@/types/ingredients/Household';
import type { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import type { HouseholdCreationPayload } from '@/types/payloads';
import { BaseModel } from './BaseModel';
import { buildComparableHousehold } from './household/comparable';
import type {
  ComparableHousehold,
  HouseholdInput,
  HouseholdModelData,
  HouseholdV2Source,
} from './household/types';
import { cloneValue, deepEqual, inferYearFromData, normalizeCountryId } from './household/utils';
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

export type { ComparableHousehold, HouseholdInput, HouseholdModelData } from './household/types';

export class Household extends BaseModel<HouseholdModelData> {
  readonly id: string;
  readonly countryId: CountryId;
  readonly label: string | null;
  readonly year: number | null;

  private readonly canonicalData: ReturnType<typeof parseAppHouseholdData>;

  constructor(data: HouseholdModelData) {
    super();

    if (!data.id) {
      throw new Error('Household requires an id');
    }

    const countryId = normalizeCountryId(data.countryId);
    const canonicalData = parseAppHouseholdData(data.data);

    this.id = data.id;
    this.countryId = countryId;
    this.label = data.label ?? null;
    this.year = data.year ?? inferYearFromData(canonicalData);
    this.canonicalData = canonicalData;
  }

  private toCanonicalState() {
    return {
      id: this.id,
      countryId: this.countryId,
      label: this.label,
      year: this.year,
      data: this.canonicalData,
    };
  }

  get data(): IngredientHouseholdData {
    return buildAppHouseholdData(this.canonicalData);
  }

  get householdData(): IngredientHouseholdData {
    return this.data;
  }

  get people(): IngredientHouseholdData['people'] {
    return cloneValue(this.canonicalData.people);
  }

  get personCount(): number {
    return Object.keys(this.canonicalData.people).length;
  }

  get personNames(): string[] {
    return Object.keys(this.canonicalData.people);
  }

  static fromInput(input: HouseholdInput): Household {
    return new Household({
      id: input.id ?? 'draft-household',
      countryId: normalizeCountryId(input.countryId),
      label: input.label ?? null,
      year: input.year ?? inferYearFromData(input.householdData),
      data: input.householdData,
    });
  }

  static fromDraft(args: {
    countryId: HouseholdInput['countryId'];
    householdData: IngredientHouseholdData;
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

  static fromV1Metadata(metadata: HouseholdMetadata): Household {
    return Household.fromV1Payload({
      id: String(metadata.id),
      countryId: metadata.country_id,
      householdData: metadata.household_json,
      label: metadata.label ?? null,
    });
  }

  static fromV1CreationPayload(
    payload: HouseholdCreationPayload,
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
    householdData: HouseholdCreationPayload['data'];
    label?: string | null;
  }): Household {
    const canonicalData = parseV1HouseholdData(args.householdData);

    return new Household({
      id: String(args.id),
      countryId: normalizeCountryId(args.countryId),
      label: args.label ?? null,
      year: inferYearFromData(canonicalData),
      data: buildAppHouseholdData(canonicalData),
    });
  }

  static fromV2Response(response: HouseholdV2Response): Household {
    return Household.fromV2Shape(response);
  }

  static fromV2Shape(shape: HouseholdV2Source): Household {
    const canonicalData = parseV2HouseholdShape(shape);

    return new Household({
      id: shape.id,
      countryId: normalizeCountryId(shape.country_id),
      label: shape.label ?? null,
      year: shape.year ?? inferYearFromData(canonicalData),
      data: buildAppHouseholdData(canonicalData),
    });
  }

  withId(id: string): Household {
    return new Household({
      ...this.toJSON(),
      id,
    });
  }

  withLabel(label: string | null): Household {
    return new Household({
      ...this.toJSON(),
      label,
    });
  }

  toV1CreationPayload(): HouseholdCreationPayload {
    return {
      country_id: this.countryId,
      data: buildV1PayloadData(this.canonicalData),
      label: this.label ?? undefined,
    };
  }

  toV2CreateRequest(): HouseholdV2CreateRequest {
    return buildV2CreateRequest(this.toCanonicalState());
  }

  toV2Shape(): V2HouseholdShape {
    return buildV2HouseholdShape(this.toCanonicalState());
  }

  toComparable(): ComparableHousehold {
    return buildComparableHousehold(this.toCanonicalState());
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
    return deepEqual(this.toCanonicalState(), other.toCanonicalState());
  }
}
