"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fmtRp, ORDER_STATUS_LABEL } from "@/components/util";
import { Icon } from "@/components/Icon";

const TIMELINE = ["NEW", "CONFIRMED", "PACKING", "ON_DELIVERY", "COMPLETED"];
const TIMELINE_PICKUP = ["NEW", "CONFIRMED", "PACKING", "READY", "COMPLETED"];

function statusStyle(s) {
  if (s === "CANCELLED") return "badge-gray";
  if (s === "COMPLETED") return "badge-green";
  if (s === "NEW") return "badge-red";
  return "badge-gold";
}

function OrdersInner() {
  const params = useSearchParams();
  const baru = params.get("baru");
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    const load = () => fetch("/api/v1/orders").then((r) => r.json()).then((j) => { if (j.success) setOrders(j.data); }).catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:py-8">
      <div className="mb-5 rounded-[20px] bg-gradient-to-br from-[#5E35B1] to-[#7E57C2] p-5 text-white shadow-[0_12px_30px_-8px_rgba(94,53,177,.35)] md:p-6">
        <h1 className="font-heading text-2xl font-extrabold">Pesanan Saya</h1>
        <p className="mt-1 text-sm text-white/80">Status diperbarui otomatis setiap 5 detik.</p>
      </div>

      {baru && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <span>Pesanan <b>{baru}</b> berhasil dibuat! Karyawan gerai akan segera memproses.</span>
        </div>
      )}

      {!orders ? <p className="text-sm text-neutral-400">Memuat…</p> :
        orders.length === 0 ? (
          <div className="card p-12 text-center">
            <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-300"><Icon name="receipt" className="h-8 w-8" /></span>
            <h2 className="font-heading text-lg font-bold">Belum ada pesanan</h2>
            <a href="/katalog" className="btn-primary mt-4 inline-flex">Mulai Belanja</a>
          </div>
        ) : (
        <div className="flex flex-col gap-4">
          {orders.map((o) => {
            const TL = o.fulfillment_type === "DELIVERY" ? TIMELINE : TIMELINE_PICKUP;
            const stepIdx = TL.indexOf(o.status);
            return (
              <div key={o.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 bg-[#FBFAF8] px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Icon name={o.fulfillment_type === "DELIVERY" ? "truck" : "store"} className="h-4 w-4 text-koperasi-red" />
                    <span className="font-heading text-sm font-extrabold">{o.order_number}</span>
                  </div>
                  <span className={statusStyle(o.status)}>{ORDER_STATUS_LABEL[o.status] || o.status}</span>
                </div>
                <div className="p-5">
                  <div className="mb-3 text-xs text-neutral-500">
                    {new Date(o.created_at).toLocaleString("id-ID")} · {o.fulfillment_type === "DELIVERY" ? `Delivery ke ${o.dusun_name || "—"}` : "Ambil di Gerai"} · COD
                    {o.delivery_address ? ` · ${o.delivery_address}` : ""}
                  </div>
                  <div className="space-y-1">
                    {(o.items || []).map((it, i) => (
                      <div key={i} className="flex justify-between text-sm"><span className="text-neutral-600">{it.qty}× {it.name}</span><span className="font-semibold">{fmtRp(it.subtotal)}</span></div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2 text-sm font-bold">
                    <span>Total <span className="font-normal text-neutral-400">(ongkir {fmtRp(o.delivery_fee)})</span></span>
                    <span className="text-koperasi-red">{fmtRp(o.total_amount)}</span>
                  </div>

                  {o.status !== "CANCELLED" && (
                    <div className="mt-4 flex items-start gap-1">
                      {TL.map((s, i) => (
                        <div key={s} className="flex flex-1 flex-col items-center">
                          <div className={`h-1.5 w-full rounded-full ${i <= stepIdx ? "bg-koperasi-red" : "bg-neutral-200"}`} />
                          <div className={`mt-1.5 text-center text-[10px] leading-tight ${i <= stepIdx ? "font-bold text-koperasi-red" : "text-neutral-400"}`}>{ORDER_STATUS_LABEL[s]}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {o.courier_name && o.fulfillment_type === "DELIVERY" && ["ON_DELIVERY", "COMPLETED"].includes(o.status) && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                      <Icon name="truck" className="h-3.5 w-3.5 text-koperasi-red" /> Kurir: <b>{o.courier_name}</b>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default function OrdersPage() {
  return <Suspense fallback={<main className="p-8 text-center text-sm text-neutral-400">Memuat…</main>}><OrdersInner /></Suspense>;
}
