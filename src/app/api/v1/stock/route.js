import { select, rpc, DbError } from "@/lib/db";
import { getUserFromRequest, apiError, requireRole } from "@/lib/auth";

// POST restock (admin/employee) via RPC ledger
export async function POST(req) {
  const user = await getUserFromRequest(req);
  const denied = requireRole(user, ["admin", "employee"]); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  if (!b.product_id || !Number(b.qty)) return apiError(400, "Produk dan jumlah wajib diisi.");
  try {
    const result = await rpc("restock_product", {
      p_actor_id: user.id,
      p_product_id: b.product_id,
      p_qty: Math.abs(Math.floor(Number(b.qty))),
      p_unit_cost: b.unit_cost ? Number(b.unit_cost) : null,
      p_notes: b.notes || "Restock / kulakan gerai"
    });
    return Response.json({ success: true, data: result });
  } catch (e) {
    return apiError(e.status || 400, e.message || "Gagal mencatat restock.");
  }
}

// GET kartu stok per produk (ledger history)
export async function GET(req) {
  const user = await getUserFromRequest(req);
  const denied = requireRole(user, ["admin", "employee"]); if (denied) return denied;
  const productId = new URL(req.url).searchParams.get("product_id");
  if (!productId) return apiError(400, "product_id wajib.");
  try {
    const rows = await select("stock_movements", {
      select: "*,actor:users(name)",
      eq: { product_id: productId },
      order: "created_at.desc",
      limit: 100
    });
    return Response.json({ success: true, data: rows });
  } catch (e) {
    return apiError(500, "Gagal memuat riwayat stok.");
  }
}
