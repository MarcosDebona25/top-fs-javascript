// Builds the web images from the originals in assets/ (run once, outputs are committed):
//   npm run build:images
// Maps become AVIF + WebP at four widths plus a tiny blurred placeholder; characters become WebP + PNG.
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapsIn = path.join(root, 'assets', 'maps');
const charactersIn = path.join(root, 'assets', 'characters');
const mapsOut = path.join(root, 'client', 'public', 'img', 'maps');
const charactersOut = path.join(root, 'client', 'public', 'img', 'characters');

const MAP_WIDTHS = [480, 640, 1024, 1600, 2560];
const CHARACTER_HEIGHT = 320;

await mkdir(mapsOut, { recursive: true });
await mkdir(charactersOut, { recursive: true });

const manifest = {};
for (const file of (await readdir(mapsIn)).filter((name) => name.endsWith('.jpg')).sort()) {
  const slug = path.basename(file, '.jpg');
  const source = path.join(mapsIn, file);
  const { width, height } = await sharp(source).metadata();
  manifest[slug] = { width, height, widths: MAP_WIDTHS };

  for (const size of MAP_WIDTHS) {
    // Never enlarge: the originals are 2560 px wide, so the largest variant is a re-encode.
    const resized = () => sharp(source).resize({ width: size, withoutEnlargement: true });
    await resized().avif({ quality: 60, effort: 5 }).toFile(path.join(mapsOut, `${slug}-${size}.avif`));
    await resized().webp({ quality: 82, effort: 5 }).toFile(path.join(mapsOut, `${slug}-${size}.webp`));
  }
  await sharp(source).resize({ width: 32 }).webp({ quality: 40 }).toFile(path.join(mapsOut, `${slug}-placeholder.webp`));
  console.log(`map ${slug}: ${width}x${height}`);
}
await writeFile(path.join(mapsOut, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

for (const file of (await readdir(charactersIn)).filter((name) => name.endsWith('.png')).sort()) {
  const slug = path.basename(file, '.png');
  const resized = () => sharp(path.join(charactersIn, file)).resize({ height: CHARACTER_HEIGHT, withoutEnlargement: true });
  await resized().webp({ quality: 92, effort: 5 }).toFile(path.join(charactersOut, `${slug}.webp`));
  await resized().png({ compressionLevel: 9 }).toFile(path.join(charactersOut, `${slug}.png`));
  console.log(`character ${slug}`);
}
