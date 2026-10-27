-- ============================================================
-- 06_laporan.sql — Laporan Laba Rugi + Ekspor data laporan
-- Jalankan di Supabase SQL Editor. Idempotent.
-- ============================================================

-- ---------- LABA RUGI bulanan (admin) ----------
CREATE OR REPLACE FUNCTION profit_loss_report(p_year INTEGER, p_month INTEGER)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_start DATE; v_end DATE; v RECORD;
BEGIN
  IF p_year IS NULL OR p_month IS NULL THEN
    v_start := date_trunc('month', (now() at time zone 'Asia/Jakarta'))::date;
    v_end   := (date_trunc('month', (now() at time zone 'Asia/Jakarta')) + interval '1 month')::date;
  ELSE
    v_start := make_date(p_year, p_month, 1);
    v_end   := (make_date(p_year, p_month, 1) + interval '1 month')::date;
  END IF;

  SELECT
    COALESCE((SELECT sum(o.subtotal) FROM orders o WHERE o.status='COMPLETED' AND o.created_at >= v_start AND o.created_at < v_end),0) AS penjualan_online,
    COALESCE((SELECT sum(f.amount) FROM finance_entries f WHERE f.entry_type='INCOME' AND f.category='PENJUALAN_GERAI_OFFLINE' AND f.created_at >= v_start AND f.created_at < v_end),0) AS penjualan_offline,
    COALESCE((SELECT sum(o.total_cost_hpp) FROM orders o WHERE o.status='COMPLETED' AND o.created_at >= v_start AND o.created_at < v_end),0) AS hpp_online,
    COALESCE((SELECT sum(f.amount) FROM finance_entries f WHERE f.entry_type='EXPENSE' AND f.created_at >= v_start AND f.created_at < v_end),0) AS pengeluaran,
    COALESCE((SELECT sum(f.amount) FROM finance_entries f WHERE f.entry_type='EXPENSE' AND f.category='BBM_KURIR' AND f.created_at >= v_start AND f.created_at < v_end),0) AS exp_bbm,
    COALESCE((SELECT sum(f.amount) FROM finance_entries f WHERE f.entry_type='EXPENSE' AND f.category='OPERASIONAL_GERAI' AND f.created_at >= v_start AND f.created_at < v_end),0) AS exp_operasional,
    COALESCE((SELECT sum(f.amount) FROM finance_entries f WHERE f.entry_type='EXPENSE' AND f.category='KULAKAN_STOK' AND f.created_at >= v_start AND f.created_at < v_end),0) AS exp_kulakan,
    COALESCE((SELECT sum(f.amount) FROM finance_entries f WHERE f.entry_type='EXPENSE' AND f.category='LAINNYA' AND f.created_at >= v_start AND f.created_at < v_end),0) AS exp_lainnya
  INTO v;

  RETURN jsonb_build_object(
    'period', to_char(v_start,'YYYY-MM'),
    'penjualan_online', v.penjualan_online,
    'penjualan_offline', v.penjualan_offline,
    'total_penjualan', v.penjualan_online + v.penjualan_offline,
    'hpp_online', v.hpp_online,
    'laba_kotor', (v.penjualan_online + v.penjualan_offline) - v.hpp_online,
    'pengeluaran', v.pengeluaran,
    'rincian_pengeluaran', jsonb_build_object('operasional_gerai', v.exp_operasional,'bbm_kurir', v.exp_bbm,'kulakan_stok', v.exp_kulakan,'lainnya', v.exp_lainnya),
    'laba_bersih', ((v.penjualan_online + v.penjualan_offline) - v.hpp_online) - v.pengeluaran
  );
END $$;

-- ---------- DETAIL PENJUALAN per tanggal (untuk ekspor) ----------
CREATE OR REPLACE FUNCTION sales_detail_report(p_year INTEGER, p_month INTEGER)
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'tanggal', d,
      'online', online, 'offline', offline, 'total', online + offline,
      'orders_online', orders_online
    ) ORDER BY d), '[]'::jsonb)
  FROM (
    SELECT (o.created_at at time zone 'Asia/Jakarta')::date AS d,
      sum(CASE WHEN o.channel='WEB' THEN o.subtotal ELSE 0 END) AS online,
      sum(CASE WHEN o.channel='OFFLINE_POS' THEN o.subtotal ELSE 0 END) AS offline,
      count(*) FILTER (WHERE o.channel='WEB') AS orders_online
    FROM orders o
    WHERE o.status='COMPLETED'
      AND (o.created_at at time zone 'Asia/Jakarta')::date >= make_date(COALESCE(p_year, EXTRACT(YEAR FROM now())::INT), COALESCE(p_month, EXTRACT(MONTH FROM now())::INT), 1)
      AND (o.created_at at time zone 'Asia/Jakarta')::date < (make_date(COALESCE(p_year, EXTRACT(YEAR FROM now())::INT), COALESCE(p_month, EXTRACT(MONTH FROM now())::INT), 1) + interval '1 month')
    GROUP BY 1
  ) t;
$$;

-- ---------- MUTASI STOK bulanan (untuk ekspor) ----------
CREATE OR REPLACE FUNCTION stock_movement_report(p_year INTEGER, p_month INTEGER)
RETURNS JSONB LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'tanggal', (m.created_at at time zone 'Asia/Jakarta')::date,
      'produk', p.name,
      'tipe', m.movement_type,
      'qty', m.qty_change,
      'saldo_setelah', m.balance_after,
      'referensi', m.notes
    ) ORDER BY m.created_at), '[]'::jsonb)
  FROM stock_movements m JOIN products p ON p.id = m.product_id
  WHERE date_trunc('month', (m.created_at at time zone 'Asia/Jakarta')) =
        date_trunc('month', make_date(COALESCE(p_year, EXTRACT(YEAR FROM now())::INT), COALESCE(p_month, EXTRACT(MONTH FROM now())::INT), 1));
$$;

GRANT EXECUTE ON FUNCTION profit_loss_report(INTEGER,INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION sales_detail_report(INTEGER,INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION stock_movement_report(INTEGER,INTEGER) TO anon, authenticated;
