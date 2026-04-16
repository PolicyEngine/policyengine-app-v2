import type { CountryId } from '@/libs/countries';
import { BaseModel } from './BaseModel';
import {
  buildAppHouseholdData,
  buildAppHouseholdDataFromV1Data,
  buildV1CreateEnvelopeFromAppInput,
  cloneAppHouseholdInputData,
  parseAppHouseholdInput,
} from './household/appCodec';
import type {
  CanonicalHouseholdInputData,
  CanonicalHouseholdInputEnvelope,
  CanonicalHouseholdSetup,
  ComparableHousehold,
  HouseholdModelData,
} from './household/canonicalTypes';
import { buildComparableHousehold } from './household/comparable';
import {
  cloneValue,
  deepEqual,
  inferYearFromData,
  normalizeCanonicalSetup,
} from './household/utils';
import type { V1HouseholdCreateEnvelope, V1HouseholdMetadataEnvelope } from './household/v1Types';
import { buildV2CreateEnvelope, parseV2HouseholdEnvelope } from './household/v2Codec';
import type { V2CreateHouseholdEnvelope, V2StoredHouseholdEnvelope } from './household/v2Types';

export type { ComparableHousehold, HouseholdModelData } from './household/canonicalTypes';

export class Household extends BaseModel<HouseholdModelData> {
  readonly id: string;

  private readonly setup: CanonicalHouseholdSetup;

  private readonly appInputData: CanonicalHouseholdInputData;

  private constructor(args: {
    id: string;
    setup: CanonicalHouseholdSetup;
    appInputData?: CanonicalHouseholdInputData;
  }) {
    super();

    if (!args.id) {
      throw new Error('Household requires an id');
    }

    this.id = args.id;
    this.setup = normalizeCanonicalSetup(args.setup);
    this.appInputData = cloneAppHouseholdInputData(
      args.appInputData ?? buildAppHouseholdData(this.setup)
    );
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
    return cloneValue(this.appInputData);
  }

  get householdData(): CanonicalHouseholdInputData {
    return this.data;
  }

  get people(): CanonicalHouseholdInputData['people'] {
    return cloneValue(this.appInputData.people);
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

  static fromCanonicalInput(input: CanonicalHouseholdInputEnvelope): Household {
    const appInputData = cloneAppHouseholdInputData(input.householdData);
    const parsedSetup = parseAppHouseholdInput({
      ...input,
      householdData: appInputData,
    });
    const year = input.year ?? inferYearFromData(appInputData);

    return new Household({
      id: input.id ?? 'draft-household',
      setup: {
        ...parsedSetup,
        year: parsedSetup.year ?? year,
      },
      appInputData,
    });
  }

  static fromDraft(args: {
    countryId: CanonicalHouseholdInputEnvelope['countryId'];
    householdData: CanonicalHouseholdInputData;
    label?: string | null;
    year?: number | null;
    id?: string;
  }): Household {
    return Household.fromCanonicalInput({
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

    return Household.fromCanonicalInput({
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

    return Household.fromCanonicalInput({
      id: options.id ?? 'draft-household',
      countryId: payload.country_id as CountryId,
      label: options.label ?? payload.label ?? null,
      year,
      householdData: appInputData,
    });
  }

  static fromV2Response(response: V2StoredHouseholdEnvelope): Household {
    return Household.fromCanonicalInput({
      id: response.id,
      ...parseV2HouseholdEnvelope(response),
    });
  }

  static fromV2CreateEnvelope(envelope: V2CreateHouseholdEnvelope): Household {
    return Household.fromCanonicalInput({
      id: 'draft-household',
      ...parseV2HouseholdEnvelope(envelope),
    });
  }

  withId(id: string): Household {
    return new Household({
      id,
      setup: this.toCanonical(),
      appInputData: this.appInputData,
    });
  }

  withLabel(label: string | null): Household {
    return new Household({
      id: this.id,
      setup: {
        ...this.toCanonical(),
        label,
      },
      appInputData: this.appInputData,
    });
  }

  toCanonical(): CanonicalHouseholdSetup {
    return cloneValue(this.setup);
  }

  toCanonicalInput(): CanonicalHouseholdInputEnvelope {
    return {
      id: this.id,
      countryId: this.countryId,
      label: this.label,
      year: this.year,
      householdData: this.data,
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
      data: cloneValue(this.appInputData),
    };
  }

  isEqual(other: Household): boolean {
    return deepEqual(this.toJSON(), other.toJSON());
  }
}
