require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./db');

const CATEGORIES = [
  { id: 'pulseras', label: 'PULSERAS', href: 'Pulseras.html', desc_base: 'Pulsera de oro 14K con piedra esmeralda sintética. Un símbolo de poder y elegancia.', position: 1 },
  { id: 'collares', label: 'COLLARES', href: 'Collares.html', desc_base: 'Collar de oro 14K con piedra esmeralda sintética. Un símbolo de poder y elegancia.', position: 2 },
  { id: 'anillos', label: 'ANILLOS', href: 'Anillos.html', desc_base: 'Anillo de oro 14K con piedra esmeralda sintética. Un símbolo de poder y elegancia.', position: 3 },
  { id: 'aretes', label: 'ARETES', href: 'Aretes.html', desc_base: 'Aretes de oro 14K con piedra esmeralda sintética. Un símbolo de poder y elegancia.', position: 4 },
];

const PRODUCTS = [
  { cat: 'pulseras', name: 'PULSERA AURORA', price: 2450 },
  { cat: 'pulseras', name: 'PULSERA ESMERALDA', price: 3180 },
  { cat: 'pulseras', name: 'PULSERA CLÁSICA', price: 1920 },
  { cat: 'pulseras', name: 'PULSERA FILIGRANA', price: 2760 },
  { cat: 'collares', name: 'COLLAR AURORA', price: 3950 },
  { cat: 'collares', name: 'COLLAR ESMERALDA REAL', price: 5420 },
  { cat: 'collares', name: 'COLLAR CADENA FINA', price: 2680 },
  { cat: 'collares', name: 'COLLAR COLGANTE LUNA', price: 3290 },
  { cat: 'anillos', name: 'ANILLO SOLITARIO', price: 4120 },
  { cat: 'anillos', name: 'ANILLO HALO ESMERALDA', price: 5890 },
  { cat: 'anillos', name: 'ANILLO TRINITY', price: 3340 },
  { cat: 'anillos', name: 'ANILLO VINTAGE', price: 3975 },
  { cat: 'aretes', name: 'ARETES GOTA', price: 2150 },
  { cat: 'aretes', name: 'ARETES ESMERALDA', price: 3690 },
  { cat: 'aretes', name: 'ARETES ARGOLLA', price: 1870 },
  { cat: 'aretes', name: 'ARETES PERLA', price: 2430 },
];

async function runSeed() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Schema ready.');

  for (const c of CATEGORIES) {
    await pool.query(
      'INSERT INTO categories (id, label, href, desc_base, position) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING',
      [c.id, c.label, c.href, c.desc_base, c.position]
    );
  }
  console.log('Categories seeded.');

  const { rows } = await pool.query('SELECT count(*)::int AS n FROM products WHERE is_seed = true');
  if (rows[0].n > 0) {
    console.log('Seed products already present (' + rows[0].n + '), skipping product seed.');
  } else {
    for (const p of PRODUCTS) {
      await pool.query(
        'INSERT INTO products (cat, name, price, desc_text, offer, offer_price, images, is_seed) VALUES ($1,$2,$3,$4,$5,$6,$7,true)',
        [p.cat, p.name, p.price, '', false, null, JSON.stringify({ main: '', details: ['', '', '', ''] })]
      );
    }
    console.log('Seeded ' + PRODUCTS.length + ' products.');
  }

  const heroSetting = await pool.query("SELECT value FROM settings WHERE key = 'hero_image'");
  if (heroSetting.rows.length === 0) {
    const heroPath = path.join(__dirname, '..', 'assets', 'hero-necklace.png');
    if (fs.existsSync(heroPath)) {
      const heroDataUrl = 'data:image/png;base64,' + fs.readFileSync(heroPath).toString('base64');
      await pool.query("INSERT INTO settings (key, value) VALUES ('hero_image', $1)", [heroDataUrl]);
      console.log('Seeded hero_image setting from assets/hero-necklace.png.');
    }
  } else {
    console.log('hero_image setting already present, skipping.');
  }
}

module.exports = { runSeed };

if (require.main === module) {
  runSeed()
    .then(() => pool.end())
    .catch((e) => { console.error(e); process.exit(1); });
}
