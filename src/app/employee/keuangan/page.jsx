"use client";
import { useEffect, useState } from "react";
import { fmtRp } from "@/components/util";

const CATEGORIES = ["OPERASIONAL_GERAI", "BBM_KURIR", "KULAKAN_STOK", "LAINNYA"];

export default function KeuanganPage() {
  const [recap, setRecap] = useState(null);
  const [exp, setExp] = useState({ category: "OPERASIONAL_GERAI", amount: "", description: "" });
  const [opening, setOpening] = useState("0");
  const [physical, setPhysical] = useState("");
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => fetch("/api/v1/finance").then((r) => r.json()).then((j) => { if (j.success) setRecap(j.data); }).catch(() => {});
  useEffect(() => { load(); }, []);

  const expected = recap ? Number(recap.offline_cash) + Number(recap.cod_today) - Number(recap.expenses) + Number(opening || 0) : 0;

  const addExpense = async () => {
    const res = await fetch("/api/v1/finance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "expense", ...exp }) });
    const j = await res.json();
    setMsg(j.success ? "✅ Pengeluaran dicatat." : j.error);
    if (j.success) { setExp({ ...exp, amount: "", description: "" }); load(); }
  };

  const submitClosing = async () => {
    const res = await fetch("/api/v1/finance", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "closing", opening_cash: Number(opening || 0), actual_physical_cash: Number(physical), notes }) });
    const j = await res.json();
    setMsg(j.success ? `✅ Tutup kas diajukan. Kas akhir sistem: ${fmtRp(j.data.expected)}, selisih: ${fmtRp(j.data.difference)}` : j.error);
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">Kas & Tutup Kas Harian</h1>
      {msg && <div className="mb-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{msg}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Input Pengeluaran Harian</h2>
          <label className="label">Kategori</label>
          <select className="input mb-3" value={exp.category} onChange={(e) => setExp({ ...exp, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
          </select>
          <label className="label">Nominal (Rp)</label>
          <input className="input mb-3" type="number" value={exp.amount} onChange={(e) => setExp({ ...exp, amount: e.target.value })} />
          <label className="label">Keterangan</label>
          <input className="input mb-3" value={exp.description} onChange={(e) => setExp({ ...exp, description: e.target.value })} placeholder="cth: beli plastik kresek" />
          <button className="btn-primary w-full" onClick={addExpense}>Catat Pengeluaran</button>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 font-semibold">Tutup Kas Harian (Satu Layar)</h2>
          <label className="label">Kas Awal (Rp)</label>
          <input className="input mb-3" type="number" value={opening} onChange={(e) => setOpening(e.target.value)} />
          {!recap ? <p className="text-sm text-neutral-400">Memuat rekap…</p> : (
            <div className="mb-3 rounded-lg bg-neutral-50 p-3 text-sm">
              <div className="flex justify-between"><span>Penjualan tunai kasir offline</span><b>{fmtRp(recap.offline_cash)}</b></div>
              <div className="flex justify-between"><span>Setoran COD delivery hari ini</span><b>{fmtRp(recap.cod_today)}</b></div>
              <div className="flex justify-between"><span>Pengeluaran tunai</span><b>-{fmtRp(recap.expenses)}</b></div>
              <div className="mt-1 flex justify-between border-t pt-1 font-bold"><span>Kas Akhir Sistem</span><span className="text-koperasi-red">{fmtRp(expected)}</span></div>
            </div>
          )}
          <label className="label">Uang Fisik di Laci (Rp)</label>
          <input className="input mb-3" type="number" value={physical} onChange={(e) => setPhysical(e.target.value)} />
          {physical !== "" && Number(physical) !== expected && (
            <p className="mb-3 text-sm font-semibold text-red-600">⚠️ Selisih: {fmtRp(Number(physical) - expected)} — wajib isi catatan.</p>
          )}
          <label className="label">Catatan</label>
          <input className="input mb-3" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <button className="btn-primary w-full" onClick={submitClosing} disabled={physical === ""}>Ajukan Tutup Kas ke Admin</button>
        </div>
      </div>
    </main>
  );
}
