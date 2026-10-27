import Link from "next/link";
import { LandingContent } from "./landing-content";
import { KoperasiLogo, Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "#profil", label: "Profil Koperasi" },
  { href: "#gerai", label: "Unit Usaha Gerai" },
  { href: "#etalase", label: "Katalog Belanja" },
  { href: "#pesanan", label: "Cek Pesanan" }
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-koperasi-darkred/95 text-white shadow-lg backdrop-blur supports-[backdrop-filter]:bg-koperasi-darkred/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <KoperasiLogo size={44} />
            <div className="leading-tight">
              <div className="font-heading text-sm font-bold sm:text-base">Koperasi Desa Merah Putih</div>
              <div className="text-[11px] font-medium text-koperasi-cream">Desa Alasbuluh · Kec. Wongsorejo · Kab. Banyuwangi</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-semibold md:flex" aria-label="Navigasi utama">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="transition-colors duration-200 hover:text-koperasi-gold">{n.label}</a>
            ))}
          </nav>
          <Link href="/login" className="btn-gold text-sm">
            <Icon name="user" className="h-4 w-4" /> Masuk
          </Link>
        </div>
      </header>

      <LandingContent />

      <footer id="pesanan" className="mt-16 bg-koperasi-darkred text-white">
        <div className="flag-stripe" aria-hidden="true" />
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <KoperasiLogo size={36} />
              <div className="font-heading font-bold">Koperasi Desa Merah Putih Alasbuluh</div>
            </div>
            <p className="text-sm text-koperasi-cream">
              Gerai Desa Alasbuluh, Kecamatan Wongsorejo, Kabupaten Banyuwangi, Jawa Timur.
              Melayani warga dengan harga koperasi dan semangat gotong royong.
            </p>
          </div>
          <div>
            <div className="mb-3 font-heading font-bold">Layanan Digital</div>
            <div className="flex flex-col gap-2 text-sm text-koperasi-cream">
              <Link href="/katalog" className="flex items-center gap-2 transition-colors hover:text-koperasi-gold"><Icon name="store" className="h-4 w-4" /> Katalog Belanja Gerai</Link>
              <Link href="/pesanan" className="flex items-center gap-2 transition-colors hover:text-koperasi-gold"><Icon name="truck" className="h-4 w-4" /> Cek & Lacak Pesanan</Link>
              <Link href="/register" className="flex items-center gap-2 transition-colors hover:text-koperasi-gold"><Icon name="users" className="h-4 w-4" /> Daftar Anggota Koperasi</Link>
              <Link href="/login" className="flex items-center gap-2 transition-colors hover:text-koperasi-gold"><Icon name="lock" className="h-4 w-4" /> Login Sistem Internal</Link>
            </div>
          </div>
          <div>
            <div className="mb-3 font-heading font-bold">Informasi Gerai</div>
            <div className="flex flex-col gap-2 text-sm text-koperasi-cream">
              <div className="flex items-start gap-2"><Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0" /> Senin–Sabtu 07.30–20.00 · Minggu 08.00–14.00 WIB</div>
              <div className="flex items-start gap-2"><Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0" /> Jl. Desa Alasbuluh, Wongsorejo, Banyuwangi</div>
              <div className="flex items-start gap-2"><Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0" /> WhatsApp CS Gerai: 0810-0000-0001</div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/20 px-4 py-4 text-center text-xs text-koperasi-cream">
          © {new Date().getFullYear()} Koperasi Desa Merah Putih Alasbuluh — Membangun Ekonomi Desa Bersama. Berbadan Hukum Koperasi.
        </div>
      </footer>
    </main>
  );
}
