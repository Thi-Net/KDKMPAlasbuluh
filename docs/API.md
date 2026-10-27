# Koperasi Desa Merah Putih Alasbuluh — REST API v1

Base URL produksi: `https://kdkmpalasbuluh.vercel.app/api/v1`

Semua response berbentuk JSON seragam: `{ "success": true, "data": ... }` atau `{ "success": false, "error": "pesan" }`.

## Autentikasi
- Login mengeluarkan **JWT** di cookie `kmp_token` (httpOnly, SameSite=Lax, umur 7 hari).
- Semua endpoint selain register/login wajib menyertakan cookie tersebut (header `Cookie: kmp_token=<jwt>`); aplikasi Android bisa memakai `Authorization: Bearer <jwt>` dengan nilai token yang sama.
- Role: `admin`, `employee`, `customer` — divalidasi di server (middleware halaman + pengecekan role di dalam fungsi SQL security definer).

## Endpoint

### POST /auth/register
Daftar akun customer/warga.
Body: `{ name, phone, password, dusun_zone_id (UUID) }` → `data: { role, name, redirect: "/katalog" }`

### POST /auth/login
Body: `{ identifier, password }` (identifier = username / no. HP / email)
→ `data: { role, name, redirect }` + Set-Cookie.

### POST /auth/logout — hapus cookie sesi.

### GET /dusun
Daftar zona dusun (publik): `id, dusun_name, delivery_fee, estimated_minutes`.

### GET /cms
Konten landing page + statistik live: `stats { products, umkm, members, orders, asset_value }`, `cms { hero, profil, pengurus, ... }`.

### GET /products
Katalog produk aktif: `id, name, sku, unit, selling_price, current_stock, is_local_alasbuluh, category_id, ...`.
Query: `?category_id=`, `?local=1`, `?q=`.

### POST /products (admin)
Tambah produk: `{ name, category_id, selling_price, cost_price, sku?, unit?, current_stock, min_stock_alert, is_local_alasbuluh, description? }`.

### PATCH /products (admin)
Ubah produk: `{ id, ...field }`.

### POST /stock (admin/employee) — restock
`{ product_id, qty, cost_price, note? }` → mutasi `IN_RESTOCK` di ledger.

### GET /stock?product_id= (admin/employee) — riwayat mutasi ledger produk.

### GET /orders
- customer: daftar pesanan miliknya (dengan items).
- employee/admin: semua pesanan.
Query: `?status=NEW` dsb.

### POST /orders (customer) — checkout
`{ items: [{ product_id, qty }], fulfillment_type: "DELIVERY"|"PICKUP", dusun_zone_id?, delivery_address?, delivery_landmark_notes?, payment_method: "COD", idempotency_key }`
→ `data: { order_number: "KMP-ORD-...", total }`. Stok direservasi atomik; ditolak bila stok kurang.

### POST /orders/status (admin/employee)
`{ order_id, action }` — action: `claim` | `confirm` (PACKING) | `dispatch` (ON_DELIVERY) | `ready` (READY, khusus PICKUP) | `complete` | `cancel` | `cod_remit`.

### GET /opname (admin/employee) — daftar sesi opname.
### POST /opname — `{ action: "create", title }` / `{ action: "set_item", session_id, product_id, physical_qty, reason?, notes? }` / `{ action: "submit", session_id }`.
### PUT /opname (admin) — `{ action: "approve"|"reject", session_id }` → approval menghasilkan mutasi `ADJUST_OPNAME`.

### GET /finance?what=recap (admin/employee) — rekap kas hari ini: `expenses, cod_today, offline_cash`.
### POST /finance (admin/employee)
- `{ action: "pos_sale", items: [{ product_id, qty, unit_price }], idempotency_key }` — penjualan offline (stok terpotong via ledger `OUT_OFFLINE_POS`).
- `{ action: "expense", category, amount, description }` — kategori: OPERASIONAL_GERAI | BBM_KURIR | KULAKAN_STOK | LAINNYA.
- `{ action: "closing", opening_cash, actual_physical_cash, notes }` — ajukan tutup kas harian.

### GET /admin?what=dashboard (admin) — KPI + chart + stok kritis/terlaris.
### GET /admin?what=users | audit | closings (admin)
### POST /admin (admin)
- `{ action: "create_employee", name, phone, password, role }`
- `{ action: "toggle_user", user_id }`
- `{ action: "verify_closing", closing_id }`
- `{ action: "cms_update", key, value_json }`

## Kode status
`200` sukses · `400` input tidak valid · `401` belum login · `403` role tidak berhak · `404` tidak ditemukan · `409` konflik (stok kurang, status tidak valid, HP terdaftar) · `500` error server.

## Catatan untuk Android (Tahap 2)
- Semua logika bisnis (reservasi stok, jurnal kas, approval) ada di fungsi PostgreSQL `security definer` — Android cukup memanggil endpoint yang sama seperti web.
- `idempotency_key` wajib pada pembuatan order/POS untuk mencegah pesanan ganda saat sinyal lemah.
- Status pesanan: `NEW → CONFIRMED → PACKING → (READY|ON_DELIVERY) → COMPLETED` atau `CANCELLED`.
