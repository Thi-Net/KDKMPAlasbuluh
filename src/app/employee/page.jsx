"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { fmtRp, ORDER_STATUS_LABEL } from "@/components/util";

const COLUMNS = [
  { key: "NEW", label: "📥 Pesanan Baru", next: "confirm", nextLabel: "Ambil & Kemas" },
  { key: "PACKING", label: "📦 Dikemas", next: "dispatch", nextLabel: "Antar (Kurir Jalan)" },
  { key: "ON_DELIVERY", label: "🛵 Diantar", next: "complete", nextLabel: "Selesai & Lunas (COD)" },
  { key: "COMPLETED", label: "✅ Selesai", next: null, nextLabel: null }
];

export default function EmployeeDeliveryPage() {
  const [orders, setOrders] = useState([]);
  const [notif, setNotif] = useState(null);
  const [err, setErr] = useState("");
  const audioUnlocked = useRef(false);
  const lastCount = useRef(null);

  const act = async (orderId, action) => {
    setErr("");
    const res = await fetch("/api/v1/orders/status", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, action })
    });
    const json = await res.json();
    if (!json.success) setErr(json.error);
    load();
  };

  const load = useCallback(() => {
    fetch("/api/v1/orders").then((r) => r.json()).then((j) => {
      if (!j.success) return;
      const active = j.data.filter((o) => ["NEW", "CONFIRMED", "PACKING", "ON_DELIVERY", "COMPLETED"].includes(o.status)).slice(0, 60);
      const newCount = active.filter((o) => o.status === "NEW").length;
      if (lastCount.current !== null && newCount > lastCount.current) {
        const newest = active.filter((o) => o.status === "NEW")[0];
        setNotif(newest);
        playAlarm();
        setTimeout(() => setNotif(null), 15000);
      }
      lastCount.current = newCount;
      setOrders(active);
    }).catch(() => {});
  }, []);

  const playAlarm = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const beeps = [880, 1100, 880, 1100];
      beeps.forEach((f, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.frequency.value = f; o.type = "sine";
        g.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.25);
        g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + i * 0.25 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.22);
        o.connect(g); g.connect(ctx.destination);
        o.start(ctx.currentTime + i * 0.25); o.stop(ctx.currentTime + i * 0.25 + 0.24);
      });
    } catch (e) {}
  };

  useEffect(() => {
    const unlock = () => { audioUnlocked.current = true; window.removeEventListener("click", unlock); };
    window.addEventListener("click", unlock);
    load();
    const t = setInterval(load, 4000); // polling (WebSocket tidak didukung serverless Vercel)
    return () => { clearInterval(t); window.removeEventListener("click", unlock); };
  }, [load]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {notif && (
        <div className="mb-4 flex items-center justify-between rounded-xl border-2 border-koperasi-gold bg-amber-100 p-4 shadow-lg animate-pulse">
          <div>
            <div className="font-bold text-amber-900">🔔 Pesanan Delivery Baru: {notif.order_number}</div>
            <div className="text-sm text-amber-800">{notif.customer_name} — {fmtRp(notif.total_amount)} (COD){notif.dusun_name ? ` — ${notif.dusun_name}` : ""}</div>
          </div>
          <button className="btn-primary" onClick={() => { act(notif.id, "claim"); setNotif(null); }}>Ambil Order</button>
        </div>
      )}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Delivery Command Center</h1>
        <span className="text-xs text-neutral-500">Pembaruan otomatis tiap 4 detik · alarm aktif setelah interaksi pertama</span>
      </div>
      {err && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      <div className="grid gap-4 lg:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="card bg-neutral-50 p-3">
            <h2 className="mb-3 text-sm font-bold text-neutral-700">{col.label}</h2>
            <div className="flex flex-col gap-3">
              {orders.filter((o) => (col.key === "NEW" ? ["NEW", "CONFIRMED"].includes(o.status) : o.status === col.key)).map((o) => {
                const waitMin = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000);
                const slaLate = col.key === "NEW" && waitMin > 5;
                return (
                  <div key={o.id} className={`rounded-lg border bg-white p-3 text-sm shadow-sm ${slaLate ? "border-red-400 ring-1 ring-red-200" : ""}`}>
                    <div className="font-bold">{o.order_number}</div>
                    <div className="text-xs text-neutral-600">{o.customer_name}{o.dusun_name ? ` · ${o.dusun_name}` : ""}</div>
                    {o.fulfillment_type === "DELIVERY" && <div className="text-xs text-neutral-500">📍 {o.delivery_address || "-"} — patokan: {o.delivery_landmark_notes || "-"}</div>}
                    <div className="mt-1 font-semibold text-koperasi-red">{fmtRp(o.total_amount)} <span className="text-[10px] font-normal text-neutral-400">COD</span></div>
                    <div className={`mt-1 text-[11px] ${slaLate ? "font-bold text-red-600" : "text-neutral-400"}`}>⏱ {waitMin} menit menungu{slaLate ? " — MELEWATI SLA 5 MENIT!" : ""}</div>
                    {(o.items || []).map((it, i) => <div key={i} className="text-xs text-neutral-600">{it.qty}× {it.name}</div>)}
                    {o.courier_name && <div className="mt-1 text-[11px] text-green-700">Diproses oleh {o.courier_name}</div>}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {col.key === "NEW" && <button className="btn-primary flex-1 text-xs" onClick={() => act(o.id, "claim")}>Ambil Order</button>}
                      {col.next && col.key !== "NEW" && <button className="btn-primary flex-1 text-xs" onClick={() => act(o.id, col.next)}>{col.nextLabel}</button>}
                      {!["COMPLETED", "CANCELLED"].includes(o.status) && (
                        <button className="btn-outline text-xs" onClick={() => { if (confirm("Batalkan pesanan " + o.order_number + "? Stok akan dikembalikan.")) act(o.id, "cancel"); }}>Batalkan</button>
                      )}
                    </div>
                  </div>
                );
              })}
              {orders.filter((o) => (col.key === "NEW" ? ["NEW", "CONFIRMED"].includes(o.status) : o.status === col.key)).length === 0 &&
                <div className="p-4 text-center text-xs text-neutral-400">Kosong</div>}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
