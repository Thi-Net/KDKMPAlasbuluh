import { rpc, DbError } from "@/lib/db";
import { getUserFromRequest, apiError, requireRole } from "@/lib/auth";

// GET rekap kas hari ini (WIB) untuk tutup kas
export async function GET(req) {
  const user = await getUserFromRequest(req);
  const denied = requireRole(user, ["admin", "employee"]); if (denied) return denied;
  try {
    const data = await rpc("daily_cash_recap");
    return Response.json({ success: true, data });
  } catch (e) {
    const msg = e.message || "Gagal memuat rekap kas.";
    return apiError(500, /schema cache|Could not find/i.test(msg) ? "Database belum dikonfigurasi — jalankan supabase/*.sql di Supabase SQL Editor." : msg);
  }
}

// POST: quick POS / expense / closing submit
export async function POST(req) {
  const user = await getUserFromRequest(req);
  const denied = requireRole(user, ["admin", "employee"]); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  try {
    if (b.action === "pos_sale") {
      const items = Array.isArray(b.items) ? b.items : [];
      if (!items.length) return apiError(400, "Belum ada barang.");
      const result = await rpc("pos_sale", {
        p_actor_id: user.id,
        p_items: items.map((i) => ({ product_id: i.product_id, qty: Math.floor(Number(i.qty)) }))
      });
      return Response.json({ success: true, data: result });
    }
    if (b.action === "expense") {
      if (!b.amount || !b.category) return apiError(400, "Kategori dan nominal wajib.");
      await rpc("add_expense", {
        p_actor_id: user.id,
        p_category: b.category,
        p_amount: Math.abs(Number(b.amount)),
        p_description: b.description || "Pengeluaran harian gerai"
      });
      return Response.json({ success: true });
    }
    if (b.action === "closing") {
      const result = await rpc("daily_closing_submit", {
        p_actor_id: user.id,
        p_opening_cash: Number(b.opening_cash || 0),
        p_actual_physical_cash: Number(b.actual_physical_cash),
        p_notes: b.notes || null
      });
      return Response.json({ success: true, data: result });
    }
    return apiError(400, "Aksi tidak dikenal.");
  } catch (e) {
    return apiError(e.status || 400, e.message || "Gagal memproses.");
  }
}
