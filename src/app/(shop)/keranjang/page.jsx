"use client";
import { useCart } from "@/components/CartContext";
import { fmtRp } from "@/components/util";
import { Icon } from "@/components/Icon";
import Link from "next/link";

export default function KeranjangPage() {
  const { items, setQty, total } = useCart();
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 md:py-8">
      <div className="mb-5 rounded-[20px] bg-gradient-to-br from-koperasi-gold to-[#FBC02D] p-5 text-neutral-900 shadow-[var(--shadow-gold)] md:p-6">
        <h1 className="font-heading text-2xl font-extrabold">Keranjang Belanja</h1>
        <p className="mt-1 text-sm font-semibold text-neutral-800">{items.length ? `${items.length} jenis barang siap dipesan.` : "Belum ada barang."}</p>
      </div>

      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-300"><Icon name="cart" className="h-8 w-8" /></span>
          <h2 className="font-heading text-lg font-bold text-neutral-900">Keranjang masih kosong</h2>
          <p className="mt-1.5 text-sm text-neutral-500">Tambahkan kebutuhan pokok dari katalog gerai.</p>
          <Link href="/katalog" className="btn-primary mt-5"><Icon name="store" className="h-4 w-4" /> Belanja Sekarang</Link>
        </div>
      ) : (
        <>
          <div className="card divide-y divide-neutral-100 overflow-hidden">
            {items.map((i) => (
              <div key={i.product_id} className="flex items-center gap-3 p-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FBF7F0] to-[#F4EDE2] text-neutral-300"><Icon name="box" className="h-6 w-6" /></span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-neutral-900">{i.name}</div>
                  <div className="text-xs text-neutral-500">{fmtRp(i.price)} × {i.qty} = <b className="text-koperasi-red">{fmtRp(i.price * i.qty)}</b></div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button aria-label="Kurangi jumlah" className="btn-outline !min-h-0 h-9 w-9 !p-0 text-base font-bold" onClick={() => setQty(i.product_id, i.qty - 1)}>−</button>
                  <span className="w-7 text-center text-sm font-extrabold">{i.qty}</span>
                  <button aria-label="Tambah jumlah" className="btn-outline !min-h-0 h-9 w-9 !p-0 text-base font-bold" disabled={i.qty >= i.stock} onClick={() => setQty(i.product_id, i.qty + 1)}>+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="card mt-4 card-pad">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wide text-neutral-400">Total Belanja</span>
              <span className="font-heading text-2xl font-extrabold text-koperasi-red">{fmtRp(total)}</span>
            </div>
            <p className="mt-1 text-xs text-neutral-400">Ongkir dihitung di halaman checkout sesuai dusun.</p>
            <Link href="/checkout" className="btn-primary mt-4 w-full">Lanjut ke Checkout <Icon name="arrowRight" className="h-4 w-4" /></Link>
            <Link href="/katalog" className="btn-ghost mt-2 w-full text-xs">Tambah barang lagi</Link>
          </div>
        </>
      )}
    </main>
  );
}
