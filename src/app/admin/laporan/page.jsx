"use client";
import { useEffect, useState } from "react";
import { fmtRp } from "@/components/util";

const BULAN = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default function LaporanPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [pl, setPl] = useState(null);
  const [sales, setSales] = useState([]);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    try {
      const q = `&year=${year}&month=${month}`;
      const [a, b] = await Promise.all([
        fetch(`/api/v1/admin?what=profit_loss${q}`).then((r) => r.json()),
        fetch(`/api/v1/admin?what=sales_detail${q}`).then((r) => r.json()),
      ]);
      if (a.success) setPl(a.data); else setErr(a.error || "");
      if (b.success) setSales(b.data || []);
    } catch (e) { setErr("Gagal memuat laporan."); }
  };

  useEffect(() => { load(); }, [year, month]);

  const download = (what) => {
    window.open(`/api/v1/admin?what=${what}&year=${year}&month=${month}`, "_blank");
  };

  const printPdf = () => window.print();

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <h1 className="text-xl font-bold">Laporan Koperasi</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="card px-3 py-2 text-sm">
            {BULAN.slice(1).map((b, i) => <option key={i} value={i + 1}>{b}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="card px-3 py-2 text-sm">
            {[now.getFullYear(), now.getFullYear() - 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn-outline text-sm" onClick={printPdf}>Cetak / PDF</button>
          <button className="btn-outline text-sm" onClick={() => download("export_sales_csv")}>Ekspor Penjualan (Excel/CSV)</button>
          <button className="btn-outline text-sm" onClick={() => download("export_stock_csv")}>Ekspor Mutasi Stok (Excel/CSV)</button>
        </div>
      </div>
      {err && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      {pl && (
        <div className="card mb-6 p-6">
          <h2 className="mb-1 text-lg font-bold">Laba Rugi — {BULAN[month]} {year}</h2>
          <p className="mb-4 text-xs text-neutral-500">Koperasi Desa Merah Putih — Gerai Alasbuluh, Wongsorejo, Banyuwangi</p>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between border-b pb-1"><span>Penjualan Online (Marketplace Web)</span><b>{fmtRp(pl.penjualan_online)}</b></div>
            <div className="flex justify-between border-b pb-1"><span>Penjualan Gerai Offline (POS)</span><b>{fmtRp(pl.penjualan_offline)}</b></div>
            <div className="flex justify-between border-b-2 border-neutral-300 pb-1 font-bold"><span>Total Penjualan Bersih</span><span>{fmtRp(pl.total_penjualan)}</span></div>
            <div className="flex justify-between border-b pb-1"><span>HPP Barang Terjual</span><b className="text-red-700">({fmtRp(pl.hpp_online)})</b></div>
            <div className="flex justify-between border-b-2 border-neutral-300 pb-1 font-bold text-green-800"><span>Laba Kotor</span><span>{fmtRp(pl.laba_kotor)}</span></div>
            <div className="flex justify-between border-b pb-1"><span>Pengeluaran — Operasional Gerai</span><span>({fmtRp(pl.rincian_pengeluaran.operasional_gerai)})</span></div>
            <div className="flex justify-between border-b pb-1"><span>Pengeluaran — BBM Kurir</span><span>({fmtRp(pl.rincian_pengeluaran.bbm_kurir)})</span></div>
            <div className="flex justify-between border-b pb-1"><span>Pengeluaran — Kulakan Stok</span><span>({fmtRp(pl.rincian_pengeluaran.kulakan_stok)})</span></div>
            <div className="flex justify-between border-b pb-1"><span>Pengeluaran — Lainnya</span><span>({fmtRp(pl.rincian_pengeluaran.lainnya)})</span></div>
            <div className="flex justify-between border-b-2 border-neutral-300 pb-1 font-bold"><span>Total Pengeluaran</span><span>({fmtRp(pl.pengeluaran)})</span></div>
            <div className={`flex justify-between rounded-lg p-3 text-base font-bold ${pl.laba_bersih >= 0 ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
              <span>Laba Bersih Periode Ini</span><span>{fmtRp(pl.laba_bersih)}</span>
            </div>
          </div>
        </div>
      )}
      <div className="card card-pad">
        <h2 className="mb-3 text-lg font-bold">Detail Penjualan Harian</h2>
        {sales.length === 0 ? <p className="text-sm text-neutral-400">Belum ada transaksi pada periode ini.</p> : (
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead><tr className="border-b text-left text-xs text-neutral-500"><th className="py-2">Tanggal</th><th>Online</th><th>Offline</th><th>Total</th><th>Order Online</th></tr></thead>
              <tbody>
                {sales.map((r) => (
                  <tr key={r.tanggal} className="border-b last:border-0">
                    <td className="py-2">{r.tanggal}</td>
                    <td>{fmtRp(r.online)}</td><td>{fmtRp(r.offline)}</td>
                    <td className="font-semibold">{fmtRp(r.total)}</td>
                    <td>{r.orders_online}</td>
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
