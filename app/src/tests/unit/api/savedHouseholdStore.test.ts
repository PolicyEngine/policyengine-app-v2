import { describe, expect, test } from 'vitest';
import {
  ApiSavedHouseholdStore,
  getSavedHouseholdStore,
  SavedHouseholdChangesNotSavedError,
  SavedHouseholdUnavailableError,
} from '@/api/savedHouseholdStore';
import { BrowserOnlyIdError } from '@/api/v2Associations';
import { MAX_STORE_NAME_LENGTH } from '@/libs/flagship/storeText';
import { householdToV2CreateBody } from '@/models/household/v2DocumentCodec';
import {
  EDITED_FAMILY_HOUSEHOLD,
  FAMILY_HOUSEHOLD,
  FAMILY_LABEL,
  RETIRED_HOUSEHOLD,
  RETIRED_LABEL,
  routeRequests,
  SAVED_HOUSEHOLD_IDS,
  userHouseholdItem,
  V2_HOUSEHOLD_IDS,
  v2HouseholdItem,
} from '@/tests/fixtures/api/savedHouseholdMocks';
import {
  createTestApiContext,
  errorResponse,
  itemResponse,
  noContentResponse,
  pageResponse,
} from '@/tests/fixtures/api/v2UserMocks';

function savedHouseholdStore() {
  const { fetchMock, context } = createTestApiContext('us');
  return { store: new ApiSavedHouseholdStore(context), fetchMock };
}

const familyRow = userHouseholdItem();
const familyHouseholdItem = v2HouseholdItem(FAMILY_HOUSEHOLD, V2_HOUSEHOLD_IDS.FAMILY);
const editedHouseholdItem = v2HouseholdItem(
  EDITED_FAMILY_HOUSEHOLD,
  V2_HOUSEHOLD_IDS.EDITED_FAMILY
);

describe('ApiSavedHouseholdStore', () => {
  test('given a household and a label then its content is stored, and the saved row points at it by its v2 id', async () => {
    const { store, fetchMock } = savedHouseholdStore();
    const requests = routeRequests(fetchMock, {
      'POST /v2/households': () => itemResponse(familyHouseholdItem, 201),
      'POST /v2/user-households': () => itemResponse(familyRow, 201),
    });

    const saved = await store.save({ household: FAMILY_HOUSEHOLD, label: FAMILY_LABEL });

    expect(requests.map((request) => `${request.method} ${request.path}`)).toEqual([
      'POST /v2/households',
      'POST /v2/user-households',
    ]);
    expect(requests[0].query).toEqual({ country_id: 'us' });
    expect(requests[0].body).toEqual(householdToV2CreateBody(FAMILY_HOUSEHOLD));
    expect(requests[1].body).toEqual({
      country_id: 'us',
      household_id: V2_HOUSEHOLD_IDS.FAMILY,
      name: FAMILY_LABEL,
    });
    expect(saved).toMatchObject({
      id: SAVED_HOUSEHOLD_IDS.FAMILY,
      label: FAMILY_LABEL,
      householdId: V2_HOUSEHOLD_IDS.FAMILY,
    });
    expect(saved.household.toV1CreationPayload()).toEqual(FAMILY_HOUSEHOLD.toV1CreationPayload());
  });

  test('given a long or empty label then it is shortened to the limit, or saved without a name', async () => {
    const { store, fetchMock } = savedHouseholdStore();
    const requests = routeRequests(fetchMock, {
      'POST /v2/households': () => itemResponse(familyHouseholdItem, 201),
      'POST /v2/user-households': () => itemResponse(familyRow, 201),
    });

    await store.save({ household: FAMILY_HOUSEHOLD, label: 'A'.repeat(300) });
    await store.save({ household: FAMILY_HOUSEHOLD, label: '   ' });

    expect(requests[1].body.name).toHaveLength(MAX_STORE_NAME_LENGTH);
    expect(requests[3].body.name).toBeNull();
  });

  test('given saved households then each is listed with its household, most recently updated first', async () => {
    const { store, fetchMock } = savedHouseholdStore();
    const retiredRow = userHouseholdItem({
      id: SAVED_HOUSEHOLD_IDS.RETIRED,
      household_id: V2_HOUSEHOLD_IDS.RETIRED,
      name: RETIRED_LABEL,
      updated_at: '2026-10-13T09:00:00+00:00',
    });
    routeRequests(fetchMock, {
      'GET /v2/user-households': () => pageResponse([familyRow, retiredRow]),
      [`GET /v2/households/${V2_HOUSEHOLD_IDS.FAMILY}`]: () => itemResponse(familyHouseholdItem),
      [`GET /v2/households/${V2_HOUSEHOLD_IDS.RETIRED}`]: () =>
        itemResponse(v2HouseholdItem(RETIRED_HOUSEHOLD, V2_HOUSEHOLD_IDS.RETIRED)),
    });

    const listed = await store.list();

    expect(listed.map((saved) => saved.label)).toEqual([RETIRED_LABEL, FAMILY_LABEL]);
    expect(listed.every((saved) => !saved.unavailable)).toBe(true);
  });

  test('given a row without a v2 household, or one that fails to load, then it is listed as unavailable, not failing the list', async () => {
    const { store, fetchMock } = savedHouseholdStore();
    routeRequests(fetchMock, {
      'GET /v2/user-households': () =>
        pageResponse([
          familyRow,
          userHouseholdItem({
            id: SAVED_HOUSEHOLD_IDS.V1_ONLY,
            household_id: null,
            legacy_household_id: 123,
          }),
          userHouseholdItem({
            id: SAVED_HOUSEHOLD_IDS.RETIRED,
            household_id: V2_HOUSEHOLD_IDS.RETIRED,
          }),
        ]),
      [`GET /v2/households/${V2_HOUSEHOLD_IDS.FAMILY}`]: () => itemResponse(familyHouseholdItem),
      [`GET /v2/households/${V2_HOUSEHOLD_IDS.RETIRED}`]: () =>
        errorResponse(503, 'V2 household persistence is unavailable'),
    });

    const listed = await store.list();

    const unavailable = listed.filter((saved) => saved.unavailable).map((saved) => saved.id);
    expect(unavailable.sort()).toEqual(
      [SAVED_HOUSEHOLD_IDS.RETIRED, SAVED_HOUSEHOLD_IDS.V1_ONLY].sort()
    );
  });

  test('given a saved household then it opens with its household; an unknown one is null', async () => {
    const { store, fetchMock } = savedHouseholdStore();
    routeRequests(fetchMock, {
      [`GET /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () => itemResponse(familyRow),
      [`GET /v2/user-households/${SAVED_HOUSEHOLD_IDS.RETIRED}`]: () =>
        errorResponse(404, 'Not found'),
      [`GET /v2/households/${V2_HOUSEHOLD_IDS.FAMILY}`]: () => itemResponse(familyHouseholdItem),
    });

    const opened = await store.get(SAVED_HOUSEHOLD_IDS.FAMILY);

    expect(opened?.label).toBe(FAMILY_LABEL);
    expect(opened?.household.toV1CreationPayload()).toEqual(FAMILY_HOUSEHOLD.toV1CreationPayload());
    expect(await store.get(SAVED_HOUSEHOLD_IDS.RETIRED)).toBeNull();
  });

  test('given a row that names only a v1 household then opening it says so', async () => {
    const { store, fetchMock } = savedHouseholdStore();
    routeRequests(fetchMock, {
      [`GET /v2/user-households/${SAVED_HOUSEHOLD_IDS.V1_ONLY}`]: () =>
        itemResponse(
          userHouseholdItem({
            id: SAVED_HOUSEHOLD_IDS.V1_ONLY,
            household_id: null,
            legacy_household_id: 123,
          })
        ),
    });

    await expect(store.get(SAVED_HOUSEHOLD_IDS.V1_ONLY)).rejects.toBeInstanceOf(
      SavedHouseholdUnavailableError
    );
  });

  test('given a new label then only the name is patched', async () => {
    const { store, fetchMock } = savedHouseholdStore();
    const requests = routeRequests(fetchMock, {
      [`PATCH /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () =>
        itemResponse({ ...familyRow, name: RETIRED_LABEL }),
    });

    await store.rename(SAVED_HOUSEHOLD_IDS.FAMILY, RETIRED_LABEL);

    expect(requests).toHaveLength(1);
    expect(requests[0].body).toEqual({ name: RETIRED_LABEL });
  });

  test('given delete then the saved row is deleted, and the stored household stays', async () => {
    const { store, fetchMock } = savedHouseholdStore();
    const requests = routeRequests(fetchMock, {
      [`DELETE /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () => noContentResponse(),
    });

    await store.remove(SAVED_HOUSEHOLD_IDS.FAMILY);

    expect(requests.map((request) => `${request.method} ${request.path}`)).toEqual([
      `DELETE /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`,
    ]);
  });

  describe('given changes to a saved household', () => {
    async function savedFamily(store: ApiSavedHouseholdStore, fetchMock: any) {
      routeRequests(fetchMock, {
        [`GET /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () => itemResponse(familyRow),
        [`GET /v2/households/${V2_HOUSEHOLD_IDS.FAMILY}`]: () => itemResponse(familyHouseholdItem),
      });
      return (await store.get(SAVED_HOUSEHOLD_IDS.FAMILY))!;
    }

    test('given an edited household then it is stored, and the saved household keeps its id and points at it', async () => {
      const { store, fetchMock } = savedHouseholdStore();
      const saved = await savedFamily(store, fetchMock);
      const requests = routeRequests(fetchMock, {
        'POST /v2/households': () => itemResponse(editedHouseholdItem, 201),
        [`PATCH /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () =>
          itemResponse({ ...familyRow, household_id: V2_HOUSEHOLD_IDS.EDITED_FAMILY }),
      });

      const updated = await store.saveChanges(saved, { household: EDITED_FAMILY_HOUSEHOLD });

      expect(requests.map((request) => `${request.method} ${request.path}`)).toEqual([
        'POST /v2/households',
        `PATCH /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`,
      ]);
      expect(requests[0].body).toEqual(householdToV2CreateBody(EDITED_FAMILY_HOUSEHOLD));
      expect(requests[1].query).toEqual({ country_id: 'us' });
      expect(requests[1].body).toEqual({ household_id: V2_HOUSEHOLD_IDS.EDITED_FAMILY });
      expect(updated).toMatchObject({
        id: SAVED_HOUSEHOLD_IDS.FAMILY,
        label: FAMILY_LABEL,
        householdId: V2_HOUSEHOLD_IDS.EDITED_FAMILY,
      });
      expect(updated.household.toV1CreationPayload()).toEqual(
        EDITED_FAMILY_HOUSEHOLD.toV1CreationPayload()
      );
    });

    test('given an edited household and a new label then one request changes both', async () => {
      const { store, fetchMock } = savedHouseholdStore();
      const saved = await savedFamily(store, fetchMock);
      const requests = routeRequests(fetchMock, {
        'POST /v2/households': () => itemResponse(editedHouseholdItem, 201),
        [`PATCH /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () =>
          itemResponse({
            ...familyRow,
            household_id: V2_HOUSEHOLD_IDS.EDITED_FAMILY,
            name: RETIRED_LABEL,
          }),
      });

      const updated = await store.saveChanges(saved, {
        household: EDITED_FAMILY_HOUSEHOLD,
        label: RETIRED_LABEL,
      });

      expect(requests.filter((request) => request.method === 'PATCH')).toHaveLength(1);
      expect(requests[1].body).toEqual({
        household_id: V2_HOUSEHOLD_IDS.EDITED_FAMILY,
        name: RETIRED_LABEL,
      });
      expect(updated.label).toBe(RETIRED_LABEL);
    });

    test('given a new label alone then only the name is patched, and no household is stored', async () => {
      const { store, fetchMock } = savedHouseholdStore();
      const saved = await savedFamily(store, fetchMock);
      const requests = routeRequests(fetchMock, {
        [`PATCH /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () =>
          itemResponse({ ...familyRow, name: RETIRED_LABEL }),
      });

      const updated = await store.saveChanges(saved, { label: RETIRED_LABEL });

      expect(requests.map((request) => `${request.method} ${request.path}`)).toEqual([
        `PATCH /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`,
      ]);
      expect(requests[0].body).toEqual({ name: RETIRED_LABEL });
      expect(updated).toMatchObject({ label: RETIRED_LABEL, householdId: V2_HOUSEHOLD_IDS.FAMILY });
    });

    test('given an edit back to the same content and the same label then no saved row changes', async () => {
      const { store, fetchMock } = savedHouseholdStore();
      const saved = await savedFamily(store, fetchMock);
      const requests = routeRequests(fetchMock, {
        // The Public API deduplicates: identical content is the stored household.
        'POST /v2/households': () => itemResponse(familyHouseholdItem),
      });

      const updated = await store.saveChanges(saved, {
        household: FAMILY_HOUSEHOLD,
        label: FAMILY_LABEL,
      });

      expect(requests.map((request) => `${request.method} ${request.path}`)).toEqual([
        'POST /v2/households',
      ]);
      expect(updated).toMatchObject({
        id: SAVED_HOUSEHOLD_IDS.FAMILY,
        householdId: V2_HOUSEHOLD_IDS.FAMILY,
        updatedAt: saved.updatedAt,
      });
    });

    test('given the saved household cannot be pointed at the edit then the changes are not saved, and it says so', async () => {
      const { store, fetchMock } = savedHouseholdStore();
      const saved = await savedFamily(store, fetchMock);
      routeRequests(fetchMock, {
        'POST /v2/households': () => itemResponse(editedHouseholdItem, 201),
        [`PATCH /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () =>
          errorResponse(503, 'Saved work is temporarily unavailable.'),
      });

      const update = store.saveChanges(saved, { household: EDITED_FAMILY_HOUSEHOLD });

      await expect(update).rejects.toBeInstanceOf(SavedHouseholdChangesNotSavedError);
      await expect(update).rejects.toThrow(
        'Your changes were not saved: Saved work is temporarily unavailable.'
      );
    });

    test('given a household saved only in this browser then nothing is sent', async () => {
      const { store, fetchMock } = savedHouseholdStore();
      const saved = await savedFamily(store, fetchMock);
      const requests = routeRequests(fetchMock, {});

      await expect(
        store.saveChanges({ ...saved, id: 'lfh-browser-only' }, { label: RETIRED_LABEL })
      ).rejects.toBeInstanceOf(BrowserOnlyIdError);
      expect(requests).toEqual([]);
    });
  });
});

describe('getSavedHouseholdStore', () => {
  test('given an account then saved households go to the Public API; without one there are none', () => {
    expect(getSavedHouseholdStore(createTestApiContext().context)).toBeInstanceOf(
      ApiSavedHouseholdStore
    );
    expect(getSavedHouseholdStore(null)).toBeNull();
  });
});
