/**
 * Semua perubahan stok MELEWATI RPC `record_stock_movement` (security definer)
 * di Supabase — ledger immutable dengan balance_before/after di dalam transaksi DB.
 * Fungsi ini hanyalah pembungkus pemanggilan RPC dari sisi aplikasi.
 */
const { rpc } = require("./db");

async function recordStockMovement({ productId, movementType, qtyChange, referenceType = null, referenceId = null, actorUserId = null, notes = null, actorRole = null }) {
  return rpc("record_stock_movement", {
    p_product_id: productId,
    p_movement_type: movementType,
    p_qty_change: Math.round(Number(qtyChange)),
    p_reference_type: referenceType,
    p_reference_id: referenceId,
    p_actor_user_id: actorUserId,
    p_actor_role: actorRole,
    p_notes: notes
  });
}

module.exports = { recordStockMovement };
