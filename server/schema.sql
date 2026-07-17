CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  label text NOT NULL,
  href text NOT NULL,
  desc_base text NOT NULL,
  image text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY,
  cat text NOT NULL REFERENCES categories(id),
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  desc_text text NOT NULL DEFAULT '',
  offer boolean NOT NULL DEFAULT false,
  offer_price numeric(10,2),
  images jsonb NOT NULL DEFAULT '{"main":"","details":["","","",""]}',
  is_seed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  order_number text UNIQUE NOT NULL,
  user_id integer REFERENCES users(id),
  guest_email text,
  full_name text,
  postal_code text,
  street text,
  colonia text,
  city text,
  state text,
  country text,
  phone text,
  reference_note text,
  subtotal numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id integer REFERENCES products(id) ON DELETE SET NULL,
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  qty integer NOT NULL
);
