const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const sources = [
  'home-hero.webp', 'home-about.webp', 'home-infrastructure.webp',
  'home-residential.webp', 'home-commercial.webp', 'home-agricultural.webp',
  'home-industrial.webp', 'home-multijet.webp', 'meter-installed.png',
  'single-jet.png', 'multi-jet.png', 'woltman.png',
  'home-hero-blue.webp', 'home-hero-brass.webp',
];
const widths = [320, 480, 640, 750, 828, 960, 1200, 1440, 1920];

(async () => {
  const requested = process.argv.slice(2);
  if (requested.some(file => !sources.includes(file))) throw new Error('Unknown image source. Use filenames from the sources list.');
  const manifestPath = path.join(root, 'lib/image-manifest.json');
  const manifest = requested.length ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
  fs.mkdirSync(path.join(root, 'public/assets/optimized/static'), { recursive: true });
  for (const file of requested.length ? requested : sources) {
    const source = path.join(root, 'public/assets', file);
    const name = path.parse(file).name;
    const metadata = await sharp(source).metadata();
    const maxWidth = Math.min(metadata.width, name.startsWith('home-hero') ? 1920 : 1200);
    const sizes = [...new Set([...widths.filter(width => width < maxWidth), maxWidth])];
    const variants = [];
    for (const width of sizes) {
      const image = sharp(source).resize({ width, withoutEnlargement: true });
      const avifData = await image.clone().avif({ quality: 50, effort: 4 }).toBuffer();
      const webpData = await image.clone().webp({ quality: 78, effort: 5 }).toBuffer();
      const digest = data => createHash('sha256').update(data).digest('hex').slice(0, 12);
      const avif = `/assets/optimized/static/${name}-${width}.${digest(avifData)}.avif`;
      const webp = `/assets/optimized/static/${name}-${width}.${digest(webpData)}.webp`;
      fs.writeFileSync(path.join(root, 'public', avif), avifData);
      fs.writeFileSync(path.join(root, 'public', webp), webpData);
      variants.push({ width, avif, webp });
    }
    manifest[`/assets/optimized/${name}.webp`] = {
      width: metadata.width, height: metadata.height, variants,
    };
    console.log(`${name}: ${variants.length} responsive sizes prepared`);
  }
  fs.writeFileSync(path.join(root, 'lib/image-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
