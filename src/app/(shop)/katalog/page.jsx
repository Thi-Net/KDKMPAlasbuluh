"use client";
import { useEffect, useState } from "react";
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
    <main className="mx-auto max-w-5xl px-4 py-6 md:py-8">
      <div className="mb-5 overflow-hidden rounded-[20px] bg-gradient-to-br from-koperasi-darkred via-koperasi-red to-[#E0574F] p-5 text-white shadow-[var(--shadow-red)] md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-extrabold">Katalog Gerai</h1>
            <p className="mt-1 text-sm text-white/80">Kebutuhan pokok & produk UMKM warga Alasbuluh.</p>
          </div>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-bold ring-1 ring-white/30"><Icon name="check" className="h-3 w-3" /> COD Aktif</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-bold ring-1 ring-white/30"><Icon name="truck" className="h-3 w-3" /> Antar ke Dusun</span>
          </div>
        </div>
      </div>

      <div className="card mb-5 flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Icon name="box" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-300" />
          <input className="input pl-9" placeholder="Cari barang…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Cari produk" />
        </div>
        <select className="input sm:w-48" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter kategori">
          <option value="">Semua Kategori</option>
          {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <button type="button" onClick={() => setLocalOnly(!localOnly)} aria-pressed={localOnly}
          className={`btn btn-sm shrink-0 ${localOnly ? "btn-primary" : "btn-outline"}`}>
          <Icon name="leaf" className="h-3.5 w-3.5" /> UMKM Alasbuluh
        </button>
      </div>

      {products.length === 0 ? (
        <div className="card p-10 text-center text-sm text-neutral-400">
          <Icon name="box" className="mx-auto mb-3 h-10 w-10 text-neutral-200" />
          Tidak ada produk ditemukan.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {products.map((p) => {
            const habis = p.current_stock <= 0;
            const stockLow = !habis && p.current_stock <= 10;
            return (
              <div key={p.id} className="card card-hover flex flex-col overflow-hidden">
                <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-[#FBF7F0] to-[#F4EDE2] text-neutral-300">
                  <Icon name="box" className="h-11 w-11" />
                  {p.is_local_alasbuluh && (
                    <span className="badge-solid-red absolute left-2 top-2 !px-2 !py-0.5 !text-[10px]">
                      <Icon name="leaf" className="h-2.5 w-2.5" /> Lokal
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3.5">
                  <div className="text-sm font-bold leading-snug text-neutral-900">{p.name}</div>
                  <div className="mt-auto pt-2.5">
                    <div className="font-heading text-lg font-extrabold text-koperasi-red">
                      {fmtRp(p.selling_price)} <span className="text-xs font-semibold text-neutral-400">/{p.unit}</span>
                    </div>
                    <div className={`mt-0.5 text-[11px] font-bold ${habis ? "text-red-500" : stockLow ? "text-amber-600" : "text-green-600"}`}>
                      {habis ? "Stok Habis" : stockLow ? `Sisa ${p.current_stock} — cepat!` : `Tersedia ${p.current_stock}`}
                    </div>
                    <button
                      className={`mt-2.5 w-full ${habis ? "btn-ghost bg-neutral-100 text-neutral-400" : "btn-primary"} text-xs`}
                      disabled={habis}
                      onClick={() => notify(add(p) ? `${p.name} masuk keranjang` : `Stok ${p.name} tidak mencukupi`)}
                    >
                      {habis ? "Stok Habis" : <><Icon name="cart" className="h-3.5 w-3.5" /> Keranjang</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
