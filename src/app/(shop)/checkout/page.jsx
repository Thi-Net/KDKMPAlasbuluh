"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartContext";
import { fmtRp } from "@/components/util";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const router = useRouter();
  const [zones, setZones] = useState([]);
  const [fulfillment, setFulfillment] = useState("DELIVERY");
  const [zoneId, setZoneId] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/v1/dusun").then((r) => r.json()).then((j) => { if (j.success) setZones(j.data); }).catch(() => {});
  }, []);
  useEffect(() => {
    if (!zoneId && zones.length) setZoneId(String(zones[0].id));
  }, [zones]); // eslint-disable-line

  const zone = zones.find((z) => String(z.id) === String(zoneId));
  const fee = fulfillment === "DELIVERY" ? Number(zone?.delivery_fee || 0) : 0;
  const grand = total + fee;

  const submit = async () => {
    setErr(""); setBusy(true);
    const res = await fetch("/api/v1/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ product_id: i.product_id, qty: i.qty })),
        fulfillment_type: fulfillment,
        dusun_zone_id: fulfillment === "DELIVERY" ? zoneId : null,
        delivery_address: fulfillment === "DELIVERY" ? address : "",
        delivery_landmark_notes: fulfillment === "DELIVERY" ? landmark : "",
        payment_method: "COD",
        idempotency_key: "web-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8)
      })
    });
    const json = await res.json();
    setBusy(false);
    if (!json.success) { setErr(json.error); return; }
    clear();
    router.push("/pesanan?baru=" + encodeURIComponent(json.data.order_number));
  };

  if (items.length === 0) return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-300"><Icon name="cart" className="h-8 w-8" /></span>
      <h1 className="font-heading text-xl font-extrabold text-neutral-900">Keranjang masih kosong</h1>
      <p className="mt-2 text-sm text-neutral-500">Yuk belanja kebutuhan pokok di gerai koperasi.</p>
      <a className="btn-primary mt-5 inline-flex" href="/katalog"><Icon name="store" className="h-4 w-4" /> Kembali ke Katalog</a>
    </main>
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-1 font-heading text-2xl font-extrabold text-neutral-900">Checkout</h1>
      <p className="mb-5 text-sm text-neutral-500">Tinjau pesanan & lengkapi pengiriman.</p>
      {err && (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3.5 text-sm font-semibold text-red-700">
          <Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0" /> {err}
        </div>
      )}
      <div className="card mb-4 card-pad">
        <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-neutral-400">1 · Metode Penerimaan</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: "DELIVERY", icon: "truck", label: "Delivery ke Rumah", desc: "Antar ke alamat dusun" },
            { key: "PICKUP", icon: "store", label: "Ambil di Gerai", desc: "Siap diambil di gerai" }
          ].map((o) => (
            <button key={o.key} onClick={() => setFulfillment(o.key)} aria-pressed={fulfillment === o.key}
              className={`flex items-start gap-2.5 rounded-xl border-2 p-3.5 text-left transition-all duration-200 ${fulfillment === o.key ? "border-koperasi-red bg-red-50 shadow-[0_8px_24px_-8px_rgba(198,40,40,0.3)]" : "border-neutral-200 bg-white hover:border-neutral-300"}`}>
              <Icon name={o.icon} className={`mt-0.5 h-5 w-5 shrink-0 ${fulfillment === o.key ? "text-koperasi-red" : "text-neutral-400"}`} />
              <span>
                <span className="block text-sm font-bold text-neutral-900">{o.label}</span>
                <span className="block text-[11px] text-neutral-500">{o.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {fulfillment === "DELIVERY" && (
        <div className="card mb-4 card-pad">
          <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-neutral-400">2 · Alamat Pengiriman</h2>
          <label className="label">Dusun (ongkir otomatis)</label>
          <select className="input mb-3" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.dusun_name} — Ongkir {fmtRp(z.delivery_fee)}</option>)}
          </select>
          <label className="label">RT/RW & Alamat</label>
          <input className="input mb-3" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="cth: RT 02 / RW 01, Jl. Desa…" />
          <label className="label">Patokan Rumah</label>
          <input className="input" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="cth: Sebelah Masjid / Depan Balai Dusun" />
        </div>
      )}

      <div className="card mb-4 card-pad">
        <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-neutral-400">3 · Metode Pembayaran</h2>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-koperasi-red bg-red-50 p-3.5">
          <input type="radio" checked readOnly className="accent-koperasi-red" />
          <div><div className="font-semibold">COD — Bayar di Tempat</div><div className="text-xs text-neutral-500">Tunai saat barang tiba / di gerai.</div></div>
        </label>
        <div className="relative mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 opacity-60">
          <div className="flex items-center gap-3">
            <input type="radio" disabled readOnly />
            <div>
              <div className="font-semibold">QRIS — Scan Semua E-Wallet & M-Banking</div>
              <span className="badge mt-1 bg-koperasi-gold text-neutral-900">Coming Soon / Segera Hadir</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4 card-pad">
        <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-neutral-400">Ringkasan Pesanan</h2>
        <div className="flex justify-between text-sm"><span>Subtotal ({items.length} item)</span><span>{fmtRp(total)}</span></div>
        <div className="flex justify-between text-sm"><span>Ongkir {zone ? `(${zone.dusun_name})` : ""}</span><span>{fmtRp(fee)}</span></div>
        <div className="mt-2 flex justify-between border-t-2 border-neutral-200 pt-3 font-heading text-lg font-extrabold"><span>Total</span><span className="text-koperasi-red">{fmtRp(grand)}</span></div>
      </div>
      <button className="btn-primary w-full py-3 text-base" disabled={busy} onClick={submit}>{busy ? "Memproses…" : "Buat Pesanan Sekarang (COD)"}</button>
    </main>
  );
}
