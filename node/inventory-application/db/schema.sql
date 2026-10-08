-- Axle Supply schema
-- Apply with: psql "$DATABASE_URL" --single-transaction --set ON_ERROR_STOP=1 -f db/schema.sql

BEGIN;

CREATE TABLE categories (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        VARCHAR(80)  NOT NULL,
  description TEXT         NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Case-insensitive unique category names.
CREATE UNIQUE INDEX categories_lower_name_uidx ON categories (lower(name));

CREATE TABLE items (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id    INTEGER       NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
  sku            VARCHAR(40)   NOT NULL,
  name           VARCHAR(120)  NOT NULL,
  brand          VARCHAR(80)   NOT NULL,
  part_number    VARCHAR(60),
  description    TEXT          NOT NULL DEFAULT '',
  unit_price     NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  stock_quantity INTEGER       NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  archived_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  -- SKU is normalized to uppercase by the application: letter or digit first,
  -- then letters, digits and hyphens.
  CONSTRAINT items_sku_format CHECK (sku ~ '^[A-Z0-9][A-Z0-9-]*$'),
  -- An archived item must have zero stock.
  CONSTRAINT items_archived_zero_stock CHECK (archived_at IS NULL OR stock_quantity = 0)
);

-- Unique even among archived items.
CREATE UNIQUE INDEX items_sku_uidx ON items (sku);
-- Catalog lookups by category.
CREATE INDEX items_category_idx ON items (category_id);

CREATE TABLE stock_movements (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  item_id      INTEGER      NOT NULL REFERENCES items (id) ON DELETE RESTRICT,
  type         VARCHAR(20)  NOT NULL CHECK (type IN ('receipt', 'dispatch', 'adjustment')),
  delta        INTEGER      NOT NULL CHECK (delta <> 0),
  stock_before INTEGER      NOT NULL CHECK (stock_before >= 0),
  stock_after  INTEGER      NOT NULL CHECK (stock_after >= 0),
  reason       VARCHAR(250) NOT NULL,
  request_id   UUID         NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  -- Every record is internally consistent.
  CONSTRAINT stock_movements_consistency CHECK (stock_after = stock_before + delta),
  -- Receipts add stock, dispatches remove it; adjustments may go either way.
  CONSTRAINT stock_movements_receipt_positive CHECK (type <> 'receipt' OR delta > 0),
  CONSTRAINT stock_movements_dispatch_negative CHECK (type <> 'dispatch' OR delta < 0)
);

-- Movement history per item, newest first.
CREATE INDEX stock_movements_item_created_idx ON stock_movements (item_id, created_at DESC);

COMMIT;
