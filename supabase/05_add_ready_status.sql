-- ============================================================
-- 05_add_ready_status.sql — FIX kecil: tambah status READY
-- (Siap Diambil) untuk order Ambil di Gerai di constraint orders.
-- Jalankan sekali di Supabase SQL Editor. Idempotent.
-- ============================================================

-- Drop SEMUA constraint CHECK pada kolom status (idempotent, nama apapun)
DO $$
DECLARE c TEXT;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.orders'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.orders DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('NEW','CONFIRMED','PACKING','READY','ON_DELIVERY','COMPLETED','CANCELLED'));
