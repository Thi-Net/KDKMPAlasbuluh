"use client";
import { useEffect, useState } from "react";
import { fmtRp } from "@/components/util";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState({ name: "", category_id: "", selling_price: "", cost_price: "", unit: "pcs", current_stock: "0", min_stock_alert: "5", is_local_alasbuluh: false });
  const [restock, setRestock] = useState({ product_id: "", qty: "", unit_cost: "" });
  const [msg, setMsg] = useState("");

  const load = () => fetch("/api/v1/products").then((r) => r.json()).then((j) => { if (j.success) { setProducts(j.data); setCats(j.meta?.categories || []); } }).catch(() => {});
  useEffect(() => { load(); }, []);

  const createProduct = async () => {
    const res = await fetch("/api/v1/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const j = await res.json();
    setMsg(j.success ? "✅ Produk ditambahkan." : j.error);
    if (j.success) { setForm({ ...form, name: "", selling_price: "", cost_price: "", current_stock: "0" }); load(); }
  };

  const toggleLocal = async (p) => {
    const res = await fetch("/api/v1/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, is_local_alasbuluh: !p.is_local_alasbuluh }) });
    if ((await res.json()).success) load();
  };

  const toggleActive = async (p) => {
    const res = await fetch("/api/v1/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: p.id, is_active: !p.is_active }) });
    if ((await res.json()).success) load();
  };

  const doRestock = async () => {
    const res = await fetch("/api/v1/stock", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: Number(restock.product_id), qty: Number(restock.qty), unit_cost: restock.unit_cost ? Number(restock.unit_cost) : null, notes: "Restock via dashboard admin" }) });
    const j = await res.json();
    setMsg(j.success ? `✅ Restock: saldo ${j.data.before} → ${j.data.after}` : j.error);
    if (j.success) { setRestock({ product_id: "", qty: "", unit_cost: "" }); load(); }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">Master Produk & Stok Gerai</h1>
      {msg && <div className="mb-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{msg}</div>}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card card-pad">
          <h2 className="mb-3 font-semibold">+ Produk Baru</h2>
          <input className="input mb-2" placeholder="Nama produk" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className="input mb-2" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
            <option value="">— Kategori —</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <input className="input" type="number" placeholder="HPP (modal)" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
            <input className="input" type="number" placeholder="Harga jual" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
            <input className="input" placeholder="Satuan (pcs/kg)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <input className="input" type="number" placeholder="Stok awal" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: e.target.value })} />
          </div>
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_local_alasbuluh} onChange={(e) => setForm({ ...form, is_local_alasbuluh: e.target.checked })} />
            Produk Lokal Alasbuluh (UMKM desa)
          </label>
          <button className="btn-primary w-full" onClick={createProduct}>Simpan Produk</button>
        </div>
        <div className="card card-pad">
          <h2 className="mb-3 font-semibold">📦 Input Barang Masuk (Restock / Kulakan)</h2>
          <select className="input mb-2" value={restock.product_id} onChange={(e) => setRestock({ ...restock, product_id: e.target.value })}>
            <option value="">— Pilih produk —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name} (stok {p.current_stock})</option>)}
          </select>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <input className="input" type="number" placeholder="Jumlah masuk" value={restock.qty} onChange={(e) => setRestock({ ...restock, qty: e.target.value })} />
            <input className="input" type="number" placeholder="Harga beli/unit (opsional)" value={restock.unit_cost} onChange={(e) => setRestock({ ...restock, unit_cost: e.target.value })} />
          </div>
          <button className="btn-gold w-full" onClick={doRestock}>Catat Barang Masuk</button>
          <p className="mt-2 text-xs text-neutral-500">Semua perubahan stok dicatat ke Stock Ledger (immutable) — tidak pernah menimpa angka stok langsung.</p>
        </div>
      </div>

      <div className="card mt-4 overflow-x-auto p-4">
        <h2 className="mb-2 font-semibold">Daftar Produk ({products.length})</h2>
        <table className="table-clean">
          <thead><tr className="border-b text-left text-xs text-neutral-500"><th className="py-1">Nama</th><th>Kategori</th><th>HPP</th><th>Harga</th><th>Stok</th><th>Lokal</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-1 font-medium">{p.name}</td><td>{p.category_name}</td><td>{fmtRp(0) && ""}</td>
                <td>{fmtRp(p.selling_price)}</td>
                <td className={p.current_stock <= p.min_stock_alert ? "font-bold text-red-600" : ""}>{p.current_stock} {p.unit}</td>
                <td>{p.is_local_alasbuluh ? "✅" : "—"}</td>
                <td>{p.is_active ? "Aktif" : "Nonaktif"}</td>
                <td className="flex gap-1 py-1">
                  <button className="btn-outline text-xs" onClick={() => toggleLocal(p)}>{p.is_local_alasbuluh ? "Lepas Lokal" : "Tandai Lokal"}</button>
                  <button className="btn-outline text-xs" onClick={() => toggleActive(p)}>{p.is_active ? "Nonaktifkan" : "Aktifkan"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
