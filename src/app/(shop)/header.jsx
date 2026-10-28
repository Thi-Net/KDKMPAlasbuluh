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
  const links = [
    { href: "/katalog", icon: "store", label: "Katalog" },
    { href: "/keranjang", icon: "cart", label: "Keranjang", badge: count },
    { href: "/pesanan", icon: "truck", label: "Pesanan" }
  ];
  return (
    <header className="appbar">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 shadow-sm">
            <Icon name="store" className="h-5 w-5 text-koperasi-red" />
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-sm font-extrabold tracking-tight">Gerai Alasbuluh</span>
            <span className="block text-[11px] text-white/65">Koperasi Merah Putih</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm" aria-label="Navigasi belanja">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="appnav-link relative bg-white/10">
              <span className="relative">
                <Icon name={l.icon} className="h-4 w-4" />
                {l.badge > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-koperasi-gold px-1 text-[10px] font-black text-neutral-900">{l.badge}</span>
                )}
              </span>
              <span className="hidden sm:inline">{l.label}</span>
            </Link>
          ))}
          {me ? (
            <button onClick={logout} className="appnav-link bg-white/15 hover:bg-white/25"><Icon name="logout" className="h-4 w-4" /> <span className="hidden sm:inline">Keluar</span></button>
          ) : (
            <Link href="/login" className="appnav-link bg-koperasi-gold font-extrabold text-neutral-900 hover:brightness-105">Masuk</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
