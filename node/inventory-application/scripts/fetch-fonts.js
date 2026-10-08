// One-off helper: downloads the latin woff2 subsets for the three
// self-hosted fonts and writes public/css/fonts.css with local @font-face rules.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const FONTS = [
  { family: 'Barlow Condensed', weights: [500, 600, 700] },
  { family: 'Source Sans 3', weights: [400, 600, 700] },
  { family: 'IBM Plex Mono', weights: [400, 500, 600] },
];

const ROOT = path.join(__dirname, '..');
const FONT_DIR = path.join(ROOT, 'public', 'fonts');

function slug(family) {
  return family.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

async function fetchCss(family, weights) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  ).replace(/%20/g, '+')}:wght@${weights.join(';')}&display=swap`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`CSS fetch failed for ${family}: ${res.status}`);
  return res.text();
}

function parseFontFaces(css) {
  const faces = [];
  const re = /@font-face\s*{([^}]+)}/g;
  let match;
  while ((match = re.exec(css)) !== null) {
    const block = match[1];
    const weight = (block.match(/font-weight:\s*(\d+)/) || [])[1];
    const range = (block.match(/unicode-range:\s*([^;]+)/) || [])[1] || '';
    const src = (block.match(/url\((https:[^)]+\.woff2)\)/) || [])[1];
    if (weight && src) {
      faces.push({ weight: Number(weight), range, src });
    }
  }
  return faces;
}

function isLatin(range) {
  // Keep the subset that covers basic latin (U+0000-00FF).
  return /U\+0000-00FF/.test(range);
}

async function download(url, file) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(file, buf);
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 12);
}

async function main() {
  const rules = [];
  for (const font of FONTS) {
    const css = await fetchCss(font.family, font.weights);
    const faces = parseFontFaces(css).filter((f) => isLatin(f.range));
    if (!faces.length) throw new Error(`No latin subset for ${font.family}`);
    for (const face of faces) {
      const file = `${slug(font.family)}-${face.weight}.woff2`;
      await download(face.src, path.join(FONT_DIR, file));
      rules.push(
        `@font-face {
  font-family: '${font.family}';
  font-style: normal;
  font-weight: ${face.weight};
  font-display: swap;
  src: url('/fonts/${file}') format('woff2');
  unicode-range: ${face.range.trim()};
}`
      );
      console.log(`downloaded ${file}`);
    }
  }
  const header = [
    '/* Self-hosted webfonts (SIL Open Font License). Generated from Google Fonts.',
    '   Licenses: public/fonts/OFL-Barlow-Condensed.txt, OFL-Source-Sans-3.txt, OFL-IBM-Plex-Mono.txt */',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'public', 'css', 'fonts.css'), header + rules.join('\n\n') + '\n');
  console.log('wrote public/css/fonts.css');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
