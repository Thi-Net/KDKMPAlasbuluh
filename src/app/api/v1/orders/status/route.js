import { rpc, DbError } from "@/lib/db";
import { getUserFromRequest, apiError, requireRole } from "@/lib/auth";

// POST /api/v1/orders/status { order_id, action } — semua aksi via RPC (role divalidasi server)
export async function POST(req) {
  const user = await getUserFromRequest(req);
  const denied = requireRole(user, ["admin", "employee"]); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const FN = {
    claim: "order_claim",
    confirm: "order_set_status",
    dispatch: "order_set_status",
    ready: "order_set_status",
    complete: "order_complete",
    cancel: "order_cancel",
    cod_remit: "order_cod_remit"
  };
  const fn = FN[b.action];
  if (!fn) return apiError(400, "Aksi tidak dikenal.");
  try {
    let result;
    if (b.action === "claim") result = await rpc(fn, { p_actor_id: user.id, p_order_id: b.order_id });
    else if (b.action === "confirm") result = await rpc(fn, { p_actor_id: user.id, p_order_id: b.order_id, p_status: "PACKING" });
    else if (b.action === "ready") result = await rpc(fn, { p_actor_id: user.id, p_order_id: b.order_id, p_status: "READY" });
    else if (b.action === "dispatch") result = await rpc(fn, { p_actor_id: user.id, p_order_id: b.order_id, p_status: "ON_DELIVERY" });
    else result = await rpc(fn, { p_actor_id: user.id, p_order_id: b.order_id });
    return Response.json({ success: true, data: result });
  } catch (e) {
    return apiError(e.status || 400, e.message || "Gagal memperbarui pesanan.");
  }
}
