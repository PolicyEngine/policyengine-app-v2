import * as fs from 'fs';
import * as path from 'path';

/**
 * The UK area lists the local-area breakdowns use: verbatim copies of .py
 * 6.10.0's src/policyengine/data/uk_geography/constituencies_2024.csv (650
 * constituencies, 2024 boundaries) and local_authorities_2023.csv (361 local
 * authorities, April 2023).
 */
export const PY_CONSTITUENCIES_CSV = 'constituencies_2024.csv';
export const PY_LOCAL_AUTHORITIES_CSV = 'local_authorities_2023.csv';

export const EXPECTED_CONSTITUENCY_COUNT = 650;
export const EXPECTED_LOCAL_AUTHORITY_COUNT = 361;

/**
 * How many of each level's areas each nation has: the totals a nation
 * report's withheld note counts against.
 */
export const EXPECTED_AREA_COUNTS_BY_NATION = {
  constituency: { england: 543, wales: 32, scotland: 57, northern_ireland: 18 },
  local_authority: { england: 296, wales: 22, scotland: 32, northern_ireland: 11 },
};

/** The boundary files the geographic maps load, under app/public. */
export const BOUNDARY_FILE_DIRECTORY = path.resolve(
  __dirname,
  '../../../../../public/data/geojson'
);
export const CONSTITUENCY_BOUNDARY_FILE = 'uk_constituencies_2024.geojson';
export const LOCAL_AUTHORITY_BOUNDARY_FILE = 'uk_local_authorities_2023.geojson';

/** The most bytes a boundary file may hold: enough for a simplified file, not a full one. */
export const MAX_BOUNDARY_FILE_BYTES = 2 * 1024 * 1024;

/** One CSV row's fields; a quoted field may hold commas and doubled quotes. */
function parseCsvRow(row: string): string[] {
  const fields: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < row.length; index++) {
    const character = row[index];
    if (quoted) {
      if (character === '"' && row[index + 1] === '"') {
        field += '"';
        index++;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      fields.push(field);
      field = '';
    } else {
      field += character;
    }
  }
  fields.push(field);
  return fields;
}

/** A .py area list's codes and names, in file order. */
export function readPyAreaList(fileName: string): { code: string; name: string }[] {
  const text = fs.readFileSync(path.join(__dirname, fileName), 'utf8');
  const [header, ...rows] = text.split('\n').filter((row) => row.trim() !== '');
  const columns = parseCsvRow(header);
  const codeColumn = columns.indexOf('code');
  const nameColumn = columns.indexOf('name');
  return rows.map((row) => {
    const fields = parseCsvRow(row);
    return { code: fields[codeColumn], name: fields[nameColumn] };
  });
}
