"use client";
import { useEffect, useState } from "react";
import { fmtRp } from "@/components/util";

export default function PosPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/v1/products").then((r) => r.json()).then((j) => { if (j.success) setProducts(j.data); }).catch(() => {});
  }, []);

  const addItem = (p) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.product_id === p.id);
      if (ex) {
        if (ex.qty >= p.current_stock) { setMsg(`Stok ${p.name} tidak cukup`); return prev; }
        return prev.map((i) => (i.product_id === p.id ? { ...i, qty: i.qty + 1 } : i));
      }
      if (p.current_stock < 1) { setMsg(`${p.name} habis`); return prev; }
      return [...prev, { product_id: p.id, name: p.name, price: Number(p.selling_price), qty: 1, stock: p.current_stock }];
    });
  };

  const submit = async () => {
    const res = await fetch("/api/v1/finance", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pos_sale", items: cart.map((i) => ({ product_id: i.product_id, qty: i.qty })) }) });
    const j = await res.json();
    if (!j.success) { setMsg(j.error); return; }
    setMsg(`✅ Penjualan ${j.data.number} tercatat: ${fmtRp(j.data.total)} — stok terpotong via ledger.`);
    setCart([]);
    fetch("/api/v1/products").then((r) => r.json()).then((jj) => { if (jj.success) setProducts(jj.data); });
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">Kasir Cepat (Penjualan Offline Gerai)</h1>
      {msg && <div className="mb-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{msg}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <input className="input mb-3" placeholder="Cari barang…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="grid max-h-96 grid-cols-2 gap-2 overflow-y-auto">
            {filtered.map((p) => (
              <button key={p.id} disabled={p.current_stock <= 0} onClick={() => addItem(p)}
                className="card p-3 text-left text-xs disabled:opacity-40 hover:border-koperasi-red">
                <div className="font-semibold">{p.name}</div>
                <div className="text-koperasi-red font-bold">{fmtRp(p.selling_price)}</div>
                <div className="text-neutral-400">stok {p.current_stock}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <h2 className="mb-2 font-semibold">Nota</h2>
          {cart.length === 0 && <p className="text-sm text-neutral-400">Klik barang untuk menambah.</p>}
          {cart.map((i) => (
            <div key={i.product_id} className="flex items-center justify-between border-b py-2 text-sm">
              <span>{i.qty}× {i.name}</span>
              <span className="flex items-center gap-2">
                {fmtRp(i.price * i.qty)}
                <button className="text-red-500" onClick={() => setCart(cart.filter((c) => c.product_id !== i.product_id))}>✕</button>
              </span>
            </div>
          ))}
          <div className="mt-3 flex justify-between font-bold"><span>Total</span><span className="text-koperasi-red">{fmtRp(total)}</span></div>
          <button className="btn-primary mt-3 w-full" disabled={cart.length === 0} onClick={submit}>Simpan Penjualan (Potong Stok)</button>
        </div>
      </div>
    </main>
  );
}
