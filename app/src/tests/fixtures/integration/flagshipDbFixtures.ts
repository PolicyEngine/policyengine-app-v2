import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { PGlite } from '@electric-sql/pglite';
import { EDIT_TOKEN_HEADER } from '@/libs/flagship/ownedItems';

export const MIGRATIONS_DIR = path.resolve(
  __dirname,
  '../../../../../calculator-app/src/db/migrations'
);

/** The migration that dropped user ids for edit tokens; rows before it are legacy. */
export const OWNERSHIP_MIGRATION_TAG = '0003_anonymous-ownership';

/** The checked-in migrations' tags, in journal order. */
export function migrationTags(): string[] {
  const journal = JSON.parse(readFileSync(path.join(MIGRATIONS_DIR, 'meta/_journal.json'), 'utf8'));
  return journal.entries.map((entry: { tag: string }) => entry.tag);
}

/** The tags before the ownership migration: the schema legacy rows were written under. */
export function legacyMigrationTags(): string[] {
  const tags = migrationTags();
  return tags.slice(0, tags.indexOf(OWNERSHIP_MIGRATION_TAG));
}

/** Applies migrations exactly as deployed (all of them by default). */
export async function applyMigrations(client: PGlite, tags = migrationTags()): Promise<void> {
  for (const tag of tags) {
    await client.exec(readFileSync(path.join(MIGRATIONS_DIR, `${tag}.sql`), 'utf8'));
  }
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function editTokenHeader(token: string): Record<string, string> {
  return { [EDIT_TOKEN_HEADER]: token };
}

/** Request metadata the routes must never store. */
export const CLIENT_IP = '203.0.113.7';
export const CLIENT_USER_AGENT = 'Mozilla/5.0 (PrivacyProbe)';

export const IDENTIFYING_HEADERS = {
  'x-forwarded-for': CLIENT_IP,
  'x-real-ip': CLIENT_IP,
  'user-agent': CLIENT_USER_AGENT,
};

export const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000';

const MINIMAL_ROWS = {
  reforms: {
    columns: 'country_id, parameters, provenance',
    values: `'us', '[]', '{"source":"manual"}'`,
  },
  reports: {
    columns: 'country_id, api_report_id, provisions, year',
    values: `'us', '1', '[]', '2026'`,
  },
} as const;

/** Inserts `count` minimal rows created `minutesAgo` minutes ago, as other visitors would. */
export async function insertRowsCreatedAgo(
  client: PGlite,
  table: keyof typeof MINIMAL_ROWS,
  count: number,
  minutesAgo: number
): Promise<void> {
  const { columns, values } = MINIMAL_ROWS[table];
  await client.exec(
    `INSERT INTO ${table} (${columns}, created_at)
     SELECT ${values}, now() - interval '${minutesAgo} minutes' FROM generate_series(1, ${count})`
  );
}

/** A string of `length` characters, for free-text limit checks. */
export function textOfLength(length: number): string {
  return 'x'.repeat(length);
}
