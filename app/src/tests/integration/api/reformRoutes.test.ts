// @vitest-environment node
//
// Integration tests for the /api/reforms route handlers, executed against a
// real in-memory Postgres (PGlite) with the checked-in Drizzle migration
// applied — so schema, SQL, wire format, and handler logic are all exercised
// exactly as deployed.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ReformAdapter } from '@/adapters/ReformAdapter';
import type { Reform } from '@/types/ingredients/Reform';
import type { ReformMetadata } from '@/types/metadata/reformMetadata';
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

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../../../calculator-app/src/db/migrations');

let client: PGlite;

beforeAll(async () => {
  client = new PGlite();
  const migrationSql = readFileSync(path.join(MIGRATIONS_DIR, '0000_create-reforms.sql'), 'utf8');
  await client.exec(migrationSql);
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
  user_id: 'user-1',
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

function postRequest(body: unknown): Request {
  return new Request('http://test/api/reforms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function listRequest(query: string): Request {
  return new Request(`http://test/api/reforms?${query}`);
}

function itemContext(reformId: string) {
  return { params: Promise.resolve({ reformId }) };
}

function patchRequest(body: unknown): Request {
  return new Request('http://test/api/reforms/x', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

async function createAndParse(payload: unknown = VALID_PAYLOAD): Promise<ReformMetadata> {
  const response = await createReform(postRequest(payload));
  expect(response.status).toBe(201);
  return response.json();
}

describe('POST /api/reforms', () => {
  it('given a valid payload then creates and returns the reform in wire format', async () => {
    const created = await createAndParse();

    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.user_id).toBe('user-1');
    expect(created.country_id).toBe('us');
    expect(created.parameters).toEqual(VALID_PAYLOAD.parameters);
    expect(created.provenance).toEqual(VALID_PAYLOAD.provenance);
    expect(new Date(created.created_at!).getTime()).not.toBeNaN();
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
    ['missing user_id', { ...VALID_PAYLOAD, user_id: undefined }],
    ['empty user_id', { ...VALID_PAYLOAD, user_id: '' }],
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
    const list = await listReforms(listRequest('user_id=user-1'));
    expect((await list.json()) as ReformMetadata[]).toHaveLength(1);
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
  it('given no user_id then returns 400', async () => {
    const response = await listReforms(listRequest(''));
    expect(response.status).toBe(400);
  });

  it('given two users then each only sees their own reforms', async () => {
    await createAndParse({ ...VALID_PAYLOAD, user_id: 'alice' });
    await createAndParse({ ...VALID_PAYLOAD, user_id: 'bob' });

    const aliceList = (await (
      await listReforms(listRequest('user_id=alice'))
    ).json()) as ReformMetadata[];

    expect(aliceList).toHaveLength(1);
    expect(aliceList[0].user_id).toBe('alice');
  });

  it('given a country filter then only that country is returned', async () => {
    await createAndParse();
    await createAndParse({ ...VALID_PAYLOAD, country_id: 'uk' });

    const ukOnly = (await (
      await listReforms(listRequest('user_id=user-1&country_id=uk'))
    ).json()) as ReformMetadata[];

    expect(ukOnly).toHaveLength(1);
    expect(ukOnly[0].country_id).toBe('uk');
  });

  it('given several reforms then they are ordered most recently updated first', async () => {
    const first = await createAndParse({ ...VALID_PAYLOAD, label: 'first' });
    await createAndParse({ ...VALID_PAYLOAD, label: 'second' });
    await patchReform(patchRequest({ label: 'first-updated' }), itemContext(first.id));

    const list = (await (
      await listReforms(listRequest('user_id=user-1'))
    ).json()) as ReformMetadata[];

    expect(list.map((r) => r.label)).toEqual(['first-updated', 'second']);
  });
});

describe('GET/PATCH/DELETE /api/reforms/:id', () => {
  it('given a created reform then GET returns it by id', async () => {
    const created = await createAndParse();

    const response = await getReform(new Request('http://test'), itemContext(created.id));

    expect(response.status).toBe(200);
    expect(((await response.json()) as ReformMetadata).id).toBe(created.id);
  });

  it.each([
    ['a random UUID', '00000000-0000-4000-8000-000000000000'],
    ['a non-UUID id', 'not-a-uuid'],
    ['a path-traversal id', '../reforms'],
  ])('given %s then GET returns 404', async (_name, reformId) => {
    const response = await getReform(new Request('http://test'), itemContext(reformId));
    expect(response.status).toBe(404);
  });

  it('given label, parameters, baseline, and provenance updates then PATCH applies them all', async () => {
    const created = await createAndParse();

    const response = await patchReform(
      patchRequest({
        label: 'Bill-derived version',
        parameters: [],
        baseline: 'current-policy',
        provenance: { source: 'bill', ref: 'ut-hb-106', confidence: 'approximated' },
      }),
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
      patchRequest({ policy_id: 'pol-999' }),
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
    const response = await patchReform(patchRequest(body), itemContext(created.id));
    expect(response.status).toBe(400);
  });

  it('given unknown fields only then PATCH returns 400 rather than silently succeeding', async () => {
    const created = await createAndParse();
    const response = await patchReform(
      patchRequest({ user_id: 'mallory', country_id: 'uk' }),
      itemContext(created.id)
    );
    expect(response.status).toBe(400);
  });

  it('given a deleted reform then it 404s afterwards', async () => {
    const created = await createAndParse();

    const deleteResponse = await deleteReform(new Request('http://test'), itemContext(created.id));
    expect(deleteResponse.status).toBe(200);

    const getResponse = await getReform(new Request('http://test'), itemContext(created.id));
    expect(getResponse.status).toBe(404);
  });

  it('given a nonexistent reform then DELETE returns 404', async () => {
    const response = await deleteReform(
      new Request('http://test'),
      itemContext('00000000-0000-4000-8000-000000000000')
    );
    expect(response.status).toBe(404);
  });
});

describe('degraded mode (no database configured)', () => {
  it('given no injected db and no DATABASE_URL then all handlers return 503', async () => {
    setDbForTesting(null);
    const previousUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      expect((await createReform(postRequest(VALID_PAYLOAD))).status).toBe(503);
      expect((await listReforms(listRequest('user_id=user-1'))).status).toBe(503);
      expect((await getReform(new Request('http://test'), itemContext('x'))).status).toBe(503);
      expect((await patchReform(patchRequest({ label: 'x' }), itemContext('x'))).status).toBe(503);
      expect((await deleteReform(new Request('http://test'), itemContext('x'))).status).toBe(503);
    } finally {
      if (previousUrl !== undefined) {
        process.env.DATABASE_URL = previousUrl;
      }
      setDbForTesting(drizzle(client, { schema }) as any);
    }
  });
});
