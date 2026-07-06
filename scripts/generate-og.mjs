import sharp from 'sharp';

const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#1d1d1f"/>
  <rect x="80" y="80" width="96" height="96" rx="20" fill="#ffffff"/>
  <text x="128" y="148" text-anchor="middle" font-family="Helvetica" font-size="60" font-weight="700" fill="#1d1d1f">G</text>
  <text x="80" y="320" font-family="Helvetica" font-size="72" font-weight="700" fill="#ffffff">Goliath Solutions</text>
  <text x="80" y="400" font-family="Helvetica" font-size="36" fill="#a1a1a6">Website, SEO &amp; marketing for the trades.</text>
  <text x="80" y="452" font-family="Helvetica" font-size="36" fill="#4ea3f5">Done for you.</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/og.png');
console.log('wrote public/og.png');
