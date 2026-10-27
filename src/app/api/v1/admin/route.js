import { select, rpc, DbError } from "@/lib/db";
import { getUserFromRequest, apiError, requireRole, hashPassword } from "@/lib/auth";

export async function GET(req) {
  const user = await getUserFromRequest(req);
  const denied = requireRole(user, ["admin"]); if (denied) return denied;
  const what = new URL(req.url).searchParams.get("what") || "dashboard";
  try {
    if (what === "dashboard") {
      const data = await rpc("admin_dashboard");
      return Response.json({ success: true, data });
    }
    if (what === "users") {
      const rows = await select("v_users_safe", { select: "id,name,phone,email,role,is_active,shu_points,member_number,created_at", order: "created_at.desc" });
      return Response.json({ success: true, data: rows });
    }
    if (what === "audit") {
      const rows = await select("v_audit_log", { limit: 100 });
      return Response.json({ success: true, data: rows });
    }
    if (what === "closings") {
      const rows = await select("v_daily_closings", { order: "created_at.desc", limit: 30 });
      return Response.json({ success: true, data: rows });
    }
    return apiError(400, "Parameter what tidak dikenal.");
  } catch (e) {
    const msg = e.message || "Gagal memuat data admin.";
    return apiError(500, /schema cache|Could not find/i.test(msg) ? "Database belum dikonfigurasi — jalankan supabase/*.sql di Supabase SQL Editor." : msg);
  }
}

export async function POST(req) {
  const user = await getUserFromRequest(req);
  const denied = requireRole(user, ["admin"]); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  try {
    if (b.action === "create_employee") {
      if (!b.name || !b.phone || !b.password) return apiError(400, "Nama, HP, dan password wajib.");
      const hash = await hashPassword(b.password);
      await rpc("create_staff_account", { p_admin_id: user.id, p_name: b.name, p_phone: b.phone, p_password_hash: hash, p_role: b.role === "admin" ? "admin" : "employee" });
      return Response.json({ success: true });
    }
    if (b.action === "toggle_user") {
      await rpc("toggle_user_active", { p_admin_id: user.id, p_user_id: b.user_id });
      return Response.json({ success: true });
    }
    if (b.action === "verify_closing") {
      await rpc("closing_verify", { p_admin_id: user.id, p_closing_id: b.closing_id });
      return Response.json({ success: true });
    }
    if (b.action === "cms_update") {
      await rpc("cms_upsert", { p_admin_id: user.id, p_section_key: b.section_key, p_content: b.content || {} });
      return Response.json({ success: true });
    }
    return apiError(400, "Aksi tidak dikenal.");
  } catch (e) {
    return apiError(e.status || 400, e.message || "Gagal memproses aksi admin.");
  }
}
