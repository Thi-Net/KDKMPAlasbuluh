import { select, insert, update, rpc, DbError } from "@/lib/db";
import { getUserFromRequest, apiError, requireRole, genCode } from "@/lib/auth";

// GET katalog publik
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const category = searchParams.get("category") || "";
  const localOnly = searchParams.get("local") === "1";
  try {
    const conds = [`is_active.eq.true`];
    if (search) conds.push(`name.ilike.*${search}*`);
    if (category) conds.push(`category_slug.eq.${category}`);
    if (localOnly) conds.push(`is_local_alasbuluh.eq.true`);
    const rows = await select("v_catalog", { select: "*", order: "is_local_alasbuluh.desc,name", limit: 200 });
    const filtered = rows.filter((p) =>
      (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
      (!category || p.category_slug === category) &&
      (!localOnly || p.is_local_alasbuluh)
    );
    const cats = await select("categories", { select: "id,name,slug,icon,is_local_umkm", order: "sort_order" });
    return Response.json({ success: true, data: filtered, meta: { categories: cats } });
  } catch (e) {
    const msg = e.message || "Gagal memuat produk.";
    return apiError(500, /schema cache|Could not find|permission/i.test(msg) ? "Database belum siap — jalankan supabase/00_schema.sql, 01_rpcs.sql, 02_seed.sql, 03_grants.sql di Supabase SQL Editor." : msg);
  }
}

// POST create product (admin, via RPC agar role divalidasi server)
export async function POST(req) {
  const user = await getUserFromRequest(req);
  const denied = requireRole(user, ["admin"]); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  if (!b.name || !b.category_id || b.selling_price == null) return apiError(400, "Nama, kategori, dan harga jual wajib diisi.");
  try {
    const result = await rpc("create_product", {
      p_actor_id: user.id,
      p_category_id: b.category_id,
      p_name: b.name,
      p_sku: b.sku || genCode("SKU"),
      p_description: b.description || "",
      p_unit: b.unit || "pcs",
      p_cost_price: Number(b.cost_price || 0),
      p_selling_price: Number(b.selling_price),
      p_initial_stock: Math.max(0, Math.floor(Number(b.current_stock || 0))),
      p_min_stock_alert: Number(b.min_stock_alert ?? 5),
      p_is_local: !!b.is_local_alasbuluh
    });
    return Response.json({ success: true, data: result });
  } catch (e) {
    return apiError(e.status || 400, e.message || "Gagal menyimpan produk.");
  }
}

// PATCH update produk (admin)
export async function PATCH(req) {
  const user = await getUserFromRequest(req);
  const denied = requireRole(user, ["admin"]); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  if (!b.id) return apiError(400, "ID produk wajib.");
  try {
    await rpc("update_product", {
      p_actor_id: user.id,
      p_product_id: b.id,
      p_patch: {
        name: b.name, description: b.description, unit: b.unit, cost_price: b.cost_price,
        selling_price: b.selling_price, min_stock_alert: b.min_stock_alert,
        is_local_alasbuluh: b.is_local_alasbuluh, is_active: b.is_active, category_id: b.category_id
      }
    });
    return Response.json({ success: true });
  } catch (e) {
    return apiError(e.status || 400, e.message || "Gagal memperbarui produk.");
  }
}
