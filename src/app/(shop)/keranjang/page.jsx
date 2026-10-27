"use client";
import { useCart } from "@/components/CartContext";
import { fmtRp } from "@/components/util";
import Link from "next/link";

export default function KeranjangPage() {
  const { items, setQty, total } = useCart();
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">Keranjang Belanja</h1>
      {items.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="mb-3 text-sm text-neutral-500">Keranjang masih kosong.</p>
          <Link href="/katalog" className="btn-primary">Belanja Sekarang</Link>
        </div>
      ) : (
        <div className="card divide-y">
          {items.map((i) => (
            <div key={i.product_id} className="flex items-center gap-3 p-4">
              <div className="flex-1">
                <div className="font-semibold text-sm">{i.name}</div>
                <div className="text-xs text-neutral-500">{fmtRp(i.price)} × {i.qty} = {fmtRp(i.price * i.qty)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-outline h-8 w-8 p-0" onClick={() => setQty(i.product_id, i.qty - 1)}>−</button>
                <span className="w-8 text-center font-semibold">{i.qty}</span>
                <button className="btn-outline h-8 w-8 p-0" disabled={i.qty >= i.stock} onClick={() => setQty(i.product_id, i.qty + 1)}>+</button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between p-4">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold text-koperasi-red">{fmtRp(total)}</span>
          </div>
          <div className="p-4">
            <Link href="/checkout" className="btn-primary w-full">Lanjut ke Checkout →</Link>
          </div>
        </div>
      )}
    </main>
  );
}
