/**
 * Batch-convert PNG/JPG images to WebP and update references.
 *
 * Usage: node scripts/optimise-images.mjs
 *
 * - Converts all PNG/JPG/JPEG files in public/assets/ to WebP (quality 80)
 * - Skips files that already have a .webp counterpart
 * - Prints before/after sizes
 */
import { readdir, stat, unlink } from 'fs/promises';
import { basename, extname, join, resolve } from 'path';
import sharp from 'sharp';

const ASSET_DIRS = [
  resolve('public/assets/posts'),
  resolve('public/assets/team'),
  resolve('public/assets/authors'),
  resolve('public/assets/supporters'),
];

const CONVERTIBLE = new Set(['.png', '.jpg', '.jpeg']);

async function getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFiles(fullPath)));
    } else if (CONVERTIBLE.has(extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

let totalBefore = 0;
let totalAfter = 0;
let converted = 0;
let skipped = 0;

for (const dir of ASSET_DIRS) {
  const files = await getFiles(dir);

  for (const filePath of files) {
    const ext = extname(filePath).toLowerCase();
    const webpPath = filePath.replace(/\.(png|jpe?g)$/i, '.webp');

    // Skip if WebP already exists
    try {
      await stat(webpPath);
      skipped++;
      continue;
    } catch {
      // WebP doesn't exist yet — convert
    }

    const before = (await stat(filePath)).size;

    try {
      await sharp(filePath).webp({ quality: 80 }).toFile(webpPath);
      const after = (await stat(webpPath)).size;

      // Only keep the WebP if it's actually smaller
      if (after >= before) {
        await unlink(webpPath);
        skipped++;
        continue;
      }

      totalBefore += before;
      totalAfter += after;
      converted++;

      const savings = ((1 - after / before) * 100).toFixed(0);
      const name = basename(filePath);
      console.log(
        `${name}: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB (-${savings}%)`
      );
    } catch (err) {
      console.error(`Failed to convert ${basename(filePath)}: ${err.message}`);
    }
  }
}

console.log('\n--- Summary ---');
console.log(`Converted: ${converted} files`);
console.log(`Skipped: ${skipped} files (already WebP or no savings)`);
console.log(
  `Total savings: ${(totalBefore / 1024 / 1024).toFixed(1)} MB -> ${(totalAfter / 1024 / 1024).toFixed(1)} MB (-${((1 - totalAfter / totalBefore) * 100).toFixed(0)}%)`
);
