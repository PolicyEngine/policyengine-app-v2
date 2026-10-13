// @vitest-environment node
//
// Integration tests for the /api/reforms route handlers, executed against a
// real in-memory Postgres (PGlite) with the checked-in Drizzle migrations
// applied — so schema, SQL, wire format, and handler logic are all exercised
// exactly as deployed.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ReformAdapter } from '@/adapters/ReformAdapter';
import {
  applyMigrations,
  CLIENT_IP,
  CLIENT_USER_AGENT,
  editTokenHeader,
  IDENTIFYING_HEADERS,
  legacyMigrationTags,
  OWNERSHIP_MIGRATION_TAG,
  sha256Hex,
  UNKNOWN_UUID,
} from '@/tests/fixtures/integration/flagshipDbFixtures';
import type { Reform } from '@/types/ingredients/Reform';
import type { ReformCreatedMetadata, ReformMetadata } from '@/types/metadata/reformMetadata';
// Route handlers + db module live in calculator-app; imported relatively
// since they are outside the @/ alias root.
import {
  DELETE as deleteReform,
  GET as getReform,
  PATCH as patchReform,
} from '../../../../../calculator-app/src/app/api/reforms/[reformId]/route';
import {
  POST as createReform,
  GET as listReforms,
} from '../../../../../calculator-app/src/app/api/reforms/route';
import { setDbForTesting } from '../../../../../calculator-app/src/db';
import * as schema from '../../../../../calculator-app/src/db/schema';

let client: PGlite;

beforeAll(async () => {
  // The routes 404 on flag-off deployments; these tests exercise the
  // flag-on behavior.
  process.env.NEXT_PUBLIC_FLAGSHIP_SHELL = 'true';
  client = new PGlite();
  await applyMigrations(client);
  setDbForTesting(drizzle(client, { schema }) as any);
});

afterAll(async () => {
  setDbForTesting(null);
  await client.close();
});

beforeEach(async () => {
  await client.exec('DELETE FROM reforms;');
});

const VALID_PAYLOAD = {
  country_id: 'us',
  label: 'CTC to $3,600 for children under 6',
  policy_id: null,
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount.base[0]',
      values: [{ start_date: '2026-01-01', end_date: '2026-12-31', value: 3600 }],
    },
  ],
  baseline: 'current-law',
  provenance: { source: 'chat', ref: 'session-1', confidence: 'exact' },
};

function postRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://test/api/reforms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function listRequest(ids: string[]): Request {
  return new Request(`http://test/api/reforms?ids=${ids.join(',')}`);
}

function itemContext(reformId: string) {
  return { params: Promise.resolve({ reformId }) };
}

function patchRequest(body: unknown, token?: string): Request {
  return new Request('http://test/api/reforms/x', {
    method: 'PATCH',
    headers: token ? editTokenHeader(token) : {},
    body: JSON.stringify(body),
  });
}

function deleteRequest(token?: string): Request {
  return new Request('http://test/api/reforms/x', {
    method: 'DELETE',
    headers: token ? editTokenHeader(token) : {},
  });
}

async function createAndParse(payload: unknown = VALID_PAYLOAD): Promise<ReformCreatedMetadata> {
  const response = await createReform(postRequest(payload));
  expect(response.status).toBe(201);
  return response.json();
}

async function list(ids: string[]): Promise<ReformMetadata[]> {
  const response = await listReforms(listRequest(ids));
  expect(response.status).toBe(200);
  return response.json();
}

/** A row as the pre-ownership schema wrote it: a client user id, no edit token. */
async function insertLegacyRow(db: PGlite = client): Promise<string> {
  const result = await db.query<{ id: string }>(
    `INSERT INTO reforms (user_id, country_id, label, parameters, provenance)
     VALUES ('anonymous', 'us', 'Saved before edit tokens', '[]', '{"source":"manual"}')
     RETURNING id`
  );
  return result.rows[0].id;
}

describe('POST /api/reforms', () => {
  it('given a valid payload then creates and returns the reform in wire format with an edit token', async () => {
    const created = await createAndParse();

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.edit_token).toMatch(/^[0-9a-f]{64}$/);
    expect(created).not.toHaveProperty('user_id');
    expect(created).not.toHaveProperty('edit_token_hash');
    expect(created.country_id).toBe('us');
    expect(created.parameters).toEqual(VALID_PAYLOAD.parameters);
    expect(created.provenance).toEqual(VALID_PAYLOAD.provenance);
    expect(new Date(created.created_at!).getTime()).not.toBeNaN();
  });

  it('given a created reform then the row keeps only the token hash and no user id', async () => {
    const created = await createAndParse();

    const { rows } = await client.query<{ user_id: string | null; edit_token_hash: string }>(
      'SELECT user_id, edit_token_hash FROM reforms WHERE id = $1',
      [created.id]
    );

    expect(rows[0].user_id).toBeNull();
    expect(rows[0].edit_token_hash).toBe(sha256Hex(created.edit_token));
  });

  it('given two reforms then each gets its own edit token', async () => {
    const first = await createAndParse();
    const second = await createAndParse();

    expect(first.edit_token).not.toBe(second.edit_token);
  });

  it('given an older client that still sends user_id then it is not stored', async () => {
    const created = await createAndParse({ ...VALID_PAYLOAD, user_id: 'anonymous' });

    const { rows } = await client.query<{ user_id: string | null }>(
      'SELECT user_id FROM reforms WHERE id = $1',
      [created.id]
    );
    expect(rows[0].user_id).toBeNull();
  });

  it('given a request with an IP address and user agent then the row stores neither', async () => {
    const response = await createReform(postRequest(VALID_PAYLOAD, IDENTIFYING_HEADERS));
    expect(response.status).toBe(201);

    const { rows } = await client.query<{ row: string }>(
      'SELECT row_to_json(reforms)::text AS row FROM reforms'
    );
    expect(rows[0].row).not.toContain(CLIENT_IP);
    expect(rows[0].row).not.toContain(CLIENT_USER_AGENT);
  });

  it('given the created response then it round-trips through ReformAdapter unchanged', async () => {
    const created = await createAndParse();

    const reform: Reform = ReformAdapter.fromApiResponse(created);
    const backToWire = ReformAdapter.toCreationPayload(reform);

    expect(backToWire.parameters).toEqual(created.parameters);
    expect(backToWire.provenance).toEqual(created.provenance);
    expect(backToWire.baseline).toBe(created.baseline);
  });

  it.each([
    ['invalid country', { ...VALID_PAYLOAD, country_id: 'fr' }],
    ['parameters not an array', { ...VALID_PAYLOAD, parameters: 'oops' }],
    ['parameter without name', { ...VALID_PAYLOAD, parameters: [{ values: [] }] }],
    ['parameter without values', { ...VALID_PAYLOAD, parameters: [{ name: 'x' }] }],
    ['invalid baseline', { ...VALID_PAYLOAD, baseline: 'utopia' }],
    ['missing provenance', { ...VALID_PAYLOAD, provenance: undefined }],
    ['invalid provenance source', { ...VALID_PAYLOAD, provenance: { source: 'dream' } }],
  ])('given %s then returns 400', async (_name, payload) => {
    const response = await createReform(postRequest(payload));
    expect(response.status).toBe(400);
  });

  it('given malformed JSON then returns 400', async () => {
    const response = await createReform(postRequest('{not json'));
    expect(response.status).toBe(400);
  });

  it('given a SQL-injection-shaped label then it is stored literally', async () => {
    const label = `'; DROP TABLE reforms; --`;
    const created = await createAndParse({ ...VALID_PAYLOAD, label });

    expect(created.label).toBe(label);

    // Table still exists and holds the row
    expect(await list([created.id])).toHaveLength(1);
  });

  it('given a unicode label with emoji then it round-trips intact', async () => {
    const label = 'Crédit d’impôt 子育て支援 🎯 £/€';
    const created = await createAndParse({ ...VALID_PAYLOAD, label });
    expect(created.label).toBe(label);
  });

  it('given an empty parameters array (a "current law" reform) then it is accepted', async () => {
    const created = await createAndParse({ ...VALID_PAYLOAD, parameters: [] });
    expect(created.parameters).toEqual([]);
  });

  it('given 500 parameters with mixed value types then all round-trip', async () => {
    const parameters = Array.from({ length: 500 }, (_, i) => ({
      name: `gov.test.parameter_${i}`,
      values: [
        {
          start_date: '2026-01-01',
          end_date: '2100-12-31',
          value: i % 3 === 0 ? i * 1.5 : i % 3 === 1 ? String(i) : i % 2 === 0,
        },
      ],
    }));

    const created = await createAndParse({ ...VALID_PAYLOAD, parameters });
    expect(created.parameters).toHaveLength(500);
    expect(created.parameters[0].values[0].value).toBe(0);
    expect(created.parameters[1].values[0].value).toBe('1');
  });
});

describe('GET /api/reforms', () => {
  it('given no ids then returns 400 rather than listing every reform', async () => {
    await createAndParse();

    const response = await listReforms(new Request('http://test/api/reforms'));

    expect(response.status).toBe(400);
  });

  it('given a user_id query from an older client then returns 400', async () => {
    await createAndParse();

    const response = await listReforms(new Request('http://test/api/reforms?user_id=anonymous'));

    expect(response.status).toBe(400);
  });

  it('given ids then only those reforms are returned, without tokens or user ids', async () => {
    const mine = await createAndParse({ ...VALID_PAYLOAD, label: 'mine' });
    await createAndParse({ ...VALID_PAYLOAD, label: 'someone else’s' });

    const reforms = await list([mine.id]);

    expect(reforms.map((reform) => reform.label)).toEqual(['mine']);
    expect(reforms[0]).not.toHaveProperty('edit_token');
    expect(reforms[0]).not.toHaveProperty('user_id');
  });

  it('given unknown and malformed ids then they are skipped', async () => {
    const mine = await createAndParse();

    const reforms = await list([mine.id, UNKNOWN_UUID, 'not-a-uuid', "'; DROP TABLE reforms; --"]);

    expect(reforms.map((reform) => reform.id)).toEqual([mine.id]);
  });

  it('given more than 100 ids then returns 400', async () => {
    const ids = Array.from(
      { length: 101 },
      (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`
    );

    const response = await listReforms(listRequest(ids));

    expect(response.status).toBe(400);
  });

  it('given several reforms then they are ordered most recently updated first', async () => {
    const first = await createAndParse({ ...VALID_PAYLOAD, label: 'first' });
    const second = await createAndParse({ ...VALID_PAYLOAD, label: 'second' });
    await patchReform(
      patchRequest({ label: 'first-updated' }, first.edit_token),
      itemContext(first.id)
    );

    const reforms = await list([first.id, second.id]);

    expect(reforms.map((r) => r.label)).toEqual(['first-updated', 'second']);
  });
});

describe('GET/PATCH/DELETE /api/reforms/:id', () => {
  it('given a created reform then GET returns it by id with no token', async () => {
    const created = await createAndParse();

    const response = await getReform(new Request('http://test'), itemContext(created.id));

    expect(response.status).toBe(200);
    const body = (await response.json()) as ReformMetadata;
    expect(body.id).toBe(created.id);
    expect(body).not.toHaveProperty('edit_token');
  });

  it.each([
    ['a random UUID', UNKNOWN_UUID],
    ['a non-UUID id', 'not-a-uuid'],
    ['a path-traversal id', '../reforms'],
  ])('given %s then GET returns 404', async (_name, reformId) => {
    const response = await getReform(new Request('http://test'), itemContext(reformId));
    expect(response.status).toBe(404);
  });

  it('given label, parameters, baseline, and provenance updates then PATCH applies them all', async () => {
    const created = await createAndParse();

    const response = await patchReform(
      patchRequest(
        {
          label: 'Bill-derived version',
          parameters: [],
          baseline: 'current-policy',
          provenance: { source: 'bill', ref: 'ut-hb-106', confidence: 'approximated' },
        },
        created.edit_token
      ),
      itemContext(created.id)
    );

    expect(response.status).toBe(200);
    const updated = (await response.json()) as ReformMetadata;
    expect(updated.label).toBe('Bill-derived version');
    expect(updated.parameters).toEqual([]);
    expect(updated.baseline).toBe('current-policy');
    expect(updated.provenance.source).toBe('bill');
    expect(new Date(updated.updated_at!).getTime()).toBeGreaterThanOrEqual(
      new Date(created.updated_at!).getTime()
    );
  });

  it('given a policy_id update then PATCH links the materialized policy', async () => {
    const created = await createAndParse();

    const response = await patchReform(
      patchRequest({ policy_id: 'pol-999' }, created.edit_token),
      itemContext(created.id)
    );

    expect(((await response.json()) as ReformMetadata).policy_id).toBe('pol-999');
  });

  it.each([
    ['an empty body', {}],
    ['an invalid baseline', { baseline: 'utopia' }],
    ['an invalid provenance source', { provenance: { source: 'dream' } }],
    ['non-array parameters', { parameters: 'oops' }],
  ])('given %s then PATCH returns 400', async (_name, body) => {
    const created = await createAndParse();
    const response = await patchReform(
      patchRequest(body, created.edit_token),
      itemContext(created.id)
    );
    expect(response.status).toBe(400);
  });

  it('given unknown fields only then PATCH returns 400 rather than silently succeeding', async () => {
    const created = await createAndParse();
    const response = await patchReform(
      patchRequest({ user_id: 'mallory', country_id: 'uk' }, created.edit_token),
      itemContext(created.id)
    );
    expect(response.status).toBe(400);
  });

  it('given no edit token then PATCH returns 403 and the reform is unchanged', async () => {
    const created = await createAndParse();

    const response = await patchReform(
      patchRequest({ label: 'Hijacked' }),
      itemContext(created.id)
    );

    expect(response.status).toBe(403);
    expect((await list([created.id]))[0].label).toBe(VALID_PAYLOAD.label);
  });

  it('given another reform’s edit token then PATCH returns 403', async () => {
    const target = await createAndParse();
    const other = await createAndParse();

    const response = await patchReform(
      patchRequest({ label: 'Hijacked' }, other.edit_token),
      itemContext(target.id)
    );

    expect(response.status).toBe(403);
  });

  it('given the stored hash sent as the token then PATCH returns 403', async () => {
    const created = await createAndParse();

    const response = await patchReform(
      patchRequest({ label: 'Hijacked' }, sha256Hex(created.edit_token)),
      itemContext(created.id)
    );

    expect(response.status).toBe(403);
  });

  it('given a deleted reform then it 404s afterwards', async () => {
    const created = await createAndParse();

    const deleteResponse = await deleteReform(
      deleteRequest(created.edit_token),
      itemContext(created.id)
    );
    expect(deleteResponse.status).toBe(200);

    const getResponse = await getReform(new Request('http://test'), itemContext(created.id));
    expect(getResponse.status).toBe(404);
  });

  it('given no edit token then DELETE returns 403 and the reform stays', async () => {
    const created = await createAndParse();

    const response = await deleteReform(deleteRequest(), itemContext(created.id));

    expect(response.status).toBe(403);
    expect(await list([created.id])).toHaveLength(1);
  });

  it('given a nonexistent reform then DELETE returns 404', async () => {
    const response = await deleteReform(deleteRequest('a'.repeat(64)), itemContext(UNKNOWN_UUID));
    expect(response.status).toBe(404);
  });
});

describe('legacy rows (written before edit tokens)', () => {
  it('given a legacy row then GET reads it without exposing its user id', async () => {
    const legacyId = await insertLegacyRow();

    const response = await getReform(new Request('http://test'), itemContext(legacyId));

    expect(response.status).toBe(200);
    const body = (await response.json()) as ReformMetadata;
    expect(body.label).toBe('Saved before edit tokens');
    expect(body).not.toHaveProperty('user_id');
  });

  it('given a legacy row then PATCH and DELETE return 403 whatever token is sent', async () => {
    const legacyId = await insertLegacyRow();

    const patch = await patchReform(
      patchRequest({ label: 'Hijacked' }, 'a'.repeat(64)),
      itemContext(legacyId)
    );
    const remove = await deleteReform(deleteRequest(), itemContext(legacyId));

    expect(patch.status).toBe(403);
    expect(remove.status).toBe(403);
    expect(await list([legacyId])).toHaveLength(1);
  });

  it('given a row written under the old schema then it stays readable after the ownership migration', async () => {
    const legacyDb = new PGlite();
    try {
      await applyMigrations(legacyDb, legacyMigrationTags());
      const legacyId = await insertLegacyRow(legacyDb);
      await applyMigrations(legacyDb, [OWNERSHIP_MIGRATION_TAG]);
      setDbForTesting(drizzle(legacyDb, { schema }) as any);

      const response = await getReform(new Request('http://test'), itemContext(legacyId));

      expect(response.status).toBe(200);
      expect(((await response.json()) as ReformMetadata).label).toBe('Saved before edit tokens');
    } finally {
      setDbForTesting(drizzle(client, { schema }) as any);
      await legacyDb.close();
    }
  });
});

describe('degraded mode (no database configured)', () => {
  it('given no injected db and no DATABASE_URL then all handlers return 503', async () => {
    setDbForTesting(null);
    const previousUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      expect((await createReform(postRequest(VALID_PAYLOAD))).status).toBe(503);
      expect((await listReforms(listRequest([UNKNOWN_UUID]))).status).toBe(503);
      expect((await getReform(new Request('http://test'), itemContext('x'))).status).toBe(503);
      expect((await patchReform(patchRequest({ label: 'x' }), itemContext('x'))).status).toBe(503);
      expect((await deleteReform(deleteRequest(), itemContext('x'))).status).toBe(503);
    } finally {
      if (previousUrl !== undefined) {
        process.env.DATABASE_URL = previousUrl;
      }
      setDbForTesting(drizzle(client, { schema }) as any);
    }
  });
});

describe('flag-off deployments (production leak gate)', () => {
  it('given the flagship flag is off then every handler 404s before touching the db', async () => {
    const previous = process.env.NEXT_PUBLIC_FLAGSHIP_SHELL;
    process.env.NEXT_PUBLIC_FLAGSHIP_SHELL = '';

    try {
      expect((await createReform(postRequest(VALID_PAYLOAD))).status).toBe(404);
      expect((await listReforms(listRequest([UNKNOWN_UUID]))).status).toBe(404);
      expect((await getReform(new Request('http://test'), itemContext('x'))).status).toBe(404);
      expect((await patchReform(patchRequest({ label: 'x' }), itemContext('x'))).status).toBe(404);
      expect((await deleteReform(deleteRequest(), itemContext('x'))).status).toBe(404);
    } finally {
      process.env.NEXT_PUBLIC_FLAGSHIP_SHELL = previous;
    }
  });
});
