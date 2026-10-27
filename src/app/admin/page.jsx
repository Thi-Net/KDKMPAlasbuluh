"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fmtRp } from "@/components/util";

export default function AdminDashboard() {
  const [d, setD] = useState(null);
  const [closings, setClosings] = useState([]);
  const [err, setErr] = useState("");

  const load = () => {
    fetch("/api/v1/admin?what=dashboard").then((r) => r.json()).then((j) => { if (j.success) setD(j.data); else setErr(j.error); }).catch(() => {});
    fetch("/api/v1/admin?what=closings").then((r) => r.json()).then((j) => { if (j.success) setClosings(j.data); }).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const verify = async (id) => {
    const res = await fetch("/api/v1/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify_closing", closing_id: id }) });
    const j = await res.json();
    if (!j.success) setErr(j.error); else load();
  };

  if (err && !d) return <main className="p-8"><div className="card p-6 text-sm text-amber-800">⚠️ {err}</div></main>;
  if (!d) return <main className="p-8 text-sm text-neutral-500">Memuat dashboard…</main>;

  const k = d.kpi;
  const growth = Number(k.omzet_prev_month) > 0 ? ((Number(k.omzet_month) - Number(k.omzet_prev_month)) / Number(k.omzet_prev_month) * 100).toFixed(1) : "—";
  const grossProfit = Number(k.omzet_month) - Number(k.hpp_month);

  const cards = [
    { label: "Omzet Hari Ini", value: fmtRp(k.omzet_today), icon: "💰" },
    { label: "Omzet Bulan Ini", value: fmtRp(k.omzet_month), sub: `Pertumbuhan: ${growth}% vs bulan lalu`, icon: "📈" },
    { label: "Estimasi Laba Kotor (bulan ini)", value: fmtRp(grossProfit), icon: "🧮" },
    { label: "Pesanan Hari Ini", value: k.orders_today, icon: "🧾" },
    { label: "Nilai Aset Stok Gerai", value: fmtRp(k.asset_value), icon: "🏪" },
    { label: "COD Belum Disetor", value: fmtRp(k.cod_unremit), warn: Number(k.cod_unremit) > 0, icon: "💵" }
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {err && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className={`card p-4 ${c.warn ? "border-amber-400 bg-amber-50" : ""}`}>
            <div className="text-xl">{c.icon}</div>
            <div className="text-lg font-extrabold text-koperasi-red">{c.value}</div>
            <div className="text-xs text-neutral-500">{c.label}</div>
            {c.sub && <div className="mt-1 text-[11px] text-neutral-400">{c.sub}</div>}
          </div>
        ))}
      </div>

      <div className="card mt-4 p-4">
        <h2 className="mb-3 font-semibold">Penjualan Online vs Offline (14 hari)</h2>
        {d.chart.length === 0 ? <p className="text-sm text-neutral-400">Belum ada data penjualan.</p> : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={d.chart.map((r) => ({ ...r, d: String(r.d) }))}>
              <XAxis dataKey="d" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Legend />
              <Line type="monotone" dataKey="online" name="Online" stroke="#C62828" strokeWidth={2} />
              <Line type="monotone" dataKey="offline" name="Offline Kasir" stroke="#F9A825" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card p-4">
          <h2 className="mb-2 font-semibold text-red-700">⚠️ Stok Kritis</h2>
          {d.low_stock.length === 0 ? <p className="text-sm text-neutral-400">Aman — tidak ada stok kritis.</p> :
            d.low_stock.map((p) => <div key={p.id} className="flex justify-between border-b py-1 text-sm"><span>{p.name}</span><b className="text-red-600">{p.current_stock} / min {p.min_stock_alert}</b></div>)}
        </div>
        <div className="card p-4">
          <h2 className="mb-2 font-semibold">🔥 Produk Terlaris</h2>
          {d.best_sellers.length === 0 ? <p className="text-sm text-neutral-400">Belum ada penjualan.</p> :
            d.best_sellers.map((p, i) => <div key={i} className="flex justify-between border-b py-1 text-sm"><span>{i + 1}. {p.name}</span><b>{p.total_qty} terjual</b></div>)}
        </div>
        <div className="card p-4">
          <h2 className="mb-2 font-semibold">⏳ Antrean Persetujuan</h2>
          <div className="text-sm">Sesi opname menunggu: <b className="text-koperasi-red">{k.opname_pending}</b> — <a className="underline" href="/admin/opname">tinjau</a></div>
          <div className="text-sm">Tutup kas menunggu verifikasi: <b className="text-koperasi-red">{k.closing_pending}</b></div>
        </div>
      </div>

      <div className="card mt-4 p-4">
        <h2 className="mb-2 font-semibold">Laporan Tutup Kas (Verifikasi & Kunci)</h2>
        {closings.length === 0 ? <p className="text-sm text-neutral-400">Belum ada laporan tutup kas.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b text-left text-xs text-neutral-500"><th className="py-1">Tanggal</th><th>Oleh</th><th>Kas Sistem</th><th>Fisik</th><th>Selisih</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {closings.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="py-1">{c.closing_date}</td><td>{c.submitted_by_name || "-"}</td><td>{fmtRp(c.expected_closing_cash)}</td>
                  <td>{fmtRp(c.actual_physical_cash)}</td>
                  <td className={Number(c.cash_difference) !== 0 ? "font-bold text-red-600" : ""}>{fmtRp(c.cash_difference)}</td>
                  <td><span className={`badge ${c.status === "VERIFIED_LOCKED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{c.status === "VERIFIED_LOCKED" ? "Terkunci" : "Menunggu"}</span></td>
                  <td>{c.status === "SUBMITTED" && <button className="btn-primary text-xs" onClick={() => verify(c.id)}>Verifikasi & Kunci</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
