import { select, rpc, DbError } from "@/lib/db";
import { getUserFromRequest, apiError, requireRole } from "@/lib/auth";

// POST /api/v1/orders — checkout customer (RPC transaksional: validasi stok & harga server + idempotency)
export async function POST(req) {
  const user = await getUserFromRequest(req);
  const denied = requireRole(user, ["customer"]); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const items = Array.isArray(b.items) ? b.items : [];
  if (!items.length) return apiError(400, "Keranjang kosong.");
  if (!b.idempotency_key) return apiError(400, "idempotency_key wajib ada.");
  try {
    const result = await rpc("create_order", {
      p_customer_id: user.id,
      p_items: items.map((i) => ({ product_id: i.product_id, qty: Math.floor(Number(i.qty)) })),
      p_fulfillment_type: b.fulfillment_type === "PICKUP" ? "PICKUP" : "DELIVERY",
      p_dusun_zone_id: b.fulfillment_type === "DELIVERY" ? b.dusun_zone_id : null,
      p_delivery_address: b.delivery_address || "",
      p_delivery_landmark_notes: b.delivery_landmark_notes || "",
      p_idempotency_key: b.idempotency_key
    });
    return Response.json({ success: true, data: result });
  } catch (e) {
    const msg = e.message || "Gagal membuat pesanan.";
    const status = e.status || (/Stok|tidak valid|Pilih dusun|Zona/i.test(msg) ? 409 : 400);
    return apiError(status, msg);
  }
}

// GET daftar pesanan (customer miliknya; employee/admin semua via view)
export async function GET(req) {
  const user = await getUserFromRequest(req);
  if (!user) return apiError(401, "Belum login.");
  try {
    let rows;
    if (user.role === "customer") {
      rows = await select("v_orders_full", { eq: { customer_id: user.id }, order: "created_at.desc", limit: 50 });
    } else {
      rows = await select("v_orders_full", { order: "created_at.desc", limit: 100 });
    }
    return Response.json({ success: true, data: rows });
  } catch (e) {
    const msg = e.message || "Gagal memuat pesanan.";
    return apiError(500, /schema cache|Could not find/i.test(msg) ? "Database belum dikonfigurasi — jalankan supabase/*.sql di Supabase SQL Editor." : msg);
  }
}
