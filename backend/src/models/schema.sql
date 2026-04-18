CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


CREATE TYPE user_role      AS ENUM ('customer','partner','admin');
CREATE TYPE partner_status AS ENUM ('pending','approved','suspended');
CREATE TYPE bag_status     AS ENUM ('available','sold_out','cancelled');
CREATE TYPE order_status   AS ENUM ('confirmed','ready','picked_up','cancelled');
CREATE TYPE payment_status AS ENUM ('pending','paid','refunded');


CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid  TEXT UNIQUE NOT NULL,
  phone         TEXT UNIQUE,
  email         TEXT UNIQUE,
  name          TEXT,
  password_hash TEXT,
  role          user_role NOT NULL DEFAULT 'customer',
  avatar_url    TEXT,
  fcm_token     TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE partners (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id),
  business_name  TEXT NOT NULL,
  category       TEXT NOT NULL,
  description    TEXT,
  address        TEXT NOT NULL,
  area           TEXT,
  latitude       NUMERIC(10,7),
  longitude      NUMERIC(10,7),
  logo_url       TEXT,
  cover_url      TEXT,
  rating         NUMERIC(2,1) DEFAULT 0,
  review_count   INT DEFAULT 0,
  commission_pct NUMERIC(4,2) NOT NULL DEFAULT 10.00,
  phone          TEXT,
  status         partner_status NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE bags (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id       UUID NOT NULL REFERENCES partners(id),
  title            TEXT NOT NULL,
  description      TEXT,
  original_price   NUMERIC(10,2) NOT NULL,
  discounted_price NUMERIC(10,2) NOT NULL,
  quantity_total   INT NOT NULL DEFAULT 1,
  quantity_left    INT NOT NULL DEFAULT 1,
  pickup_start     TIME NOT NULL,
  pickup_end       TIME NOT NULL,
  pickup_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  photo_url        TEXT,
  tags             TEXT[] DEFAULT '{}',
  status           bag_status NOT NULL DEFAULT 'available',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bag_id            UUID NOT NULL REFERENCES bags(id),
  user_id           UUID NOT NULL REFERENCES users(id),
  partner_id        UUID NOT NULL REFERENCES partners(id),
  quantity          INT NOT NULL DEFAULT 1,
  total_amount      NUMERIC(10,2) NOT NULL,
  commission_amt    NUMERIC(10,2) NOT NULL DEFAULT 0,
  partner_payout    NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method    TEXT NOT NULL DEFAULT 'cash',
  payment_status    payment_status NOT NULL DEFAULT 'pending',
  order_status      order_status NOT NULL DEFAULT 'confirmed',
  pickup_code       TEXT NOT NULL,
  notes             TEXT,
  picked_up_at      TIMESTAMPTZ,
  cash_confirmed_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE payment_intents (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  txn_ref    TEXT UNIQUE NOT NULL,
  bag_id     UUID NOT NULL REFERENCES bags(id),
  user_id    UUID NOT NULL REFERENCES users(id),
  quantity   INT NOT NULL DEFAULT 1,
  amount     NUMERIC(10,2) NOT NULL,
  method     TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',
  order_id   UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE favourites (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, partner_id)
);


CREATE INDEX idx_bags_partner          ON bags(partner_id);
CREATE INDEX idx_bags_status_date      ON bags(status, pickup_date);
CREATE INDEX idx_orders_user           ON orders(user_id);
CREATE INDEX idx_orders_partner        ON orders(partner_id);
CREATE INDEX idx_partners_status       ON partners(status);
CREATE INDEX idx_partners_area         ON partners USING gin(area gin_trgm_ops);
CREATE INDEX idx_payment_intents_txn_ref ON payment_intents(txn_ref);
CREATE INDEX idx_payment_intents_user    ON payment_intents(user_id);
CREATE INDEX idx_payment_intents_status  ON payment_intents(status);