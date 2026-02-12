import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public');
const OUTPUT_FILES = [
  'llms.txt',
  'llms-recent.txt',
  'llms-full.txt',
  'llms-research-us.txt',
  'llms-research-uk.txt',
];

describe('generate-llms-txt', () => {
  // Store original file contents to restore after test
  const originals = new Map<string, Buffer | null>();

  beforeAll(() => {
    // Save any existing files
    for (const file of OUTPUT_FILES) {
      const filePath = path.join(PUBLIC_DIR, file);
      originals.set(file, fs.existsSync(filePath) ? fs.readFileSync(filePath) : null);
    }
    // Run the generation script
    execSync('npx tsx scripts/generate-llms-txt.ts', {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
    });
  });

  afterAll(() => {
    // Restore originals
    for (const [file, content] of originals) {
      const filePath = path.join(PUBLIC_DIR, file);
      if (content === null) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } else {
        fs.writeFileSync(filePath, content);
      }
    }
  });

  for (const file of OUTPUT_FILES) {
    it(`generates ${file} with non-zero size`, () => {
      const filePath = path.join(PUBLIC_DIR, file);
      expect(fs.existsSync(filePath), `${file} should exist`).toBe(true);
      const stat = fs.statSync(filePath);
      expect(stat.size, `${file} should have non-zero size`).toBeGreaterThan(0);
    });
  }

  it('llms.txt contains expected sections', () => {
    const content = fs.readFileSync(path.join(PUBLIC_DIR, 'llms.txt'), 'utf-8');
    expect(content).toContain('# PolicyEngine Research');
    expect(content).toContain('## Recent Research');
    expect(content).toContain('llms-recent.txt');
    expect(content).toContain('llms-full.txt');
    expect(content).toContain('llms-research-us.txt');
    expect(content).toContain('llms-research-uk.txt');
  });

  it('llms-recent.txt is smaller than llms-full.txt', () => {
    const recentSize = fs.statSync(path.join(PUBLIC_DIR, 'llms-recent.txt')).size;
    const fullSize = fs.statSync(path.join(PUBLIC_DIR, 'llms-full.txt')).size;
    expect(recentSize).toBeLessThan(fullSize);
  });

  it('articles are sorted by date descending in llms-recent.txt', () => {
    const content = fs.readFileSync(path.join(PUBLIC_DIR, 'llms-recent.txt'), 'utf-8');
    const dates = [...content.matchAll(/^Date: (.+)$/gm)].map((m) => new Date(m[1]).getTime());
    expect(dates.length).toBeGreaterThan(1);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
    }
  });
});
