# Koperasi Desa Merah Putih — Platform Digital Gerai Alasbuluh (Tahap 1 MVP)

Next.js 14 (App Router) + Tailwind + Supabase (PostgREST/RPC). Live: https://kdkmpalasbuluh.vercel.app

## Fitur (Batch 1–4 PRD)
- Landing page company profile (Merah #C62828 / Putih / Emas #F9A825, font Rubik/Nunito Sans), bar statistik real-time, profil & visi-misi, pengurus, etalase live.
- Auth 3 role (admin/employee/customer) — JWT httpOnly cookie, middleware RBAC, redirect per role, register warga (dusun).
- Produk & Stock Ledger: CRUD produk (admin), restock via ledger immutable (`record_stock_movement`), badge "Produk Lokal Alasbuluh", stok kritis.
- Marketplace customer: katalog + search/filter, keranjang (localStorage), checkout Delivery per dusun (ongkir otomatis) / Ambil di Gerai, COD aktif + QRIS "Coming Soon" (feature flag), order `KMP-ORD-…`, reservasi stok atomik, lacak pesanan timeline.
- Workspace karyawan: notifikasi order baru (polling 4 detik + Web Audio alarm + popup), kanban delivery + klaim order atomik, Stock Opname (selisih otomatis, wajib alasan, approval admin → mutasi `ADJUST_OPNAME`), Quick POS, pengeluaran harian, Tutup Kas Harian (WIB-aware, verifikasi admin).
- Dashboard admin: KPI, grafik Recharts, stok kritis/terlaris, antrean approval, verifikasi tutup kas, COD belum disetor, audit log.
- PWA manifest + icon. REST API `/api/v1` siap untuk Android Tahap 2.

## Setup Supabase (WAJIB oleh pemilik project)
Jalankan berurutan di **Supabase SQL Editor**:
1. `supabase/00_schema.sql` — 16 tabel + index
2. `supabase/01_rpcs.sql` — 28 fungsi RPC security definer (ledger stok, order idempotent, opname, kas, dsb.)
3. `supabase/02b_rls_grants.sql` — view + RLS + grant anon (read katalog; akses sensitif via RPC)
4. (opsional) `supabase/02_seed.sql` — data demo: akun `admin/admin123`, `karyawan/karyawan123`, `customer (HP 081000000003)/customer123`, 4 dusun, 5 kategori, 18 produk, CMS, feature flags.
5. `supabase/05_add_ready_status.sql` — tambah status READY (Siap Diambil) untuk order pickup.
6. `supabase/06_laporan.sql` — fungsi laporan laba rugi, penjualan harian, mutasi stok (untuk halaman Laporan + ekspor).
   Lalu file fix tambahan yang dikirim via chat (mis. `04_fix_views.sql`) bila ada.

Setelah itu set env di Vercel (sudah dilakukan): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `JWT_SECRET`.

## API `/api/v1` (ringkas)
| Endpoint | Method | Keterangan |
|---|---|---|
| `/auth/login` `/auth/register` `/auth/logout` `/auth/me` | POST/GET | JWT cookie + Bearer untuk Android |
| `/products` | GET (publik), POST/PATCH (admin) | katalog & master produk |
| `/stock` | GET/POST | kartu stok & restock (ledger) |
| `/orders` | POST/GET | checkout idempotent (`idempotency_key`), daftar pesanan |
| `/orders/status` | POST | claim/confirm/dispatch/complete/cancel/cod_remit |
| `/opname` | GET/POST/PUT | sesi opname, item, submit, approve/reject |
| `/finance` | GET/POST | rekap kas, pos_sale, expense, closing |
| `/admin?what=dashboard\|users\|audit\|closings\|profit_loss\|sales_detail\|stock_movement` | GET | data admin & laporan |
| `/admin?what=export_sales_csv\|export_stock_csv` | GET | ekspor laporan Excel/CSV |
| `/dusun`, `/cms` | GET | publik |

Dokumentasi lengkap endpoint: [docs/API.md](docs/API.md).

Notifikasi real-time: polling (serverless Vercel tidak mendukung WebSocket). Produksi nanti: WebSocket via layanan terpisah (Tahap 2).

## Develop
```bash
npm install
cp .env.example .env.local  # isi SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, JWT_SECRET
npm run dev
```
