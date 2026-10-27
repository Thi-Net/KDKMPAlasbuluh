"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartContext";
import { fmtRp } from "@/components/util";
import { useRouter } from "next/navigation";

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

  if (items.length === 0) return <main className="mx-auto max-w-3xl px-4 py-10 text-center text-sm text-neutral-500">Keranjang kosong. <a className="text-koperasi-red underline" href="/katalog">Kembali ke katalog</a>.</main>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">Checkout</h1>
      {err && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      <div className="card mb-4 p-5">
        <h2 className="mb-3 font-semibold">1. Metode Penerimaan</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setFulfillment("DELIVERY")} className={`btn ${fulfillment === "DELIVERY" ? "bg-koperasi-red text-white" : "border border-neutral-300 bg-white"}`}>🚚 Delivery ke Rumah</button>
          <button onClick={() => setFulfillment("PICKUP")} className={`btn ${fulfillment === "PICKUP" ? "bg-koperasi-red text-white" : "border border-neutral-300 bg-white"}`}>🏬 Ambil di Gerai</button>
        </div>
      </div>

      {fulfillment === "DELIVERY" && (
        <div className="card mb-4 p-5">
          <h2 className="mb-3 font-semibold">2. Alamat Pengiriman</h2>
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

      <div className="card mb-4 p-5">
        <h2 className="mb-3 font-semibold">3. Metode Pembayaran</h2>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-koperasi-red bg-red-50 p-3">
          <input type="radio" checked readOnly className="accent-koperasi-red" />
          <div><div className="font-semibold">COD — Bayar di Tempat</div><div className="text-xs text-neutral-500">Tunai saat barang tiba / di gerai.</div></div>
        </label>
        <div className="relative mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 opacity-60">
          <div className="flex items-center gap-3">
            <input type="radio" disabled readOnly />
            <div>
              <div className="font-semibold">QRIS — Scan Semua E-Wallet & M-Banking</div>
              <span className="badge mt-1 bg-koperasi-gold text-neutral-900">Coming Soon / Segera Hadir</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4 p-5">
        <h2 className="mb-2 font-semibold">Ringkasan</h2>
        <div className="flex justify-between text-sm"><span>Subtotal ({items.length} item)</span><span>{fmtRp(total)}</span></div>
        <div className="flex justify-between text-sm"><span>Ongkir {zone ? `(${zone.dusun_name})` : ""}</span><span>{fmtRp(fee)}</span></div>
        <div className="mt-2 flex justify-between border-t pt-2 font-bold"><span>Total</span><span className="text-koperasi-red">{fmtRp(grand)}</span></div>
      </div>
      <button className="btn-primary w-full py-3 text-base" disabled={busy} onClick={submit}>{busy ? "Memproses…" : "Buat Pesanan Sekarang (COD)"}</button>
    </main>
  );
}
