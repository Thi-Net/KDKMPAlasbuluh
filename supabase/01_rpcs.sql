-- ============================================================
-- 01_rpcs.sql — Fungsi RPC security definer (logika bisnis server-side)
-- Jalankan SETELAH 00_schema.sql, SEBELUM 02_seed.sql.
--
-- Prinsip:
--  * Stok TIDAK PERNAH ditimpa langsung — semua lewat record_stock_movement()
--    (menulis stock_movements dengan balance_before/after dalam transaksi).
--  * Validasi stok & harga dilakukan SERVER, bukan percaya client.
--  * Role divalidasi dari tabel users (bukan percaya client).
--  * Agregasi tanggal memakai (created_at at time zone 'Asia/Jakarta')::date.
-- ============================================================

-- ---------- HELPER: validasi role ----------
CREATE OR REPLACE FUNCTION assert_role(p_user_id UUID, p_roles TEXT[])
RETURNS users LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user users;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'Belum login.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_user FROM users WHERE id = p_user_id;
  IF NOT FOUND OR NOT v_user.is_active THEN RAISE EXCEPTION 'Akun tidak ditemukan atau tidak aktif.' USING ERRCODE = '42501'; END IF;
  IF NOT (v_user.role = ANY (p_roles)) THEN RAISE EXCEPTION 'Akses ditolak untuk peran %.', v_user.role USING ERRCODE = '42501'; END IF;
  RETURN v_user;
END $$;

-- ---------- CORE: stock ledger (satu-satunya pintu perubahan stok) ----------
CREATE OR REPLACE FUNCTION record_stock_movement(
  p_product_id UUID, p_movement_type TEXT, p_qty_change INTEGER,
  p_reference_type TEXT DEFAULT NULL, p_reference_id UUID DEFAULT NULL,
  p_actor_user_id UUID DEFAULT NULL, p_actor_role TEXT DEFAULT NULL, p_notes TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_before INTEGER; v_after INTEGER; v_cost NUMERIC;
BEGIN
  SELECT current_stock, cost_price INTO v_before, v_cost FROM products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produk tidak ditemukan.'; END IF;
  v_after := v_before + p_qty_change;
  IF v_after < 0 THEN RAISE EXCEPTION 'Stok tidak boleh negatif (sisa %, diminta %).', v_before, abs(p_qty_change); END IF;
  UPDATE products SET current_stock = v_after WHERE id = p_product_id;
  INSERT INTO stock_movements (product_id, movement_type, qty_change, balance_before, balance_after, unit_cost_at_time, reference_type, reference_id, actor_user_id, notes)
  VALUES (p_product_id, p_movement_type, p_qty_change, v_before, v_after, v_cost, p_reference_type, p_reference_id, p_actor_user_id, p_notes);
  RETURN jsonb_build_object('before', v_before, 'after', v_after);
END $$;

-- ---------- RESTOCK / KULAKAN ----------
CREATE OR REPLACE FUNCTION restock_product(p_actor_id UUID, p_product_id UUID, p_qty INTEGER, p_unit_cost NUMERIC DEFAULT NULL, p_notes TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor users; v_res JSONB;
BEGIN
  v_actor := assert_role(p_actor_id, ARRAY['admin','employee']);
  IF p_qty <= 0 THEN RAISE EXCEPTION 'Jumlah harus positif.'; END IF;
  SELECT record_stock_movement(p_product_id, 'IN_RESTOCK', p_qty, 'RESTOCK', NULL, p_actor_id, v_actor.role, coalesce(p_notes,'Restock gerai')) INTO v_res;
  RETURN v_res;
END $$;

-- ---------- CHECKOUT ORDER (idempotent, validasi harga & stok server) ----------
CREATE OR REPLACE FUNCTION create_order(
  p_customer_id UUID, p_items JSONB, p_fulfillment_type TEXT,
  p_dusun_zone_id UUID DEFAULT NULL, p_delivery_address TEXT DEFAULT '',
  p_delivery_landmark_notes TEXT DEFAULT '', p_idempotency_key TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor users; v_order_id UUID; v_order_number TEXT;
  v_subtotal NUMERIC := 0; v_hpp NUMERIC := 0; v_delivery_fee NUMERIC := 0; v_total NUMERIC;
  v_item JSONB; v_prod RECORD; v_qty INTEGER; v_existing TEXT;
BEGIN
  v_actor := assert_role(p_customer_id, ARRAY['customer']);
  IF p_idempotency_key IS NULL OR p_idempotency_key = '' THEN RAISE EXCEPTION 'idempotency_key wajib ada.'; END IF;

  -- Idempotency
  SELECT order_number INTO v_existing FROM orders WHERE idempotency_key = p_idempotency_key;
  IF v_existing IS NOT NULL THEN RETURN jsonb_build_object('order_number', v_existing, 'duplicate', true); END IF;

  IF jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Keranjang kosong.'; END IF;
  IF p_fulfillment_type NOT IN ('DELIVERY','PICKUP') THEN RAISE EXCEPTION 'Tipe fulfillment tidak valid.'; END IF;

  -- Validasi stok & harga dari SERVER (lock baris produk)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'qty')::INTEGER;
    IF v_qty IS NULL OR v_qty <= 0 THEN RAISE EXCEPTION 'Qty tidak valid.'; END IF;
    SELECT id, name, selling_price, cost_price, current_stock INTO v_prod FROM products
      WHERE id = (v_item->>'product_id')::UUID AND is_active FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Produk tidak valid.'; END IF;
    IF v_prod.current_stock < v_qty THEN RAISE EXCEPTION 'Stok % tersisa %.', v_prod.name, v_prod.current_stock; END IF;
    v_subtotal := v_subtotal + v_prod.selling_price * v_qty;
    v_hpp := v_hpp + v_prod.cost_price * v_qty;
  END LOOP;

  IF p_fulfillment_type = 'DELIVERY' THEN
    IF p_dusun_zone_id IS NULL THEN RAISE EXCEPTION 'Pilih dusun pengiriman.'; END IF;
    SELECT delivery_fee INTO v_delivery_fee FROM dusun_zones WHERE id = p_dusun_zone_id AND is_active;
    IF NOT FOUND THEN RAISE EXCEPTION 'Zona dusun tidak valid.'; END IF;
  END IF;

  v_total := v_subtotal + v_delivery_fee;
  v_order_number := 'KMP-ORD-' || to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYMMDD') || lpad((floor(random()*9000)+1000)::TEXT, 4, '0');

  INSERT INTO orders (order_number, customer_id, channel, fulfillment_type, status, payment_method, payment_status,
    dusun_zone_id, delivery_address, delivery_landmark_notes, subtotal, delivery_fee, total_amount, total_cost_hpp, idempotency_key)
  VALUES (v_order_number, p_customer_id, 'WEB', p_fulfillment_type, 'NEW', 'COD', 'UNPAID',
    CASE WHEN p_fulfillment_type='DELIVERY' THEN p_dusun_zone_id END, p_delivery_address, p_delivery_landmark_notes,
    v_subtotal, v_delivery_fee, v_total, v_hpp, p_idempotency_key)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'qty')::INTEGER;
    SELECT id, name, selling_price, cost_price INTO v_prod FROM products WHERE id = (v_item->>'product_id')::UUID;
    INSERT INTO order_items (order_id, product_id, product_name_snapshot, qty, unit_selling_price, unit_cost_hpp, subtotal)
    VALUES (v_order_id, v_prod.id, v_prod.name, v_qty, v_prod.selling_price, v_prod.cost_price, v_prod.selling_price * v_qty);
    PERFORM record_stock_movement(v_prod.id, 'OUT_ONLINE', -v_qty, 'ORDER', v_order_id, p_customer_id, v_actor.role, 'Reservasi pesanan ' || v_order_number);
  END LOOP;

  IF p_fulfillment_type = 'DELIVERY' THEN
    INSERT INTO deliveries (order_id, sla_deadline_at) VALUES (v_order_id, now() + interval '60 minutes');
  END IF;

  RETURN jsonb_build_object('order_number', v_order_number, 'total', v_total);
END $$;

-- ---------- WORKFLOW ORDER ----------
CREATE OR REPLACE FUNCTION order_claim(p_actor_id UUID, p_order_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor users; v_rows INT;
BEGIN
  v_actor := assert_role(p_actor_id, ARRAY['admin','employee']);
  -- Pastikan baris deliveries ada (order PICKUP tidak punya baris deliveries)
  INSERT INTO deliveries (order_id, sla_deadline_at)
  SELECT p_order_id, now() + interval '60 minutes'
  WHERE NOT EXISTS (SELECT 1 FROM deliveries WHERE order_id = p_order_id);
  UPDATE deliveries SET claimed_by_employee_id = p_actor_id, claimed_at = now()
    WHERE order_id = p_order_id AND claimed_by_employee_id IS NULL;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN RAISE EXCEPTION 'Pesanan sudah diambil karyawan lain.'; END IF;
  UPDATE orders SET status = 'CONFIRMED' WHERE id = p_order_id AND status = 'NEW';
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION order_set_status(p_actor_id UUID, p_order_id UUID, p_status TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor users; v_ord RECORD;
BEGIN
  v_actor := assert_role(p_actor_id, ARRAY['admin','employee']);
  SELECT * INTO v_ord FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pesanan tidak ditemukan.'; END IF;
  IF NOT (v_ord.status IN ('NEW','CONFIRMED','PACKING')) THEN RAISE EXCEPTION 'Status pesanan tidak bisa diubah lagi.'; END IF;
  UPDATE orders SET status = p_status WHERE id = p_order_id;
  IF p_status = 'ON_DELIVERY' THEN UPDATE deliveries SET dispatched_at = now() WHERE order_id = p_order_id; END IF;
  IF p_status = 'READY' THEN UPDATE deliveries SET dispatched_at = NULL, claimed_by_employee_id = COALESCE(claimed_by_employee_id, p_actor_id) WHERE order_id = p_order_id; END IF;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION order_complete(p_actor_id UUID, p_order_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor users; v_ord RECORD;
BEGIN
  v_actor := assert_role(p_actor_id, ARRAY['admin','employee']);
  SELECT * INTO v_ord FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pesanan tidak ditemukan.'; END IF;
  IF v_ord.status = 'COMPLETED' THEN RETURN true; END IF; -- idempoten
  IF v_ord.status = 'CANCELLED' THEN RAISE EXCEPTION 'Pesanan sudah dibatalkan.'; END IF;
  UPDATE orders SET status = 'COMPLETED', payment_status = 'PAID' WHERE id = p_order_id;
  UPDATE deliveries SET delivered_at = now(), cod_amount_collected = v_ord.total_amount, cod_remitted_to_cashier = true
    WHERE order_id = p_order_id;
  -- Jurnal otomatis: omzet + ongkir + HPP
  INSERT INTO finance_entries (entry_number, entry_type, category, amount, description, reference_order_id, recorded_by_user_id)
  VALUES ('FIN-' || v_ord.order_number, 'INCOME', 'PENJUALAN_ONLINE', v_ord.subtotal, 'Penjualan online ' || v_ord.order_number, p_order_id, p_actor_id);
  IF v_ord.delivery_fee > 0 THEN
    INSERT INTO finance_entries (entry_number, entry_type, category, amount, description, reference_order_id, recorded_by_user_id)
    VALUES ('FIN-ONG-' || v_ord.order_number, 'INCOME', 'LAINNYA', v_ord.delivery_fee, 'Ongkir ' || v_ord.order_number, p_order_id, p_actor_id);
  END IF;
  INSERT INTO finance_entries (entry_number, entry_type, category, amount, description, reference_order_id, recorded_by_user_id)
  VALUES ('FIN-HPP-' || v_ord.order_number, 'EXPENSE', 'HPP_BARANG', v_ord.total_cost_hpp, 'HPP ' || v_ord.order_number, p_order_id, p_actor_id);
  -- Poin SHU anggota: 1 poin / Rp 10.000
  UPDATE users SET shu_points = shu_points + floor(v_ord.subtotal / 10000) WHERE id = v_ord.customer_id;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION order_cancel(p_actor_id UUID, p_order_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor users; v_ord RECORD; v_it RECORD;
BEGIN
  v_actor := assert_role(p_actor_id, ARRAY['admin','employee']);
  SELECT * INTO v_ord FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pesanan tidak ditemukan.'; END IF;
  IF v_ord.status = 'CANCELLED' THEN RETURN true; END IF;
  IF v_ord.status = 'COMPLETED' THEN RAISE EXCEPTION 'Pesanan selesai tidak bisa dibatalkan.'; END IF;
  UPDATE orders SET status = 'CANCELLED' WHERE id = p_order_id;
  FOR v_it IN SELECT product_id, qty FROM order_items WHERE order_id = p_order_id LOOP
    PERFORM record_stock_movement(v_it.product_id, 'RETURN', v_it.qty, 'ORDER_CANCEL', p_order_id, p_actor_id, v_actor.role, 'Pesanan dibatalkan — stok kembali');
  END LOOP;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION order_cod_remit(p_actor_id UUID, p_order_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM assert_role(p_actor_id, ARRAY['admin','employee']);
  UPDATE deliveries SET cod_remitted_to_cashier = true WHERE order_id = p_order_id;
  RETURN true;
END $$;

-- ---------- QUICK POS (penjualan kasir offline) ----------
CREATE OR REPLACE FUNCTION pos_sale(p_actor_id UUID, p_items JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor users; v_item JSONB; v_prod RECORD; v_qty INTEGER;
  v_total NUMERIC := 0; v_hpp NUMERIC := 0; v_num TEXT;
BEGIN
  v_actor := assert_role(p_actor_id, ARRAY['admin','employee']);
  IF jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Belum ada barang.'; END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'qty')::INTEGER;
    SELECT name, selling_price, cost_price, current_stock INTO v_prod FROM products WHERE id = (v_item->>'product_id')::UUID FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Produk tidak valid.'; END IF;
    IF v_prod.current_stock < v_qty THEN RAISE EXCEPTION 'Stok % tidak cukup (sisa %).', v_prod.name, v_prod.current_stock; END IF;
    v_total := v_total + v_prod.selling_price * v_qty;
    v_hpp := v_hpp + v_prod.cost_price * v_qty;
  END LOOP;
  v_num := 'POS-' || to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYMMDDHH24MI') || lpad((floor(random()*90)+10)::TEXT, 2, '0');
  INSERT INTO finance_entries (entry_number, entry_type, category, amount, description, recorded_by_user_id)
  VALUES (v_num, 'INCOME', 'PENJUALAN_GERAI_OFFLINE', v_total, 'Penjualan kasir offline ' || v_num, p_actor_id);
  INSERT INTO finance_entries (entry_number, entry_type, category, amount, description, recorded_by_user_id)
  VALUES (v_num || '-HPP', 'EXPENSE', 'HPP_BARANG', v_hpp, 'HPP penjualan ' || v_num, p_actor_id);
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    PERFORM record_stock_movement((v_item->>'product_id')::UUID, 'OUT_OFFLINE_POS', -(v_item->>'qty')::INTEGER, 'POS', NULL, p_actor_id, v_actor.role, 'Penjualan kasir ' || v_num);
  END LOOP;
  RETURN jsonb_build_object('number', v_num, 'total', v_total);
END $$;

-- ---------- PENGELUARAN HARIAN ----------
CREATE OR REPLACE FUNCTION add_expense(p_actor_id UUID, p_category TEXT, p_amount NUMERIC, p_description TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor users;
BEGIN
  v_actor := assert_role(p_actor_id, ARRAY['admin','employee']);
  IF p_category NOT IN ('OPERASIONAL_GERAI','BBM_KURIR','KULAKAN_STOK','LAINNYA') THEN RAISE EXCEPTION 'Kategori tidak valid.'; END IF;
  INSERT INTO finance_entries (entry_number, entry_type, category, amount, description, recorded_by_user_id)
  VALUES ('EXP-' || to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYMMDDHH24MI') || lpad((floor(random()*90)+10)::TEXT, 2, '0'),
    'EXPENSE', p_category, p_amount, p_description, p_actor_id);
END $$;

-- ---------- TUTUP KAS HARIAN (WIB) ----------
CREATE OR REPLACE FUNCTION daily_cash_recap()
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'offline_cash', COALESCE((SELECT sum(amount) FROM finance_entries WHERE entry_type='INCOME' AND category='PENJUALAN_GERAI_OFFLINE'
      AND (created_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date), 0),
    'expenses', COALESCE((SELECT sum(amount) FROM finance_entries WHERE entry_type='EXPENSE' AND category IN ('OPERASIONAL_GERAI','BBM_KURIR','KULAKAN_STOK','LAINNYA')
      AND (created_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date), 0),
    'cod_today', COALESCE((SELECT sum(total_amount) FROM orders WHERE status='COMPLETED' AND fulfillment_type='DELIVERY'
      AND (created_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date), 0)
  );
$$;

CREATE OR REPLACE FUNCTION daily_closing_submit(p_actor_id UUID, p_opening_cash NUMERIC, p_actual_physical_cash NUMERIC, p_notes TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor users; v_recap JSONB; v_expected NUMERIC; v_diff NUMERIC;
BEGIN
  v_actor := assert_role(p_actor_id, ARRAY['admin','employee']);
  v_recap := daily_cash_recap();
  v_expected := p_opening_cash + (v_recap->>'offline_cash')::NUMERIC + (v_recap->>'cod_today')::NUMERIC - (v_recap->>'expenses')::NUMERIC;
  v_diff := p_actual_physical_cash - v_expected;
  IF v_diff <> 0 AND (p_notes IS NULL OR p_notes = '') THEN RAISE EXCEPTION 'Selisih kas ≠ 0 wajib diisi catatan.'; END IF;
  INSERT INTO daily_closings (closing_date, opening_cash, system_offline_pos_cash, system_online_cod_cash, system_cash_expenses,
    expected_closing_cash, actual_physical_cash, cash_difference, notes, status, submitted_by_employee_id)
  VALUES ((now() at time zone 'Asia/Jakarta')::date, p_opening_cash, (v_recap->>'offline_cash')::NUMERIC,
    (v_recap->>'cod_today')::NUMERIC, (v_recap->>'expenses')::NUMERIC, v_expected, p_actual_physical_cash, v_diff, p_notes, 'SUBMITTED', p_actor_id);
  RETURN jsonb_build_object('expected', v_expected, 'difference', v_diff);
END $$;

CREATE OR REPLACE FUNCTION closing_verify(p_admin_id UUID, p_closing_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM assert_role(p_admin_id, ARRAY['admin']);
  UPDATE daily_closings SET status='VERIFIED_LOCKED', verified_by_admin_id=p_admin_id
    WHERE id=p_closing_id AND status='SUBMITTED';
  IF NOT FOUND THEN RAISE EXCEPTION 'Laporan tidak ditemukan / sudah terkunci.'; END IF;
END $$;

-- ---------- STOCK OPNAME ----------
CREATE OR REPLACE FUNCTION opname_create(p_actor_id UUID, p_title TEXT, p_scope_category_id UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor users; v_id UUID; v_code TEXT;
BEGIN
  v_actor := assert_role(p_actor_id, ARRAY['admin','employee']);
  v_code := 'OPN-' || to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYMMDD') || lpad((floor(random()*900)+100)::TEXT, 3, '0');
  INSERT INTO opname_sessions (session_code, title, scope_category_id, created_by_employee_id)
  VALUES (v_code, p_title, p_scope_category_id, p_actor_id) RETURNING id INTO v_id;
  RETURN jsonb_build_object('id', v_id);
END $$;

CREATE OR REPLACE FUNCTION opname_set_item(p_actor_id UUID, p_session_id UUID, p_product_id UUID, p_physical_qty INTEGER, p_reason_category TEXT DEFAULT NULL, p_notes TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor users; v_sys INTEGER; v_diff INTEGER; v_sess RECORD;
BEGIN
  v_actor := assert_role(p_actor_id, ARRAY['admin','employee']);
  SELECT * INTO v_sess FROM opname_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sesi tidak ditemukan.'; END IF;
  IF v_sess.status <> 'DRAFT' THEN RAISE EXCEPTION 'Sesi sudah diajukan — tidak bisa diubah.'; END IF;
  SELECT current_stock INTO v_sys FROM products WHERE id = p_product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produk tidak ditemukan.'; END IF;
  v_diff := p_physical_qty - v_sys;
  IF v_diff <> 0 AND (p_reason_category IS NULL OR p_notes IS NULL OR p_notes = '') THEN
    RAISE EXCEPTION 'Selisih ≠ 0 wajib memilih alasan dan menulis catatan.';
  END IF;
  INSERT INTO opname_items (opname_session_id, product_id, system_qty, physical_qty, difference_qty, reason_category, notes)
  VALUES (p_session_id, p_product_id, v_sys, p_physical_qty, v_diff, CASE WHEN v_diff <> 0 THEN p_reason_category END, p_notes)
  ON CONFLICT (opname_session_id, product_id) DO UPDATE SET system_qty=EXCLUDED.system_qty, physical_qty=EXCLUDED.physical_qty,
    difference_qty=EXCLUDED.difference_qty, reason_category=EXCLUDED.reason_category, notes=EXCLUDED.notes;
  UPDATE opname_sessions SET total_variance_value = (
    SELECT COALESCE(sum(oi.difference_qty * pr.cost_price),0) FROM opname_items oi JOIN products pr ON pr.id = oi.product_id WHERE oi.opname_session_id = p_session_id)
    WHERE id = p_session_id;
  RETURN jsonb_build_object('difference', v_diff, 'system_qty', v_sys);
END $$;

CREATE OR REPLACE FUNCTION opname_submit(p_actor_id UUID, p_session_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM assert_role(p_actor_id, ARRAY['admin','employee']);
  UPDATE opname_sessions SET status='SUBMITTED', submitted_at=now() WHERE id=p_session_id AND status='DRAFT';
  IF NOT FOUND THEN RAISE EXCEPTION 'Sesi tidak ditemukan / sudah diajukan.'; END IF;
END $$;

CREATE OR REPLACE FUNCTION opname_approve(p_admin_id UUID, p_session_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor users; v_it RECORD;
BEGIN
  v_actor := assert_role(p_admin_id, ARRAY['admin']);
  PERFORM 1 FROM opname_sessions WHERE id = p_session_id AND status='SUBMITTED' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sesi tidak dalam status menunggu persetujuan.'; END IF;
  FOR v_it IN SELECT oi.*, p.current_stock FROM opname_items oi JOIN products p ON p.id = oi.product_id WHERE oi.opname_session_id = p_session_id LOOP
    IF v_it.difference_qty <> 0 THEN
      PERFORM record_stock_movement(v_it.product_id, 'ADJUST_OPNAME', v_it.physical_qty - v_it.system_qty, 'OPNAME', p_session_id, p_admin_id, 'admin', 'Opname: ' || coalesce(v_it.reason_category,'') || ' ' || coalesce(v_it.notes,''));
    END IF;
  END LOOP;
  UPDATE opname_sessions SET status='APPROVED', reviewed_by_admin_id=p_admin_id, approved_at=now() WHERE id=p_session_id;
END $$;

CREATE OR REPLACE FUNCTION opname_reject(p_admin_id UUID, p_session_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM assert_role(p_admin_id, ARRAY['admin']);
  UPDATE opname_sessions SET status='REJECTED', reviewed_by_admin_id=p_admin_id, approved_at=now() WHERE id=p_session_id AND status='SUBMITTED';
  IF NOT FOUND THEN RAISE EXCEPTION 'Sesi tidak dalam status menunggu persetujuan.'; END IF;
END $$;

-- ---------- PRODUK (admin) ----------
CREATE OR REPLACE FUNCTION create_product(p_actor_id UUID, p_category_id UUID, p_name TEXT, p_sku TEXT, p_description TEXT,
  p_unit TEXT, p_cost_price NUMERIC, p_selling_price NUMERIC, p_initial_stock INTEGER, p_min_stock_alert INTEGER, p_is_local BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor users; v_id UUID;
BEGIN
  v_actor := assert_role(p_actor_id, ARRAY['admin']);
  INSERT INTO products (category_id, sku, name, description, unit, cost_price, selling_price, current_stock, min_stock_alert, is_local_alasbuluh)
  VALUES (p_category_id, p_sku, p_name, p_description, p_unit, p_cost_price, p_selling_price, 0, p_min_stock_alert, p_is_local)
  RETURNING id INTO v_id;
  IF p_initial_stock > 0 THEN
    PERFORM record_stock_movement(v_id, 'IN_RESTOCK', p_initial_stock, 'INITIAL', NULL, p_actor_id, 'admin', 'Stok awal produk baru');
  END IF;
  RETURN jsonb_build_object('id', v_id);
END $$;

CREATE OR REPLACE FUNCTION update_product(p_actor_id UUID, p_product_id UUID, p_patch JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor users; v_before JSONB;
BEGIN
  v_actor := assert_role(p_actor_id, ARRAY['admin']);
  SELECT to_jsonb(products) INTO v_before FROM products WHERE id = p_product_id;
  IF v_before IS NULL THEN RAISE EXCEPTION 'Produk tidak ditemukan.'; END IF;
  UPDATE products SET
    name = COALESCE(p_patch->>'name', name),
    description = COALESCE(p_patch->>'description', description),
    unit = COALESCE(p_patch->>'unit', unit),
    cost_price = COALESCE((p_patch->>'cost_price')::NUMERIC, cost_price),
    selling_price = COALESCE((p_patch->>'selling_price')::NUMERIC, selling_price),
    min_stock_alert = COALESCE((p_patch->>'min_stock_alert')::INTEGER, min_stock_alert),
    is_local_alasbuluh = COALESCE((p_patch->>'is_local_alasbuluh')::BOOLEAN, is_local_alasbuluh),
    is_active = COALESCE((p_patch->>'is_active')::BOOLEAN, is_active),
    category_id = COALESCE((p_patch->>'category_id')::UUID, category_id)
  WHERE id = p_product_id;
  INSERT INTO audit_logs (actor_user_id, actor_role, action, entity_name, entity_id, before_state_json, after_state_json)
  VALUES (p_actor_id, 'admin', 'UPDATE_PRODUCT', 'products', p_product_id, v_before, p_patch);
END $$;

-- ---------- AKUN STAFF ----------
CREATE OR REPLACE FUNCTION create_staff_account(p_admin_id UUID, p_name TEXT, p_phone TEXT, p_password_hash TEXT, p_role TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM assert_role(p_admin_id, ARRAY['admin']);
  IF p_role NOT IN ('admin','employee') THEN RAISE EXCEPTION 'Peran tidak valid.'; END IF;
  INSERT INTO users (name, phone, password_hash, role) VALUES (p_name, p_phone, p_password_hash, p_role);
END $$;

CREATE OR REPLACE FUNCTION toggle_user_active(p_admin_id UUID, p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM assert_role(p_admin_id, ARRAY['admin']);
  IF p_user_id = p_admin_id THEN RAISE EXCEPTION 'Tidak bisa menonaktifkan akun sendiri.'; END IF;
  UPDATE users SET is_active = NOT is_active WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Akun tidak ditemukan.'; END IF;
END $$;

CREATE OR REPLACE FUNCTION touch_last_login(p_user_id UUID) RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE users SET last_login_at = now() WHERE id = p_user_id;
$$;

-- ---------- CMS ----------
CREATE OR REPLACE FUNCTION cms_upsert(p_admin_id UUID, p_section_key TEXT, p_content JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM assert_role(p_admin_id, ARRAY['admin']);
  INSERT INTO cms_profiles (section_key, content_json, updated_by_admin_id) VALUES (p_section_key, p_content, p_admin_id)
  ON CONFLICT (section_key) DO UPDATE SET content_json = EXCLUDED.content_json, updated_by_admin_id = EXCLUDED.updated_by_admin_id, updated_at = now();
END $$;

-- ---------- LANDING STATS (publik) ----------
CREATE OR REPLACE FUNCTION landing_stats()
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'products', (SELECT count(*) FROM products WHERE is_active),
    'members', (SELECT count(*) FROM users WHERE role='customer'),
    'umkm', (SELECT count(*) FROM products WHERE is_active AND is_local_alasbuluh),
    'orders', (SELECT count(*) FROM orders WHERE status='COMPLETED'),
    'asset_value', (SELECT COALESCE(sum(current_stock*cost_price),0) FROM products WHERE is_active)
  );
$$;

-- ---------- ADMIN DASHBOARD ----------
CREATE OR REPLACE FUNCTION admin_dashboard()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
BEGIN
  RETURN jsonb_build_object(
    'kpi', (SELECT jsonb_build_object(
      'omzet_today', COALESCE((SELECT sum(subtotal) FROM orders WHERE status='COMPLETED' AND (created_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date),0),
      'omzet_month', COALESCE((SELECT sum(subtotal) FROM orders WHERE status='COMPLETED' AND date_trunc('month',(created_at at time zone 'Asia/Jakarta')) = date_trunc('month',(now() at time zone 'Asia/Jakarta'))),0),
      'hpp_month', COALESCE((SELECT sum(total_cost_hpp) FROM orders WHERE status='COMPLETED' AND date_trunc('month',(created_at at time zone 'Asia/Jakarta')) = date_trunc('month',(now() at time zone 'Asia/Jakarta'))),0),
      'orders_today', (SELECT count(*) FROM orders WHERE (created_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date),
      'asset_value', COALESCE((SELECT sum(current_stock*cost_price) FROM products WHERE is_active),0),
      'expenses_month', COALESCE((SELECT sum(amount) FROM finance_entries WHERE entry_type='EXPENSE' AND category IN ('OPERASIONAL_GERAI','BBM_KURIR','KULAKAN_STOK','LAINNYA') AND date_trunc('month',(created_at at time zone 'Asia/Jakarta')) = date_trunc('month',(now() at time zone 'Asia/Jakarta'))),0),
      'cod_unremit', COALESCE((SELECT sum(o.total_amount) FROM deliveries d JOIN orders o ON o.id=d.order_id WHERE d.cod_remitted_to_cashier=false AND o.status='COMPLETED'),0),
      'opname_pending', (SELECT count(*) FROM opname_sessions WHERE status='SUBMITTED'),
      'closing_pending', (SELECT count(*) FROM daily_closings WHERE status='SUBMITTED'),
      'omzet_prev_month', COALESCE((SELECT sum(subtotal) FROM orders WHERE status='COMPLETED' AND date_trunc('month',(created_at at time zone 'Asia/Jakarta')) = date_trunc('month',(now() at time zone 'Asia/Jakarta')) - interval '1 month'),0)
    )),
    'low_stock', (SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'name',name,'current_stock',current_stock,'min_stock_alert',min_stock_alert)), '[]'::jsonb)
      FROM (SELECT id,name,current_stock,min_stock_alert FROM products WHERE is_active AND current_stock <= min_stock_alert ORDER BY current_stock LIMIT 10) t),
    'best_sellers', (SELECT COALESCE(jsonb_agg(jsonb_build_object('name',product_name_snapshot,'total_qty',total_qty)), '[]'::jsonb)
      FROM (SELECT product_name_snapshot, sum(qty) AS total_qty FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.status='COMPLETED' GROUP BY 1 ORDER BY 2 DESC LIMIT 5) t2),
    'chart', (SELECT COALESCE(jsonb_agg(jsonb_build_object('d',d,'online',online,'offline',offline) ORDER BY d), '[]'::jsonb)
      FROM (SELECT (created_at at time zone 'Asia/Jakarta')::date AS d,
        sum(CASE WHEN channel='WEB' THEN subtotal ELSE 0 END) AS online,
        sum(CASE WHEN channel='OFFLINE_POS' THEN subtotal ELSE 0 END) AS offline
        FROM orders WHERE status='COMPLETED' AND created_at > now() - interval '14 days' GROUP BY 1) t3)
  );
END $$;

-- ---------- REGISTRASI CUSTOMER (insert users via security definer) ----------
CREATE OR REPLACE FUNCTION register_customer(p_name TEXT, p_phone TEXT, p_password_hash TEXT, p_dusun_zone_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id UUID; v_name TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE phone = p_phone) THEN RAISE EXCEPTION 'Nomor HP sudah terdaftar.'; END IF;
  INSERT INTO users (name, phone, password_hash, role, dusun_zone_id)
  VALUES (p_name, p_phone, p_password_hash, 'customer', p_dusun_zone_id) RETURNING id, name INTO v_id, v_name;
  RETURN jsonb_build_object('id', v_id, 'name', v_name);
END $$;
GRANT EXECUTE ON FUNCTION register_customer(TEXT,TEXT,TEXT,UUID) TO anon, authenticated;

-- ---------- LOGIN (RPC — users tidak bisa di-SELECT anon) ----------
CREATE OR REPLACE FUNCTION app_login(p_identifier TEXT)
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT to_jsonb(u) - 'password_hash' || jsonb_build_object('_hash', u.password_hash) FROM users u
  WHERE (u.phone = p_identifier OR u.name = p_identifier OR u.email = p_identifier) AND u.is_active LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION app_login(TEXT) TO anon, authenticated;

-- ---------- OPNAME ITEM list (employee/admin) ----------
CREATE OR REPLACE FUNCTION opname_items_list(p_session_id UUID)
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(to_jsonb(oi)), '[]'::jsonb) FROM opname_items oi WHERE oi.opname_session_id = p_session_id;
$$;
GRANT EXECUTE ON FUNCTION opname_items_list(UUID) TO anon, authenticated;

-- ---------- FINANCE ENTRIES list hari ini (employee/admin) ----------
CREATE OR REPLACE FUNCTION finance_entries_today()
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id',f.id,'entry_number',f.entry_number,'entry_type',f.entry_type,'category',f.category,'amount',f.amount,'description',f.description,'created_at',f.created_at) ORDER BY f.created_at DESC), '[]'::jsonb)
  FROM finance_entries f
  WHERE (f.created_at at time zone 'Asia/Jakarta')::date = (now() at time zone 'Asia/Jakarta')::date;
$$;
GRANT EXECUTE ON FUNCTION finance_entries_today() TO anon, authenticated;

-- ---------- AUDIT LOG list (admin) ----------
CREATE OR REPLACE FUNCTION audit_log_list(p_limit INTEGER DEFAULT 100)
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id',a.id,'created_at',a.created_at,'actor_name',u.name,'actor_role',a.actor_role,'action',a.action,'entity_name',a.entity_name,'entity_id',a.entity_id,'before_state_json',a.before_state_json,'after_state_json',a.after_state_json)), '[]'::jsonb)
  FROM (SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100) a LEFT JOIN users u ON u.id = a.actor_user_id;
$$;
GRANT EXECUTE ON FUNCTION audit_log_list(INTEGER) TO anon, authenticated;

-- ---------- DAILY CLOSINGS list (admin) ----------
CREATE OR REPLACE FUNCTION closings_list()
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id',c.id,'closing_date',c.closing_date,'submitted_by_name',u.name,'expected_closing_cash',c.expected_closing_cash,'actual_physical_cash',c.actual_physical_cash,'cash_difference',c.cash_difference,'status',c.status,'created_at',c.created_at)), '[]'::jsonb)
  FROM (SELECT * FROM daily_closings ORDER BY created_at DESC LIMIT 30) c LEFT JOIN users u ON u.id = c.submitted_by_employee_id;
$$;
GRANT EXECUTE ON FUNCTION closings_list() TO anon, authenticated;

-- ---------- ORDERS list by customer / semua (untuk polling kanban) ----------
CREATE OR REPLACE FUNCTION orders_list(p_customer_id UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id',o.id,'order_number',o.order_number,'status',o.status,'created_at',o.created_at,
    'customer_id',o.customer_id,'customer_name',u.name,'channel',o.channel,
    'fulfillment_type',o.fulfillment_type,'dusun_name',z.dusun_name,
    'delivery_address',o.delivery_address,'delivery_landmark_notes',o.delivery_landmark_notes,
    'subtotal',o.subtotal,'delivery_fee',o.delivery_fee,'total_amount',o.total_amount,
    'payment_method',o.payment_method,'payment_status',o.payment_status,
    'courier_name',du.name,
    'items',(SELECT json_agg(json_build_object('name',oi.product_name_snapshot,'qty',oi.qty,'price',oi.unit_selling_price,'subtotal',oi.subtotal)) FROM order_items oi WHERE oi.order_id = o.id)
  ) ORDER BY o.created_at DESC), '[]'::jsonb)
  FROM orders o
  JOIN users u ON u.id = o.customer_id
  LEFT JOIN dusun_zones z ON z.id = o.dusun_zone_id
  LEFT JOIN deliveries d ON d.order_id = o.id
  LEFT JOIN users du ON du.id = d.claimed_by_employee_id
  WHERE (p_customer_id IS NULL OR o.customer_id = p_customer_id)
  LIMIT 100;
$$;
GRANT EXECUTE ON FUNCTION orders_list(UUID) TO anon, authenticated;

-- ---------- OPNAME SESSIONS list ----------
CREATE OR REPLACE FUNCTION opname_sessions_list()
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id',s.id,'session_code',s.session_code,'title',s.title,'status',s.status,'created_by_name',u.name,'item_count',(SELECT count(*) FROM opname_items oi WHERE oi.opname_session_id = s.id),'total_variance_value',s.total_variance_value,'created_at',s.created_at) ORDER BY s.created_at DESC), '[]'::jsonb)
  FROM (SELECT * FROM opname_sessions ORDER BY created_at DESC LIMIT 50) s LEFT JOIN users u ON u.id = s.created_by_employee_id;
$$;
GRANT EXECUTE ON FUNCTION opname_sessions_list() TO anon, authenticated;

-- ---------- USERS list (admin) ----------
CREATE OR REPLACE FUNCTION users_list()
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id',u.id,'name',u.name,'phone',u.phone,'email',u.email,'role',u.role,'is_active',u.is_active,'shu_points',u.shu_points,'member_number',u.member_number,'created_at',u.created_at) ORDER BY u.created_at DESC), '[]'::jsonb)
  FROM users u;
$$;
GRANT EXECUTE ON FUNCTION users_list() TO anon, authenticated;
