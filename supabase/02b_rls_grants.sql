-- ============================================================
-- 02b_rls_grants.sql — VIEW publik, RLS tabel, dan GRANT untuk anon/publishable key
-- Jalankan SETELAH 01_rpcs.sql.
--
-- CATATAN PENTING: CREATE POLICY hanya valid untuk TABLE, bukan VIEW.
-- View dieksekusi dengan hak owner-nya (postgres), jadi view TIDAK butuh
-- policy — cukup GRANT SELECT ke anon/authenticated.
-- ============================================================

-- ---------- 1) VIEW ----------
CREATE OR REPLACE VIEW v_catalog AS
SELECT p.id, p.name, p.sku, p.description, p.unit, p.selling_price, p.current_stock,
       p.is_local_alasbuluh, p.min_stock_alert, p.is_active, p.category_id,
       c.name AS category_name, c.slug AS category_slug
FROM products p JOIN categories c ON c.id = p.category_id;

CREATE OR REPLACE VIEW v_orders_full AS
SELECT o.*, u.name AS customer_name, z.dusun_name,
       d.claimed_by_employee_id, du.name AS courier_name,
       (SELECT json_agg(json_build_object('name', oi.product_name_snapshot, 'qty', oi.qty,
               'price', oi.unit_selling_price, 'subtotal', oi.subtotal))
        FROM order_items oi WHERE oi.order_id = o.id) AS items
FROM orders o
JOIN users u ON u.id = o.customer_id
LEFT JOIN dusun_zones z ON z.id = o.dusun_zone_id
LEFT JOIN deliveries d ON d.order_id = o.id
LEFT JOIN users du ON du.id = d.claimed_by_employee_id;

CREATE OR REPLACE VIEW v_opname_sessions AS
SELECT s.*, u.name AS created_by_name,
       (SELECT count(*) FROM opname_items oi WHERE oi.opname_session_id = s.id) AS item_count
FROM opname_sessions s LEFT JOIN users u ON u.id = s.created_by_employee_id;

CREATE OR REPLACE VIEW v_daily_closings AS
SELECT dc.*, u.name AS submitted_by_name
FROM daily_closings dc LEFT JOIN users u ON u.id = dc.submitted_by_employee_id;

CREATE OR REPLACE VIEW v_audit_log AS
SELECT a.*, u.name AS actor_name
FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id;

CREATE OR REPLACE VIEW v_users_safe AS
SELECT id, member_number, name, email, phone, role, dusun_zone_id, address_detail,
       shu_points, is_active, last_login_at, created_at
FROM users;

-- ---------- 2) RLS pada tabel ----------
DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','dusun_zones','categories','products','product_images','stock_movements',
    'opname_sessions','opname_items','orders','order_items','deliveries','finance_entries','daily_closings',
    'cms_profiles','feature_flags','audit_logs'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Kebijakan read publik untuk tabel konten/katalog (idempotent: drop dulu)
DO $$ DECLARE p TEXT;
BEGIN
  FOREACH p IN ARRAY ARRAY['anon_read_products','anon_read_product_images','anon_read_categories',
    'anon_read_dusun','anon_read_cms','anon_read_flags'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %s', p,
      CASE p
        WHEN 'anon_read_products' THEN 'products'
        WHEN 'anon_read_product_images' THEN 'product_images'
        WHEN 'anon_read_categories' THEN 'categories'
        WHEN 'anon_read_dusun' THEN 'dusun_zones'
        WHEN 'anon_read_cms' THEN 'cms_profiles'
        WHEN 'anon_read_flags' THEN 'feature_flags'
      END);
  END LOOP;
END $$;

CREATE POLICY anon_read_products ON products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY anon_read_product_images ON product_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY anon_read_categories ON categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY anon_read_dusun ON dusun_zones FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY anon_read_cms ON cms_profiles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY anon_read_flags ON feature_flags FOR SELECT TO anon, authenticated USING (true);

-- ---------- 3) GRANT ----------
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Tabel publik read-only
GRANT SELECT ON products, product_images, categories, dusun_zones, cms_profiles, feature_flags TO anon, authenticated;

-- View (tanpa policy — dieksekusi dengan hak owner)
GRANT SELECT ON v_catalog, v_orders_full, v_opname_sessions, v_daily_closings, v_audit_log, v_users_safe TO anon, authenticated;

-- users TANPA grant anon-select langsung (sensitive); akses via view v_users_safe / RPC.
REVOKE ALL ON users FROM anon;

-- ---------- 4) GRANT EXECUTE RPC ----------
-- Semua fungsi security definer (validasi role di dalam fungsi via assert_role):
GRANT EXECUTE ON FUNCTION record_stock_movement(UUID,TEXT,INTEGER,TEXT,UUID,UUID,TEXT,TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION restock_product(UUID,UUID,INTEGER,NUMERIC,TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_order(UUID,JSONB,TEXT,UUID,TEXT,TEXT,TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION order_claim(UUID,UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION order_set_status(UUID,UUID,TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION order_complete(UUID,UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION order_cancel(UUID,UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION order_cod_remit(UUID,UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION pos_sale(UUID,JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION add_expense(UUID,TEXT,NUMERIC,TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION daily_cash_recap() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION daily_closing_submit(UUID,NUMERIC,NUMERIC,TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION closing_verify(UUID,UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION opname_create(UUID,TEXT,UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION opname_set_item(UUID,UUID,UUID,INTEGER,TEXT,TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION opname_submit(UUID,UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION opname_approve(UUID,UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION opname_reject(UUID,UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_product(UUID,UUID,TEXT,TEXT,TEXT,TEXT,NUMERIC,NUMERIC,INTEGER,INTEGER,BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_product(UUID,UUID,JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_staff_account(UUID,TEXT,TEXT,TEXT,TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION toggle_user_active(UUID,UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION touch_last_login(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cms_upsert(UUID,TEXT,JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION landing_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_dashboard() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION register_customer(TEXT,TEXT,TEXT,UUID) TO anon, authenticated;

-- CATATAN KEAMANAN MVP:
-- Fungsi security definer memvalidasi role dari tabel users (assert_role), sehingga
-- walaupun RPC bisa dipanggil anon dengan user_id sembarangan, aksi gagal 42501 bila
-- role tidak sesuai. Header JWT user TIDAK diverifikasi kriptografis di dalam SQL
-- (pola prototype) — produksi: Supabase Auth / verifikasi JWT di server route.
