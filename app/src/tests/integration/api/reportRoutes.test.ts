// @vitest-environment node
//
// Integration tests for the /api/reports route handlers against PGlite with
// the checked-in migrations applied, as for /api/reforms.
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { validationToWire } from '@/libs/flagship/reportValidation';
import {
  applyMigrations,
  CLIENT_IP,
  CLIENT_USER_AGENT,
  editTokenHeader,
  IDENTIFYING_HEADERS,
  insertRowsCreatedAgo,
  sha256Hex,
  textOfLength,
  UNKNOWN_UUID,
} from '@/tests/fixtures/integration/flagshipDbFixtures';
import { API_REPORT_ID, CENTRAL_REFORM_ID } from '@/tests/fixtures/libs/flagship/ownedItemsMocks';
import { mockReportValidationSnapshot } from '@/tests/fixtures/libs/flagship/reportValidationMocks';
import {
  GET as getReport,
  PATCH as patchReport,
} from '../../../../../calculator-app/src/app/api/reports/[reportId]/route';
import {
  POST as createReport,
  GET as listReports,
} from '../../../../../calculator-app/src/app/api/reports/route';
import { setDbForTesting } from '../../../../../calculator-app/src/db';
import {
  MAX_BODY_BYTES,
  MAX_TEXT_LENGTH,
  NEW_ROWS_PER_MINUTE,
} from '../../../../../calculator-app/src/db/limits';
import * as schema from '../../../../../calculator-app/src/db/schema';

let client: PGlite;

beforeAll(async () => {
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
  await client.exec('DELETE FROM reports;');
});

const VALID_PAYLOAD = {
  country_id: 'us',
  api_report_id: API_REPORT_ID,
  title: 'CTC to $2,500',
  source_note: 'Hand-built draft',
  provisions: [
    {
      path: 'gov.irs.credits.ctc.amount.base[0].amount',
      breadcrumb: 'IRS → Credits → CTC → Amount',
      unit: 'currency-USD',
      baseline_value: 2200,
      value: 2500,
    },
  ],
  year: '2026',
  reform_id: null,
};

const VALIDATION_BODY = { validation: validationToWire(mockReportValidationSnapshot) };

interface CreatedReport {
  id: string;
  edit_token: string;
  [key: string]: unknown;
}

function postRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://test/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

function itemContext(reportId: string) {
  return { params: Promise.resolve({ reportId }) };
}

function patchRequest(body: unknown, token?: string): Request {
  return new Request('http://test/api/reports/x', {
    method: 'PATCH',
    headers: token ? editTokenHeader(token) : {},
    body: JSON.stringify(body),
  });
}

async function createAndParse(payload: unknown = VALID_PAYLOAD): Promise<CreatedReport> {
  const response = await createReport(postRequest(payload));
  expect(response.status).toBe(201);
  return response.json();
}

describe('POST /api/reports', () => {
  it('given a valid payload then it returns the record with an edit token and no user id', async () => {
    const created = await createAndParse();

    expect(created.edit_token).toMatch(/^[0-9a-f]{64}$/);
    expect(created).not.toHaveProperty('user_id');
    expect(created.api_report_id).toBe(API_REPORT_ID);

    const { rows } = await client.query<{ user_id: string | null; edit_token_hash: string }>(
      'SELECT user_id, edit_token_hash FROM reports WHERE id = $1',
      [created.id]
    );
    expect(rows[0].user_id).toBeNull();
    expect(rows[0].edit_token_hash).toBe(sha256Hex(created.edit_token));
  });

  it('given a request with an IP address and user agent then the row stores neither', async () => {
    const response = await createReport(postRequest(VALID_PAYLOAD, IDENTIFYING_HEADERS));
    expect(response.status).toBe(201);

    const { rows } = await client.query<{ row: string }>(
      'SELECT row_to_json(reports)::text AS row FROM reports'
    );
    expect(rows[0].row).not.toContain(CLIENT_IP);
    expect(rows[0].row).not.toContain(CLIENT_USER_AGENT);
  });

  it.each([
    ['invalid country', { ...VALID_PAYLOAD, country_id: 'fr' }],
    ['missing api_report_id', { ...VALID_PAYLOAD, api_report_id: undefined }],
    ['provisions not an array', { ...VALID_PAYLOAD, provisions: 'oops' }],
    ['a provision that is not an object', { ...VALID_PAYLOAD, provisions: ['oops'] }],
    ['a provision without a path', { ...VALID_PAYLOAD, provisions: [{ breadcrumb: 'CTC' }] }],
    [
      'a provision with a numeric unit',
      { ...VALID_PAYLOAD, provisions: [{ ...VALID_PAYLOAD.provisions[0], unit: 7 }] },
    ],
    ['missing year', { ...VALID_PAYLOAD, year: undefined }],
    ['a local fallback reform_id', { ...VALID_PAYLOAD, reform_id: 'rf-mfz1abcd' }],
    ['a non-string reform_id', { ...VALID_PAYLOAD, reform_id: 42 }],
  ])('given %s then returns 400', async (_name, payload) => {
    const response = await createReport(postRequest(payload));
    expect(response.status).toBe(400);
  });

  it('given a provision without a path then the error names the field', async () => {
    const response = await createReport(
      postRequest({ ...VALID_PAYLOAD, provisions: [{ breadcrumb: 'CTC' }] })
    );

    expect(await response.json()).toEqual({
      error: 'provisions[0].path must be a non-empty string',
    });
  });

  it('given provisions without units or baselines then the record is stored', async () => {
    const { path, breadcrumb, value } = VALID_PAYLOAD.provisions[0];

    const created = await createAndParse({
      ...VALID_PAYLOAD,
      provisions: [{ path, breadcrumb, value }],
    });

    expect(created.provisions).toEqual([{ path, breadcrumb, value }]);
  });

  it('given a central reform_id then it is stored on the record', async () => {
    const created = await createAndParse({ ...VALID_PAYLOAD, reform_id: CENTRAL_REFORM_ID });

    expect(created.reform_id).toBe(CENTRAL_REFORM_ID);
  });
});

describe('abuse limits', () => {
  it('given a body over the size limit then POST returns 413', async () => {
    const response = await createReport(
      postRequest({
        ...VALID_PAYLOAD,
        provisions: [{ ...VALID_PAYLOAD.provisions[0], breadcrumb: textOfLength(MAX_BODY_BYTES) }],
      })
    );

    expect(response.status).toBe(413);
  });

  it.each([
    [
      'a title over the length limit',
      { ...VALID_PAYLOAD, title: textOfLength(MAX_TEXT_LENGTH + 1) },
    ],
    [
      'a source note over the length limit',
      { ...VALID_PAYLOAD, source_note: textOfLength(MAX_TEXT_LENGTH + 1) },
    ],
    ['a non-string title', { ...VALID_PAYLOAD, title: { text: 'x' } }],
  ])('given %s then POST returns 400', async (_name, payload) => {
    const response = await createReport(postRequest(payload));

    expect(response.status).toBe(400);
  });

  it('given the new-row budget is used up this minute then POST returns 429', async () => {
    await insertRowsCreatedAgo(client, 'reports', NEW_ROWS_PER_MINUTE, 0);

    const response = await createReport(postRequest(VALID_PAYLOAD));

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
  });

  it('given a body over the size limit then PATCH returns 413 and nothing is pinned', async () => {
    const created = await createAndParse();

    const response = await patchReport(
      patchRequest(
        { validation: { ...VALIDATION_BODY.validation, padding: textOfLength(MAX_BODY_BYTES) } },
        created.edit_token
      ),
      itemContext(created.id)
    );

    expect(response.status).toBe(413);
    const reread = await getReport(new Request('http://test'), itemContext(created.id));
    expect((await reread.json()).validation).toBeNull();
  });
});

describe('GET /api/reports', () => {
  it('given no ids then returns 400 rather than listing every record', async () => {
    await createAndParse();

    const response = await listReports(new Request('http://test/api/reports'));

    expect(response.status).toBe(400);
  });

  it('given an api_report_id lookup then returns 400, since sequential ids would be enumerable', async () => {
    await createAndParse();

    const response = await listReports(
      new Request(`http://test/api/reports?api_report_id=${API_REPORT_ID}`)
    );

    expect(response.status).toBe(400);
  });

  it('given ids then only those records are returned', async () => {
    const mine = await createAndParse();
    await createAndParse({ ...VALID_PAYLOAD, title: 'Someone else’s' });

    const response = await listReports(
      new Request(`http://test/api/reports?ids=${mine.id},${UNKNOWN_UUID}`)
    );

    const records = (await response.json()) as CreatedReport[];
    expect(records.map((record) => record.id)).toEqual([mine.id]);
    expect(records[0]).not.toHaveProperty('edit_token');
  });
});

describe('GET/PATCH /api/reports/:id', () => {
  it('given a created record then GET returns it by id', async () => {
    const created = await createAndParse();

    const response = await getReport(new Request('http://test'), itemContext(created.id));

    expect(response.status).toBe(200);
  });

  it('given a non-UUID id then GET returns 404 rather than a database error', async () => {
    const response = await getReport(new Request('http://test'), itemContext('not-a-uuid'));

    expect(response.status).toBe(404);
  });

  it('given the edit token then PATCH pins the validation snapshot', async () => {
    const created = await createAndParse();

    const response = await patchReport(
      patchRequest(VALIDATION_BODY, created.edit_token),
      itemContext(created.id)
    );

    expect(response.status).toBe(200);
    expect((await response.json()).validation).toEqual(VALIDATION_BODY.validation);
  });

  it('given no edit token then PATCH returns 403 and nothing is pinned', async () => {
    const created = await createAndParse();

    const response = await patchReport(patchRequest(VALIDATION_BODY), itemContext(created.id));

    expect(response.status).toBe(403);
    const reread = await getReport(new Request('http://test'), itemContext(created.id));
    expect((await reread.json()).validation).toBeNull();
  });

  it('given a pin the report schema can not read then PATCH returns 400 and nothing is pinned', async () => {
    const created = await createAndParse();
    const damaged = { ...VALIDATION_BODY.validation, scorecard: { programs: 'ctc_refund' } };

    const response = await patchReport(
      patchRequest({ validation: damaged }, created.edit_token),
      itemContext(created.id)
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'validation.scorecard.programs must be an array',
    });
    const reread = await getReport(new Request('http://test'), itemContext(created.id));
    expect((await reread.json()).validation).toBeNull();
  });

  it('given an unknown record then PATCH returns 404', async () => {
    const response = await patchReport(
      patchRequest(VALIDATION_BODY, 'a'.repeat(64)),
      itemContext(UNKNOWN_UUID)
    );

    expect(response.status).toBe(404);
  });

  it('given a legacy record without a token hash then GET works and PATCH returns 403', async () => {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO reports (user_id, country_id, api_report_id, provisions, year)
       VALUES ('anonymous', 'us', '3301', '[]', '2026') RETURNING id`
    );
    const legacyId = rows[0].id;

    const read = await getReport(new Request('http://test'), itemContext(legacyId));
    const pin = await patchReport(
      patchRequest(VALIDATION_BODY, 'a'.repeat(64)),
      itemContext(legacyId)
    );

    expect(read.status).toBe(200);
    expect(await read.json()).not.toHaveProperty('user_id');
    expect(pin.status).toBe(403);
  });
});
