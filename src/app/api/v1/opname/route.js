import { select, rpc, DbError } from "@/lib/db";
import { getUserFromRequest, apiError, requireRole } from "@/lib/auth";

// GET daftar sesi opname
export async function GET(req) {
  const user = await getUserFromRequest(req);
  const denied = requireRole(user, ["admin", "employee"]); if (denied) return denied;
  try {
    const rows = await rpc("opname_sessions_list");
    return Response.json({ success: true, data: rows });
  } catch (e) {
    const msg = e.message || "Gagal memuat sesi opname.";
    return apiError(500, /schema cache|Could not find/i.test(msg) ? "Database belum dikonfigurasi — jalankan supabase/*.sql di Supabase SQL Editor." : msg);
  }
}

// POST: create sesi / set_item / submit
export async function POST(req) {
  const user = await getUserFromRequest(req);
  const denied = requireRole(user, ["admin", "employee"]); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  try {
    if (b.action === "create") {
      const result = await rpc("opname_create", { p_actor_id: user.id, p_title: b.title || "Stock Opname Gerai", p_scope_category_id: b.scope_category_id || null });
      return Response.json({ success: true, data: result });
    }
    if (b.action === "set_item") {
      if (!b.session_id || !b.product_id || b.physical_qty == null) return apiError(400, "Data tidak lengkap.");
      const result = await rpc("opname_set_item", {
        p_actor_id: user.id,
        p_session_id: b.session_id,
        p_product_id: b.product_id,
        p_physical_qty: Number(b.physical_qty),
        p_reason_category: b.reason_category || null,
        p_notes: b.notes || null
      });
      return Response.json({ success: true, data: result });
    }
    if (b.action === "submit") {
      await rpc("opname_submit", { p_actor_id: user.id, p_session_id: b.session_id });
      return Response.json({ success: true });
    }
    return apiError(400, "Aksi tidak dikenal.");
  } catch (e) {
    return apiError(e.status || 400, e.message || "Gagal memproses opname.");
  }
}

// PUT: admin approve/reject (approve → mutasi ADJUST_OPNAME otomatis di server)
export async function PUT(req) {
  const user = await getUserFromRequest(req);
  const denied = requireRole(user, ["admin"]); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  if (!b.session_id || !["approve", "reject"].includes(b.action)) return apiError(400, "Aksi tidak valid.");
  try {
    await rpc(b.action === "approve" ? "opname_approve" : "opname_reject", { p_admin_id: user.id, p_session_id: b.session_id });
    return Response.json({ success: true });
  } catch (e) {
    return apiError(e.status || 400, e.message || "Gagal memproses persetujuan.");
  }
}
