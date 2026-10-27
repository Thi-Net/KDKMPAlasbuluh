import { rpc, DbError } from "@/lib/db";
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
      const rows = await rpc("users_list");
      return Response.json({ success: true, data: rows });
    }
    if (what === "audit") {
      const rows = await rpc("audit_log_list", { p_limit: 100 });
      return Response.json({ success: true, data: rows });
    }
    if (what === "closings") {
      const rows = await rpc("closings_list");
      return Response.json({ success: true, data: rows });
    }
    if (what === "profit_loss" || what === "sales_detail" || what === "stock_movement") {
      const u = new URL(req.url);
      const pYear = u.searchParams.get("year") ? Number(u.searchParams.get("year")) : null;
      const pMonth = u.searchParams.get("month") ? Number(u.searchParams.get("month")) : null;
      const fn = what === "profit_loss" ? "profit_loss_report" : what === "sales_detail" ? "sales_detail_report" : "stock_movement_report";
      const data = await rpc(fn, { p_year: pYear, p_month: pMonth });
      return Response.json({ success: true, data });
    }
    if (what === "export_sales_csv") {
      const u = new URL(req.url);
      const pYear = u.searchParams.get("year") ? Number(u.searchParams.get("year")) : null;
      const pMonth = u.searchParams.get("month") ? Number(u.searchParams.get("month")) : null;
      const rows = await rpc("sales_detail_report", { p_year: pYear, p_month: pMonth });
      const lines = ["Tanggal,Penjualan Online,Penjualan Offline,Total,Pesanan Online"];
      for (const r of rows) lines.push(`${r.tanggal},${r.online},${r.offline},${r.total},${r.orders_online}`);
      const month = pMonth || new Date().getMonth() + 1, year = pYear || new Date().getFullYear();
      return new Response("\uFEFF" + lines.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="laporan-penjualan-${year}-${String(month).padStart(2, "0")}.csv"` } });
    }
    if (what === "export_stock_csv") {
      const u = new URL(req.url);
      const pYear = u.searchParams.get("year") ? Number(u.searchParams.get("year")) : null;
      const pMonth = u.searchParams.get("month") ? Number(u.searchParams.get("month")) : null;
      const rows = await rpc("stock_movement_report", { p_year: pYear, p_month: pMonth });
      const lines = ["Tanggal,Produk,Tipe Mutasi,Qty,Saldo Setelah,Referensi"];
      for (const r of rows) lines.push(`${r.tanggal},"${r.produk}",${r.tipe},${r.qty},${r.saldo_setelah},"${(r.referensi || "").replace(/"/g, "'")}"`);
      const month = pMonth || new Date().getMonth() + 1, year = pYear || new Date().getFullYear();
      return new Response("\uFEFF" + lines.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="mutasi-stok-${year}-${String(month).padStart(2, "0")}.csv"` } });
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
