"use client";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/CartContext";
import { fmtRp } from "@/components/util";
import { Icon } from "@/components/Icon";

export default function KatalogPage() {
  const { add } = useCart();
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");
  const [localOnly, setLocalOnly] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (cat) qs.set("category", cat);
    if (localOnly) qs.set("local", "1");
    const t = setTimeout(() => {
      fetch("/api/v1/products?" + qs.toString()).then((r) => r.json()).then((j) => {
        if (j.success) { setProducts(j.data); if (j.meta?.categories) setCats(j.meta.categories); }
      }).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [search, cat, localOnly]);

  const notify = (m) => { setToast(m); setTimeout(() => setToast(""), 1800); };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">Katalog Gerai Alasbuluh</h1>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input className="input flex-1" placeholder="Cari barang…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input sm:w-52" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Semua Kategori</option>
          {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <label className="btn-outline cursor-pointer select-none sm:w-auto">
          <input type="checkbox" className="mr-2" checked={localOnly} onChange={(e) => setLocalOnly(e.target.checked)} />
          UMKM Alasbuluh
        </label>
      </div>
      {products.length === 0 ? (
        <div className="card p-8 text-center text-sm text-neutral-500">
          Tidak ada produk ditemukan. Jika database belum terhubung, admin perlu menjalankan <code>supabase/schema.sql</code> + <code>seed.sql</code>.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <div key={p.id} className="card flex flex-col overflow-hidden">
              <div className="flex h-28 items-center justify-center bg-white text-neutral-300"><Icon name="box" className="h-10 w-10" /></div>
              <div className="flex flex-1 flex-col p-3">
                <div className="text-sm font-semibold leading-tight">{p.name}</div>
                {p.is_local_alasbuluh && <span className="badge mt-1 w-fit bg-koperasi-red text-white"><Icon name="leaf" className="mr-1 h-3 w-3" /> Lokal Alasbuluh</span>}
                <div className="mt-auto pt-2">
                  <div className="font-bold text-koperasi-red">{fmtRp(p.selling_price)} <span className="text-xs font-normal text-neutral-400">/{p.unit}</span></div>
                  <div className="text-xs text-neutral-500">{p.current_stock > 0 ? `Stok ${p.current_stock}` : "Stok Habis"}</div>
                  <button
                    className="btn-primary mt-2 w-full text-xs"
                    disabled={p.current_stock <= 0}
                    onClick={() => notify(add(p) ? `${p.name} masuk keranjang` : `Stok ${p.name} tidak mencukupi`)}
                  >
                    {p.current_stock > 0 ? "+ Keranjang" : "Stok Habis"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-neutral-900 px-5 py-2 text-sm text-white shadow-lg">{toast}</div>}
    </main>
  );
}
