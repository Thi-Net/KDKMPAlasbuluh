"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { KoperasiLogo, Icon } from "./Icon";

/**
 * AppShellNav — bar navigasi aplikasi (admin/karyawan) dengan indikator aktif.
 * Sticky, pill aktif putih, responsif (scroll horizontal di mobile).
 */
export default function AppShellNav({ title, subtitle, items, accent = "red" }) {
  const pathname = usePathname();
  return (
    <header className="appbar">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/95 shadow-sm">
            <KoperasiLogo size={26} />
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-sm font-extrabold tracking-tight">{title}</span>
            {subtitle && <span className="block text-[11px] text-white/65">{subtitle}</span>}
          </span>
        </Link>
        <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1 sm:mx-0 sm:flex-wrap sm:pb-0" aria-label="Navigasi aplikasi">
          {items.map((it) => {
            const active = pathname === it.href || (it.href !== "/admin" && it.href !== "/employee" && pathname.startsWith(it.href));
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`appnav-link whitespace-nowrap ${active ? "appnav-link-active" : "bg-white/10"}`}
              >
                {it.icon && <Icon name={it.icon} className="h-4 w-4" />}
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
