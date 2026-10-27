"use client";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";

export default function Header() {
  const { count } = useCart();
  const router = useRouter();
  const [me, setMe] = useState(null);
  useEffect(() => {
    fetch("/api/v1/auth/me").then((r) => r.json()).then((j) => { if (j.success) setMe(j.data); }).catch(() => {});
  }, []);
  const logout = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };
  return (
    <header className="sticky top-0 z-40 border-b-4 border-koperasi-gold bg-koperasi-red text-white shadow-[var(--shadow-md)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-sm font-heading font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-black text-koperasi-red">KP</span>
          <span className="hidden sm:inline">Koperasi Merah Putih</span>
          <span className="sm:hidden">Koperasi MP</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm" aria-label="Navigasi belanja">
          <Link href="/katalog" className="flex items-center gap-1 rounded px-2.5 py-1.5 transition-colors duration-200 hover:bg-white/10"><Icon name="store" className="h-4 w-4" /> <span className="hidden sm:inline">Katalog</span></Link>
          <Link href="/keranjang" className="flex items-center gap-1 rounded px-2.5 py-1.5 transition-colors duration-200 hover:bg-white/10">
            <span className="relative"><Icon name="cart" className="h-4 w-4" />
            {count > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-koperasi-gold px-1 text-[10px] font-bold text-neutral-900">{count}</span>}</span>
            <span className="hidden sm:inline">Keranjang</span>
          </Link>
          <Link href="/pesanan" className="flex items-center gap-1 rounded px-2.5 py-1.5 transition-colors duration-200 hover:bg-white/10"><Icon name="truck" className="h-4 w-4" /> <span className="hidden sm:inline">Pesanan</span></Link>
          {me ? (
            <button onClick={logout} className="flex items-center gap-1 rounded bg-white/15 px-3 py-1.5 transition-colors duration-200 hover:bg-white/25"><Icon name="logout" className="h-4 w-4" /> Keluar</button>
          ) : (
            <Link href="/login" className="rounded bg-koperasi-gold px-3 py-1.5 font-semibold text-neutral-900 transition-all duration-200 hover:brightness-95">Masuk</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
