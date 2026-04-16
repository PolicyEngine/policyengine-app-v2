import type { CountryId } from '@/libs/countries';
import { BaseModel } from './BaseModel';
import {
  buildAppHouseholdDataFromV1Data,
  buildV1CreateEnvelopeFromAppInput,
  cloneAppHouseholdInputData,
} from './household/appCodec';
import type {
  AppHouseholdInputData,
  AppHouseholdInputEnvelope,
  ComparableHousehold,
  HouseholdModelData,
} from './household/appTypes';
import { buildComparableHousehold } from './household/comparable';
import { cloneValue, deepEqual, inferYearFromData, normalizeCountryId } from './household/utils';
import type { V1HouseholdCreateEnvelope, V1HouseholdMetadataEnvelope } from './household/v1Types';
import { buildV2CreateEnvelope, parseV2HouseholdEnvelope } from './household/v2Codec';
import type { V2CreateHouseholdEnvelope, V2StoredHouseholdEnvelope } from './household/v2Types';

export type { ComparableHousehold, HouseholdModelData } from './household/appTypes';

export class Household extends BaseModel<HouseholdModelData> {
  readonly id: string;

  private readonly countryIdValue: CountryId;

  private readonly labelValue: string | null;

  private readonly yearValue: number | null;

  private readonly appInputData: AppHouseholdInputData;

  private constructor(args: {
    id: string;
    countryId: CountryId;
    label?: string | null;
    year?: number | null;
    appInputData: AppHouseholdInputData;
  }) {
    super();

    if (!args.id) {
      throw new Error('Household requires an id');
    }

    this.id = args.id;
    this.countryIdValue = normalizeCountryId(args.countryId);
    this.labelValue = args.label ?? null;
    this.yearValue = args.year ?? null;
    this.appInputData = cloneAppHouseholdInputData(args.appInputData);
  }

  get countryId(): CountryId {
    return this.countryIdValue;
  }

  get label(): string | null {
    return this.labelValue;
  }

  get year(): number | null {
    return this.yearValue;
  }

  get householdData(): AppHouseholdInputData {
    return cloneValue(this.appInputData);
  }

  get people(): AppHouseholdInputData['people'] {
    return cloneValue(this.appInputData.people);
  }

  get personCount(): number {
    return Object.keys(this.appInputData.people).length;
  }

  get personNames(): string[] {
    return Object.keys(this.appInputData.people);
  }

  static fromAppInput(input: AppHouseholdInputEnvelope): Household {
    const appInputData = cloneAppHouseholdInputData(input.householdData);
    const year = input.year ?? inferYearFromData(appInputData);

    return new Household({
      id: input.id ?? 'draft-household',
      countryId: normalizeCountryId(input.countryId),
      label: input.label ?? null,
      year,
      appInputData,
    });
  }

  static fromDraft(args: {
    countryId: AppHouseholdInputEnvelope['countryId'];
    householdData: AppHouseholdInputData;
    label?: string | null;
    year?: number | null;
    id?: string;
  }): Household {
    return Household.fromAppInput({
      id: args.id,
      countryId: args.countryId,
      householdData: args.householdData,
      label: args.label,
      year: args.year,
    });
  }

  static fromV1Metadata(metadata: V1HouseholdMetadataEnvelope): Household {
    const appInputData = buildAppHouseholdDataFromV1Data(metadata.household_json);
    const year = inferYearFromData(appInputData);

    return Household.fromAppInput({
      id: String(metadata.id),
      countryId: metadata.country_id as CountryId,
      label: metadata.label ?? null,
      year,
      householdData: appInputData,
    });
  }

  static fromV1CreationPayload(
    payload: V1HouseholdCreateEnvelope,
    options: {
      id?: string;
      label?: string | null;
    } = {}
  ): Household {
    const appInputData = buildAppHouseholdDataFromV1Data(payload.data);
    const year = inferYearFromData(appInputData);

    return Household.fromAppInput({
      id: options.id ?? 'draft-household',
      countryId: payload.country_id as CountryId,
      label: options.label ?? payload.label ?? null,
      year,
      householdData: appInputData,
    });
  }

  static fromV2Response(response: V2StoredHouseholdEnvelope): Household {
    return Household.fromAppInput({
      id: response.id,
      ...parseV2HouseholdEnvelope(response),
    });
  }

  static fromV2CreateEnvelope(envelope: V2CreateHouseholdEnvelope): Household {
    return Household.fromAppInput({
      id: 'draft-household',
      ...parseV2HouseholdEnvelope(envelope),
    });
  }

  withId(id: string): Household {
    return new Household({
      id,
      countryId: this.countryId,
      label: this.label,
      year: this.year,
      appInputData: this.appInputData,
    });
  }

  withLabel(label: string | null): Household {
    return new Household({
      id: this.id,
      countryId: this.countryId,
      label,
      year: this.year,
      appInputData: this.appInputData,
    });
  }

  toAppInput(): AppHouseholdInputEnvelope {
    return {
      id: this.id,
      countryId: this.countryId,
      label: this.label,
      year: this.year,
      householdData: this.householdData,
    };
  }

  toV1CreationPayload(): V1HouseholdCreateEnvelope {
    return buildV1CreateEnvelopeFromAppInput({
      countryId: this.countryId,
      householdData: this.appInputData,
      label: this.label,
      year: this.year ?? inferYearFromData(this.appInputData),
    });
  }

  toV2CreateEnvelope(): V2CreateHouseholdEnvelope {
    return buildV2CreateEnvelope({
      countryId: this.countryId,
      label: this.label,
      year: this.year,
      householdData: this.appInputData,
    });
  }

  toComparable(): ComparableHousehold {
    return buildComparableHousehold({ id: this.id, envelope: this.toV2CreateEnvelope() });
  }

  toJSON(): HouseholdModelData {
    return {
      id: this.id,
      countryId: this.countryId,
      label: this.label,
      year: this.year,
      householdData: cloneValue(this.appInputData),
    };
  }

  isEqual(other: Household): boolean {
    return deepEqual(this.toJSON(), other.toJSON());
  }
}
