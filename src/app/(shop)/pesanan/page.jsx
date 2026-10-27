"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fmtRp, ORDER_STATUS_LABEL } from "@/components/util";

const TIMELINE = ["NEW", "CONFIRMED", "PACKING", "ON_DELIVERY", "COMPLETED"];

function OrdersInner() {
  const params = useSearchParams();
  const baru = params.get("baru");
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    const load = () => fetch("/api/v1/orders").then((r) => r.json()).then((j) => { if (j.success) setOrders(j.data); });
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">Pesanan Saya</h1>
      {baru && <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">✅ Pesanan <b>{baru}</b> berhasil dibuat! Karyawan gerai akan segera memproses. Status di bawah diperbarui otomatis.</div>}
      {!orders ? <p className="text-sm text-neutral-500">Memuat…</p> :
        orders.length === 0 ? <div className="card p-8 text-center text-sm text-neutral-500">Belum ada pesanan. <a href="/katalog" className="text-koperasi-red underline">Mulai belanja</a>.</div> : (
        <div className="flex flex-col gap-4">
          {orders.map((o) => {
            const stepIdx = TIMELINE.indexOf(o.status);
            return (
              <div key={o.id} className="card p-5">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="font-bold">{o.order_number}</div>
                  <span className={`badge ${o.status === "CANCELLED" ? "bg-red-100 text-red-700" : o.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {ORDER_STATUS_LABEL[o.status] || o.status}
                  </span>
                </div>
                <div className="text-xs text-neutral-500">{new Date(o.created_at).toLocaleString("id-ID")} · {o.fulfillment_type === "DELIVERY" ? `Delivery ke ${o.dusun_name || "—"} (${o.delivery_address || ""})` : "Ambil di Gerai"} · COD</div>
                {(o.items || []).map((it, i) => (
                  <div key={i} className="flex justify-between text-sm"><span>{it.qty}× {it.name}</span><span>{fmtRp(it.subtotal)}</span></div>
                ))}
                <div className="mt-1 flex justify-between border-t pt-1 text-sm font-bold"><span>Total (+ongkir {fmtRp(o.delivery_fee)})</span><span className="text-koperasi-red">{fmtRp(o.total_amount)}</span></div>
                {o.status !== "CANCELLED" && (
                  <div className="mt-3 flex items-center gap-1">
                    {TIMELINE.map((s, i) => (
                      <div key={s} className="flex flex-1 flex-col items-center">
                        <div className={`h-2 w-full rounded-full ${i <= stepIdx ? "bg-koperasi-red" : "bg-neutral-200"}`} />
                        <div className={`mt-1 text-center text-[10px] ${i <= stepIdx ? "font-semibold text-koperasi-red" : "text-neutral-400"}`}>{ORDER_STATUS_LABEL[s]}</div>
                      </div>
                    ))}
                  </div>
                )}
                {o.courier_name && <div className="mt-2 text-xs text-neutral-600">🛵 Kurir: <b>{o.courier_name}</b></div>}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default function OrdersPage() {
  return <Suspense fallback={<main className="p-8 text-center text-sm">Memuat…</main>}><OrdersInner /></Suspense>;
}
