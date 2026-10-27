"use client";
export const fmtRp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

export const ORDER_STATUS_LABEL = {
  NEW: "Pesanan Baru", CONFIRMED: "Dikonfirmasi", PACKING: "Dikemas",
  ON_DELIVERY: "Sedang Diantar", COMPLETED: "Selesai & Diterima", CANCELLED: "Dibatalkan"
};

export async function api(path, opts = {}) {
  const res = await fetch("/api/v1" + path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const json = await res.json().catch(() => ({ success: false, error: "Respons tidak valid." }));
  return json;
}
