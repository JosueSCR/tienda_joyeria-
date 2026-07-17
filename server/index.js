require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const pool = require('./db');
const { signToken, attachUser, requireAuth, requireAdmin } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(attachUser);

function ah(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function money(n) {
  return '$' + Number(n).toLocaleString('es-MX', { maximumFractionDigits: 0 }) + ' MXN';
}

function formatProduct(row, categories) {
  const cat = categories[row.cat] || {};
  return {
    id: row.id,
    cat: row.cat,
    catLabel: cat.label || row.cat,
    catHref: cat.href || '',
    name: row.name,
    price: money(row.price),
    priceRaw: Number(row.price),
    desc: row.desc_text || cat.desc_base || '',
    offer: row.offer,
    offerPrice: row.offer ? money(row.offer_price) : '',
    offerPriceRaw: row.offer ? Number(row.offer_price) : null,
    images: row.images || { main: '', details: ['', '', '', ''] },
    custom: !row.is_seed,
  };
}

async function getCategoriesMap() {
  const { rows } = await pool.query('SELECT * FROM categories ORDER BY position');
  const map = {};
  rows.forEach((r) => { map[r.id] = r; });
  return map;
}

// ---------- Categories ----------
app.get('/api/categories', ah(async (req, res) => {
  const categories = await getCategoriesMap();
  const counts = await pool.query('SELECT cat, count(*)::int AS n FROM products GROUP BY cat');
  const countMap = {};
  counts.rows.forEach((r) => { countMap[r.cat] = r.n; });
  const list = Object.values(categories).map((c) => ({
    id: c.id, label: c.label, href: c.href, descBase: c.desc_base, image: c.image || '', count: countMap[c.id] || 0,
  }));
  res.json(list);
}));

app.put('/api/categories/:id', requireAdmin, ah(async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE categories SET image = $1 WHERE id = $2 RETURNING *',
    [req.body.image || '', req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Categoría no encontrada.' });
  res.json({ id: rows[0].id, label: rows[0].label, href: rows[0].href, descBase: rows[0].desc_base, image: rows[0].image });
}));

// ---------- Settings ----------
app.get('/api/settings/:key', ah(async (req, res) => {
  const { rows } = await pool.query('SELECT value FROM settings WHERE key = $1', [req.params.key]);
  res.json({ key: req.params.key, value: rows.length ? rows[0].value : '' });
}));

app.put('/api/settings/:key', requireAdmin, ah(async (req, res) => {
  await pool.query(
    'INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value = $2',
    [req.params.key, req.body.value || '']
  );
  res.json({ key: req.params.key, value: req.body.value || '' });
}));

// ---------- Products ----------
app.get('/api/products', ah(async (req, res) => {
  const categories = await getCategoriesMap();
  const cat = req.query.cat;
  const q = req.query.q;
  let sql = 'SELECT * FROM products';
  const params = [];
  const clauses = [];
  if (cat) { params.push(cat); clauses.push('cat = $' + params.length); }
  if (q) { params.push('%' + q.toLowerCase() + '%'); clauses.push('lower(name) LIKE $' + params.length); }
  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
  sql += ' ORDER BY id ASC';
  const { rows } = await pool.query(sql, params);
  res.json(rows.map((r) => formatProduct(r, categories)));
}));

app.get('/api/products/:id', ah(async (req, res) => {
  const categories = await getCategoriesMap();
  const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado.' });
  res.json(formatProduct(rows[0], categories));
}));

app.post('/api/products', requireAdmin, ah(async (req, res) => {
  const b = req.body;
  if (!b.name || !b.price) return res.status(400).json({ error: 'Nombre y precio son requeridos.' });
  const images = b.images || { main: '', details: ['', '', '', ''] };
  const { rows } = await pool.query(
    `INSERT INTO products (cat, name, price, desc_text, offer, offer_price, images, is_seed)
     VALUES ($1,$2,$3,$4,$5,$6,$7,false) RETURNING *`,
    [b.cat, b.name, b.price, b.desc || '', !!b.offer, b.offer ? b.offerPrice : null, JSON.stringify(images)]
  );
  const categories = await getCategoriesMap();
  res.status(201).json(formatProduct(rows[0], categories));
}));

app.put('/api/products/:id', requireAdmin, ah(async (req, res) => {
  const b = req.body;
  const images = b.images || { main: '', details: ['', '', '', ''] };
  const { rows } = await pool.query(
    `UPDATE products SET name=$1, price=$2, desc_text=$3, offer=$4, offer_price=$5, images=$6
     WHERE id=$7 RETURNING *`,
    [b.name, b.price, b.desc || '', !!b.offer, b.offer ? b.offerPrice : null, JSON.stringify(images), req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado.' });
  const categories = await getCategoriesMap();
  res.json(formatProduct(rows[0], categories));
}));

app.delete('/api/products/:id', requireAdmin, ah(async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Producto no encontrado.' });
  res.status(204).end();
}));

// ---------- Auth ----------
app.post('/api/auth/register', ah(async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email',
    [name || '', email.toLowerCase(), hash]
  );
  const user = rows[0];
  res.status(201).json({ token: signToken(user), user });
}));

app.post('/api/auth/login', ah(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas.' });
  const ok = await bcrypt.compare(password, rows[0].password_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas.' });
  const user = { id: rows[0].id, name: rows[0].name, email: rows[0].email };
  res.json({ token: signToken(user), user });
}));

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// ---------- Orders ----------
function genOrderNumber() {
  return 'ECL-' + Math.floor(100000 + Math.random() * 900000);
}

app.post('/api/orders', ah(async (req, res) => {
  const b = req.body;
  const items = Array.isArray(b.items) ? b.items : [];
  if (!items.length) return res.status(400).json({ error: 'El carrito está vacío.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ids = items.map((it) => it.id);
    const { rows: products } = await client.query('SELECT * FROM products WHERE id = ANY($1)', [ids]);
    const byId = {};
    products.forEach((p) => { byId[p.id] = p; });

    let subtotal = 0;
    const lineItems = items.map((it) => {
      const p = byId[it.id];
      if (!p) throw new Error('Producto ' + it.id + ' no encontrado.');
      const price = p.offer ? Number(p.offer_price) : Number(p.price);
      subtotal += price * it.qty;
      return { product_id: p.id, name: p.name, price, qty: it.qty };
    });

    const orderNumber = genOrderNumber();
    const shipping = b.shipping || {};
    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (order_number, user_id, guest_email, full_name, postal_code, street, colonia, city, state, country, phone, reference_note, subtotal)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [orderNumber, req.user ? req.user.id : null, shipping.email || null, shipping.fullName || null,
       shipping.postalCode || null, shipping.street || null, shipping.colonia || null, shipping.city || null,
       shipping.state || null, shipping.country || null, shipping.phone || null, shipping.reference || null, subtotal]
    );
    const orderId = orderRows[0].id;

    for (const li of lineItems) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, name, price, qty) VALUES ($1,$2,$3,$4,$5)',
        [orderId, li.product_id, li.name, li.price, li.qty]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ orderNumber, subtotal: money(subtotal) });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

// ---------- Error handling (must be last) ----------
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err && err.code === '23505') return res.status(409).json({ error: 'El registro ya existe.' });
  if (err && err.code === '23503') return res.status(409).json({ error: 'No se puede completar: hay datos relacionados que lo impiden.' });
  res.status(500).json({ error: 'Error interno del servidor.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('ÉCLAT API listening on http://localhost:' + PORT));
