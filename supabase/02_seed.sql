-- ============================================================
-- Koperasi Desa Merah Putih Alasbuluh — Seed Data (Tahap 1)
-- Jalankan SETELAH schema.sql di Supabase SQL Editor.
-- Akun demo: admin/admin123 (admin), karyawan/karyawan123 (employee),
--            081234567890 (customer) / customer123 — login via HP/username.
-- ============================================================

-- DUSUN DESA ALASBULUH (4 dusun + ongkir)
INSERT INTO dusun_zones (id, dusun_name, delivery_fee, estimated_minutes) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Dusun Krajan Alasbuluh', 2000, 15),
  ('11111111-1111-1111-1111-111111111102', 'Dusun Alasbuluh Timur', 3000, 20),
  ('11111111-1111-1111-1111-111111111103', 'Dusun Alasbuluh Barat', 3000, 25),
  ('11111111-1111-1111-1111-111111111104', 'Dusun Sumber Rejo', 5000, 35)
ON CONFLICT DO NOTHING;

-- KATEGORI GERAI
INSERT INTO categories (id, name, slug, icon, is_local_umkm, sort_order) VALUES
  ('22222222-2222-2222-2222-222222222201', 'Sembako', 'sembako', '🌾', false, 1),
  ('22222222-2222-2222-2222-222222222202', 'Minuman', 'minuman', '🥤', false, 2),
  ('22222222-2222-2222-2222-222222222203', 'Gas & Galon', 'gas-galon', '🔥', false, 3),
  ('22222222-2222-2222-2222-222222222204', 'ATK', 'atk', '✏️', false, 4),
  ('22222222-2222-2222-2222-222222222205', 'Produk UMKM Alasbuluh', 'umkm-alasbuluh', '🧺', true, 5)
ON CONFLICT (slug) DO NOTHING;

-- AKUN DEMO (password hash bcrypt, generate saat build)
INSERT INTO users (id, name, phone, password_hash, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'admin', '081000000001', '$2a$10$Rf1RTodQcPz0XBqLrwBSl.rGImOBJzi4K7nb20jFyPxMnAuBsUKV2', 'admin'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'karyawan', '081000000002', '$2a$10$H3bkt8iRhxwjIlOID/AzMeA1bTiDlOTju.EYyatUmSSyS07iSzQZu', 'employee'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'customer', '081000000003', '$2a$10$ftXUjfqNjqcoeg8ZvCUBfuXAl.RlztB0I42voCFWPgPT6UjFmEdEG', 'customer')
ON CONFLICT DO NOTHING;

UPDATE users SET dusun_zone_id = '11111111-1111-1111-1111-111111111101' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3';
UPDATE users SET member_number = 'NIA-2026-0001' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3';

-- PRODUK (>=15, beberapa ber-badge Produk Lokal Alasbuluh)
INSERT INTO products (category_id, sku, name, description, unit, cost_price, selling_price, current_stock, min_stock_alert, is_local_alasbuluh) VALUES
  ('22222222-2222-2222-2222-222222222201','SBK-001','Beras Premium 5 kg','Beras kualitas premium', 'sak', 62000, 68000, 40, 10, false),
  ('22222222-2222-2222-2222-222222222201','SBK-002','Beras Medium 5 kg','Beras medium sehari-hari', 'sak', 52000, 57000, 50, 10, false),
  ('22222222-2222-2222-2222-222222222201','SBK-003','Gula Pasir 1 kg','Gula kristal putih', 'pcs', 14000, 16000, 60, 12, false),
  ('22222222-2222-2222-2222-222222222201','SBK-004','Minyak Goreng 2 L','Minyak kelapa sawit', 'pcs', 32000, 36000, 45, 10, false),
  ('22222222-2222-2222-2222-222222222201','SBK-005','Telur Ayam 1 kg','Telur ayam segar', 'kg', 26000, 29000, 30, 10, false),
  ('22222222-2222-2222-2222-222222222201','SBK-006','Tepung Terigu 1 kg','Tepung serbaguna', 'pcs', 11000, 13000, 35, 8, false),
  ('22222222-2222-2222-2222-222222222202','MNM-001','Air Mineral Galon 19 L','Air isi ulang galon', 'galon', 16000, 20000, 25, 5, false),
  ('22222222-2222-2222-2222-222222222202','MNM-002','Kopi Bubuk Sachet (isi 10)','Kopi robusta sachet', 'pack', 12000, 14500, 48, 10, false),
  ('22222222-2222-2222-2222-222222222202','MNM-003','Teh Kotak 250 ml','Teh melati kotak', 'pcs', 3800, 5000, 80, 20, false),
  ('22222222-2222-2222-2222-222222222203','GAS-001','Gas LPG 3 kg (Isi)','Tabung LPG 3 kg isi penuh', 'tabung', 18000, 22000, 20, 5, false),
  ('22222222-2222-2222-2222-222222222203','GAS-002','Gas LPG 3 kg (Kosong Sewa)', 'Sewa tabung kosong', 'tabung', 5000, 8000, 10, 2, false),
  ('22222222-2222-2222-2222-222222222204','ATK-001','Buku Tulis 38 lembar','Buku sekolah', 'pcs', 3500, 4500, 60, 15, false),
  ('22222222-2222-2222-2222-222222222204','ATK-002','Pulpen Hitam','Pulpen tinta hitam', 'pcs', 2000, 3000, 100, 20, false),
  ('22222222-2222-2222-2222-222222222205','UMK-001','Keripik Singkong Alasbuluh','Olahan warga Desa Alasbuluh', 'pack', 8000, 12000, 40, 10, true),
  ('22222222-2222-2222-2222-222222222205','UMK-002','Gula Kelapa Asli','Hasil tani warga Alasbuluh', 'pcs', 13000, 18000, 30, 8, true),
  ('22222222-2222-2222-2222-222222222205','UMK-003','Pisang Sale Kering','Pisang sale khas Banyuwangi', 'pack', 10000, 15000, 25, 8, true),
  ('22222222-2222-2222-2222-222222222205','UMK-004','Madu Hutan Alasbuluh','Madu hutan murni 500 ml', 'botol', 40000, 55000, 15, 4, true),
  ('22222222-2222-2222-2222-222222222205','UMK-005','Abon Ikan Tongkol','Abon ikan olahan warga', 'toples', 35000, 48000, 12, 4, true)
ON CONFLICT (sku) DO NOTHING;

-- Stok awal tercatat ke ledger (bukan langsung menimpa)
INSERT INTO stock_movements (product_id, movement_type, qty_change, balance_before, balance_after, notes, actor_user_id)
SELECT p.id, 'IN_RESTOCK', p.current_stock, 0, p.current_stock, 'Stok awal seed data', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM stock_movements m WHERE m.product_id = p.id);

-- FEATURE FLAGS: QRIS Coming Soon, COD aktif penuh
INSERT INTO feature_flags (key, is_enabled, config_json) VALUES
  ('payment.qris.enabled', false, '{"badge":"Coming Soon","reason":"Payment gateway belum terpasang"}'),
  ('payment.cod.enabled', true, '{}'),
  ('opname.blind_count.enabled', false, '{}')
ON CONFLICT (key) DO UPDATE SET updated_at = now();

-- CMS PROFILES (konten landing page)
INSERT INTO cms_profiles (section_key, content_json) VALUES
  ('hero', '{"title":"Koperasi Desa Merah Putih — Desa Alasbuluh, Kec. Wongsorejo, Kab. Banyuwangi","subtitle":"Meningkatkan taraf ekonomi warga melalui gerai kebutuhan pokok, produk UMKM lokal, dan layanan delivery ke seluruh dusun Desa Alasbuluh."}'),
  ('about_koperasi', '{"body":"Koperasi Desa Merah Putih Alasbuluh mengelola Unit Usaha Gerai kebutuhan pokok, menampung produk UMKM warga, dan melayani delivery order ke seluruh dusun di Desa Alasbuluh, Kecamatan Wongsorejo, Kabupaten Banyuwangi.","vision":"Menjadi koperasi desa yang kuat, modern, dan mandiri — motor penggerak ekonomi warga Desa Alasbuluh."}'),
  ('board_members', '{"list":[{"name":"H. Abdul Karim","role":"Ketua Pengurus"},{"name":"Siti Aminah","role":"Sekretaris"},{"name":"Budi Santoso","role":"Bendahara"},{"name":"Rina Wulandari","role":"Manajer Unit Gerai"}]}'),
  ('contact_info', '{"address":"Gerai Koperasi, Desa Alasbuluh, Kec. Wongsorejo, Kab. Banyuwangi","whatsapp":"6281000000001","hours":"Senin–Sabtu 07.30–20.00, Minggu 08.00–14.00 WIB"}')
ON CONFLICT (section_key) DO UPDATE SET updated_at = now();
