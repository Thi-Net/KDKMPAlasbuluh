-- ============================================================
-- Koperasi Desa Merah Putih Alasbuluh — Skema Database (Tahap 1)
-- Jalankan file ini di Supabase SQL Editor (bersih) DULU,
-- lalu jalankan supabase/seed.sql, lalu set DATABASE_URL di Vercel.
-- Zona waktu: seluruh agregasi tanggal memakai (created_at at time zone 'Asia/Jakarta')::date
-- ============================================================

-- 1. USERS (3 role: admin | employee | customer)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_number TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','employee','customer')),
  dusun_zone_id UUID,
  address_detail TEXT,
  shu_points INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- 2. DUSUN ZONES (Desa Alasbuluh)
CREATE TABLE IF NOT EXISTS dusun_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dusun_name TEXT NOT NULL,
  delivery_fee INTEGER NOT NULL DEFAULT 3000,
  estimated_minutes INTEGER NOT NULL DEFAULT 20,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- 3. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  is_local_umkm BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id),
  sku TEXT UNIQUE,
  barcode TEXT,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'pcs',
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,      -- HPP
  selling_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  reserved_stock INTEGER NOT NULL DEFAULT 0,
  min_stock_alert INTEGER NOT NULL DEFAULT 5,
  is_local_alasbuluh BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- 5. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 6. STOCK MOVEMENTS (immutable ledger — satu-satunya pintu perubahan stok)
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('IN_RESTOCK','OUT_ONLINE','OUT_OFFLINE_POS','ADJUST_OPNAME','RETURN')),
  qty_change INTEGER NOT NULL,
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  unit_cost_at_time NUMERIC(12,2),
  reference_type TEXT,
  reference_id UUID,
  actor_user_id UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_movements_product ON stock_movements(product_id, created_at);
CREATE INDEX IF NOT EXISTS idx_movements_ref ON stock_movements(reference_type, reference_id);

-- 7. OPNAME SESSIONS
CREATE TABLE IF NOT EXISTS opname_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  scope_category_id UUID REFERENCES categories(id),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED')),
  created_by_employee_id UUID REFERENCES users(id),
  reviewed_by_admin_id UUID REFERENCES users(id),
  total_variance_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. OPNAME ITEMS
CREATE TABLE IF NOT EXISTS opname_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opname_session_id UUID NOT NULL REFERENCES opname_sessions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  system_qty INTEGER NOT NULL,
  physical_qty INTEGER NOT NULL,
  difference_qty INTEGER NOT NULL,
  reason_category TEXT,
  notes TEXT,
  evidence_image_url TEXT,
  UNIQUE (opname_session_id, product_id)
);

-- 9. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES users(id),
  channel TEXT NOT NULL DEFAULT 'WEB' CHECK (channel IN ('WEB','ANDROID','OFFLINE_POS')),
  fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('DELIVERY','PICKUP','DIRECT_POS')),
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','CONFIRMED','PACKING','READY','ON_DELIVERY','COMPLETED','CANCELLED')),
  payment_method TEXT NOT NULL DEFAULT 'COD' CHECK (payment_method IN ('COD','QRIS')),
  payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID','PAID')),
  dusun_zone_id UUID REFERENCES dusun_zones(id),
  delivery_address TEXT,
  delivery_landmark_notes TEXT,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_cost_hpp NUMERIC(14,2) NOT NULL DEFAULT 0,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idem ON orders(idempotency_key);

-- 10. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name_snapshot TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_selling_price NUMERIC(12,2) NOT NULL,
  unit_cost_hpp NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(14,2) NOT NULL
);

-- 11. DELIVERIES
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  claimed_by_employee_id UUID REFERENCES users(id),
  claimed_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  sla_deadline_at TIMESTAMPTZ,
  cod_amount_collected NUMERIC(14,2),
  cod_remitted_to_cashier BOOLEAN NOT NULL DEFAULT false,
  proof_photo_url TEXT,
  recipient_name TEXT
);
CREATE INDEX IF NOT EXISTS idx_deliveries_claimed ON deliveries(claimed_by_employee_id);

-- 12. FINANCE ENTRIES
CREATE TABLE IF NOT EXISTS finance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number TEXT,
  transaction_date DATE NOT NULL DEFAULT (now() at time zone 'Asia/Jakarta')::date,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('INCOME','EXPENSE')),
  category TEXT NOT NULL CHECK (category IN ('PENJUALAN_ONLINE','PENJUALAN_GERAI_OFFLINE','HPP_BARANG','KULAKAN_STOK','OPERASIONAL_GERAI','BBM_KURIR','GAJI_INSENTIF','LAINNYA')),
  amount NUMERIC(14,2) NOT NULL,
  description TEXT,
  attachment_url TEXT,
  reference_order_id UUID REFERENCES orders(id),
  recorded_by_user_id UUID REFERENCES users(id),
  verification_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (verification_status IN ('DRAFT','SUBMITTED','VERIFIED_LOCKED')),
  verified_by_admin_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_finance_date ON finance_entries(transaction_date);
CREATE INDEX IF NOT EXISTS idx_finance_category ON finance_entries(category);

-- 13. DAILY CLOSINGS
CREATE TABLE IF NOT EXISTS daily_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closing_date DATE NOT NULL,
  opening_cash NUMERIC(14,2) NOT NULL DEFAULT 0,
  system_online_cod_cash NUMERIC(14,2) NOT NULL DEFAULT 0,
  system_offline_pos_cash NUMERIC(14,2) NOT NULL DEFAULT 0,
  system_cash_expenses NUMERIC(14,2) NOT NULL DEFAULT 0,
  expected_closing_cash NUMERIC(14,2) NOT NULL DEFAULT 0,
  actual_physical_cash NUMERIC(14,2) NOT NULL DEFAULT 0,
  cash_difference NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED','VERIFIED_LOCKED')),
  submitted_by_employee_id UUID REFERENCES users(id),
  verified_by_admin_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. CMS PROFILES (konten landing page — editable admin)
CREATE TABLE IF NOT EXISTS cms_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT UNIQUE NOT NULL CHECK (section_key IN ('hero','stats','about_koperasi','board_members','contact_info')),
  content_json JSONB NOT NULL DEFAULT '{}',
  updated_by_admin_id UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. FEATURE FLAGS
CREATE TABLE IF NOT EXISTS feature_flags (
  key TEXT PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  config_json JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. AUDIT LOGS (immutable)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id),
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  entity_id UUID,
  before_state_json JSONB,
  after_state_json JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
