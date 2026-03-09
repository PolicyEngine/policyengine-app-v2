/**
 * Update image references from PNG/JPG to WebP across the codebase,
 * then remove the original files where a WebP version exists.
 *
 * Usage: node scripts/update-image-refs.mjs
 */
import { readdir, readFile, stat, unlink, writeFile } from 'fs/promises';
import { extname, join, resolve } from 'path';

const ASSET_DIRS = [
  resolve('public/assets/posts'),
  resolve('public/assets/team'),
  resolve('public/assets/authors'),
  resolve('public/assets/supporters'),
];

const SOURCE_DIRS = [resolve('src'), resolve('public')];

const CONVERTIBLE = new Set(['.png', '.jpg', '.jpeg']);
const TEXT_EXTENSIONS = new Set(['.tsx', '.ts', '.jsx', '.js', '.json', '.md', '.mdx', '.css']);

// Step 1: Build a set of files that have been converted (WebP exists alongside original)
async function getConvertedFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const converted = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      converted.push(...(await getConvertedFiles(fullPath)));
    } else if (CONVERTIBLE.has(extname(entry.name).toLowerCase())) {
      const webpPath = fullPath.replace(/\.(png|jpe?g)$/i, '.webp');
      try {
        await stat(webpPath);
        converted.push(fullPath);
      } catch {
        // No WebP version, skip
      }
    }
  }
  return converted;
}

// Step 2: Find all text files in source directories
async function getTextFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      files.push(...(await getTextFiles(fullPath)));
    } else if (TEXT_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

// Build replacement map: filename.png -> filename.webp
const replacements = new Map();
let removedCount = 0;

for (const dir of ASSET_DIRS) {
  const converted = await getConvertedFiles(dir);
  for (const filePath of converted) {
    const ext = extname(filePath);
    const basename = filePath.split('/').pop();
    const webpName = basename.replace(/\.(png|jpe?g)$/i, '.webp');
    replacements.set(basename, webpName);
  }
}

console.log(`Found ${replacements.size} files to update references for\n`);

// Step 3: Update references in source files
let updatedFiles = 0;
for (const dir of SOURCE_DIRS) {
  const textFiles = await getTextFiles(dir);
  for (const filePath of textFiles) {
    let content = await readFile(filePath, 'utf-8');
    let modified = false;

    for (const [original, webp] of replacements) {
      if (content.includes(original)) {
        content = content.replaceAll(original, webp);
        modified = true;
      }
    }

    if (modified) {
      await writeFile(filePath, content, 'utf-8');
      updatedFiles++;
      console.log(`Updated: ${filePath.replace(resolve('.'), '')}`);
    }
  }
}

console.log(`\nUpdated ${updatedFiles} source files`);

// Step 4: Remove original files
for (const dir of ASSET_DIRS) {
  const converted = await getConvertedFiles(dir);
  for (const filePath of converted) {
    await unlink(filePath);
    removedCount++;
  }
}

console.log(`Removed ${removedCount} original image files`);
