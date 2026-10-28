"use client";
import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fmtRp } from "@/components/util";
import { Icon } from "@/components/Icon";

const GOLD = "#F9A825", RED = "#C62828";

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

  if (err && !d) return <main className="p-8"><div className="card card-pad text-sm text-amber-800">{err}</div></main>;
  if (!d) return <main className="mx-auto max-w-7xl px-4 py-10 text-sm text-neutral-400">Memuat dashboard…</main>;

  const k = d.kpi;
  const growth = Number(k.omzet_prev_month) > 0 ? ((Number(k.omzet_month) - Number(k.omzet_prev_month)) / Number(k.omzet_prev_month) * 100).toFixed(1) : "—";
  const grossProfit = Number(k.omzet_month) - Number(k.hpp_month);

  const cards = [
    { label: "Omzet Hari Ini", value: fmtRp(k.omzet_today), icon: "cash" },
    { label: "Omzet Bulan Ini", value: fmtRp(k.omzet_month), sub: `${growth}% vs bulan lalu`, icon: "chart" },
    { label: "Estimasi Laba Kotor", value: fmtRp(grossProfit), icon: "wallet" },
    { label: "Pesanan Hari Ini", value: k.orders_today, icon: "receipt" },
    { label: "Nilai Aset Stok", value: fmtRp(k.asset_value), icon: "box" },
    { label: "COD Belum Disetor", value: fmtRp(k.cod_unremit), warn: Number(k.cod_unremit) > 0, icon: "warning" }
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      {err && <div className="mb-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{err}</div>}

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className={`card card-hover card-pad ${c.warn ? "border-amber-300 bg-amber-50" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="kpi-value">{c.value}</div>
                <div className="kpi-label">{c.label}</div>
                {c.sub && <div className="mt-1 text-[11px] font-semibold text-koperasi-gold">{c.sub}</div>}
              </div>
              <span className="kpi-icon shrink-0"><Icon name={c.icon} className="h-5 w-5" /></span>
            </div>
          </div>
        ))}
      </div>

      <div className="card panel-flag mt-4 card-pad">
        <h2 className="mb-3 font-heading text-base font-bold">Penjualan Online vs Offline — 14 Hari</h2>
        {d.chart.length === 0 ? <p className="text-sm text-neutral-400">Belum ada data penjualan.</p> : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={d.chart.map((r) => ({ ...r, d: String(r.d) }))}>
              <defs>
                <linearGradient id="gOnline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={RED} stopOpacity={0.25} /><stop offset="100%" stopColor={RED} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gOffline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GOLD} stopOpacity={0.25} /><stop offset="100%" stopColor={GOLD} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="d" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #eee", fontSize: 12 }} />
              <Legend iconType="circle" />
              <Area type="monotone" dataKey="online" name="Online" stroke={RED} strokeWidth={2.5} fill="url(#gOnline)" />
              <Area type="monotone" dataKey="offline" name="Offline Kasir" stroke={GOLD} strokeWidth={2.5} fill="url(#gOffline)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card card-pad">
          <h2 className="mb-2 flex items-center gap-2 font-heading text-sm font-bold text-red-700"><Icon name="warning" className="h-4 w-4" /> Stok Kritis</h2>
          {d.low_stock.length === 0 ? <p className="text-sm text-neutral-400">Aman — tidak ada stok kritis.</p> :
            d.low_stock.map((p) => <div key={p.id} className="flex justify-between border-b border-neutral-100 py-2 text-sm last:border-0"><span>{p.name}</span><b className="text-red-600">{p.current_stock} / min {p.min_stock_alert}</b></div>)}
        </div>
        <div className="card card-pad">
          <h2 className="mb-2 flex items-center gap-2 font-heading text-sm font-bold"><Icon name="fire" className="h-4 w-4 text-koperasi-gold" /> Produk Terlaris</h2>
          {d.best_sellers.length === 0 ? <p className="text-sm text-neutral-400">Belum ada penjualan.</p> :
            d.best_sellers.map((p, i) => <div key={i} className="flex justify-between border-b border-neutral-100 py-2 text-sm last:border-0"><span className="truncate">{i + 1}. {p.name}</span><b className="shrink-0">{p.total_qty} terjual</b></div>)}
        </div>
        <div className="card card-pad">
          <h2 className="mb-2 flex items-center gap-2 font-heading text-sm font-bold"><Icon name="clipboard" className="h-4 w-4 text-koperasi-red" /> Antrean Persetujuan</h2>
          <div className="text-sm">Sesi opname menunggu: <b className="text-koperasi-red">{k.opname_pending}</b> — <a className="font-semibold underline" href="/admin/opname">tinjau</a></div>
          <div className="mt-1 text-sm">Tutup kas menunggu verifikasi: <b className="text-koperasi-red">{k.closing_pending}</b></div>
        </div>
      </div>

      <div className="card mt-4 card-pad">
        <h2 className="mb-3 font-heading text-base font-bold">Laporan Tutup Kas — Verifikasi & Kunci</h2>
        {closings.length === 0 ? <p className="text-sm text-neutral-400">Belum ada laporan tutup kas.</p> : (
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead><tr><th>Tanggal</th><th>Oleh</th><th>Kas Sistem</th><th>Fisik</th><th>Selisih</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {closings.map((c) => (
                  <tr key={c.id}>
                    <td className="whitespace-nowrap">{c.closing_date}</td><td>{c.submitted_by_name || "-"}</td><td>{fmtRp(c.expected_closing_cash)}</td>
                    <td>{fmtRp(c.actual_physical_cash)}</td>
                    <td className={Number(c.cash_difference) !== 0 ? "font-bold text-red-600" : ""}>{fmtRp(c.cash_difference)}</td>
                    <td><span className={`badge ${c.status === "VERIFIED_LOCKED" ? "badge-green" : "badge-gold"}`}>{c.status === "VERIFIED_LOCKED" ? "Terkunci" : "Menunggu"}</span></td>
                    <td>{c.status === "SUBMITTED" && <button className="btn-primary btn-sm" onClick={() => verify(c.id)}>Verifikasi</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
