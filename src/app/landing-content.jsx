"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fmtRp } from "@/components/util";
import { Icon, KoperasiLogo } from "@/components/Icon";

const FALLBACK_HERO = {
  title: "Koperasi Desa Merah Putih",
  subtitle: "Desa Alasbuluh, Kec. Wongsorejo, Kab. Banyuwangi",
  body: "Meningkatkan taraf ekonomi warga melalui gerai kebutuhan pokok, produk UMKM lokal, dan layanan pemasokan desa yang transparan, modern, dan berbadan hukum koperasi."
};

const MISI = [
  "Menyediakan kebutuhan pokok warga dengan harga koperasi yang terjangkau.",
  "Memberi panggung bagi produk UMKM dan hasil bumi warga Desa Alasbuluh.",
  "Mengelola keuangan koperasi secara transparan, tercatat, dan teraudit.",
  "Membangun layanan digital agar warga mudah berbelanja dan memantau pesanan."
];

const LAYANAN = [
  { icon: "store", title: "Gerai Kebutuhan Pokok", desc: "Sembako, minuman, gas & galon, dan ATK dengan harga koperasi untuk seluruh warga." },
  { icon: "leaf", title: "Produk UMKM Alasbuluh", desc: "Hasil olahan dan tani warga desa ditampilkan dengan lencana khusus \"Bangga UMKM Alasbuluh\"." },
  { icon: "truck", title: "Delivery Order Dusun", desc: "Pesan online, kurir gerai mengantar ke rumah di seluruh dusun Desa Alasbuluh. Bayar di tempat (COD)." },
  { icon: "receipt", title: "Laporan Keuangan Transparan", desc: "Setiap transaksi gerai tercatat dan diaudit — wujud tata kelola koperasi yang sehat." }
];

function Counter({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = Number(value || 0);
    if (!target) { setDisplay(0); return; }
    const dur = 900; const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min((t - start) / dur, 1);
      setDisplay(Math.floor(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{display}</>;
}

export function LandingContent() {
  const [data, setData] = useState(null);
  const [dbError, setDbError] = useState(false);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/v1/cms").then((r) => r.json()).then((j) => { if (j.success) setData(j.data); else setDbError(true); }).catch(() => setDbError(true));
    fetch("/api/v1/products").then((r) => r.json()).then((j) => { if (j.success) setProducts((j.data || []).slice(0, 8)); }).catch(() => {});
  }, []);

  const cms = data?.cms || {};
  const stats = data?.stats || {};
  const hero = cms.hero || {};
  const board = cms.board_members?.list || [];

  const statItems = [
    { label: "Produk Tersedia di Gerai", value: stats.products, icon: "box" },
    { label: "Anggota Terdaftar", value: stats.members, icon: "users" },
    { label: "Produk UMKM Lokal", value: stats.umkm, icon: "leaf" },
    { label: "Transaksi Terlayani", value: stats.orders, icon: "receipt" }
  ];

  return (
    <div>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-koperasi-red text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0 2px, transparent 2px 18px)" }} />
        <div aria-hidden="true" className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-koperasi-gold/20 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1.2fr_0.8fr] md:py-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-koperasi-gold px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-neutral-900 shadow-[var(--shadow-md)]">
              <Icon name="check" className="h-4 w-4" /> Berbadan Hukum Koperasi · Resmi & Terdaftar
            </p>
            <h1 className="font-heading text-3xl font-bold leading-tight sm:text-5xl">
              {hero.title || FALLBACK_HERO.title}
              <span className="mt-2 block text-xl font-semibold text-koperasi-gold sm:text-3xl">
                {hero.subtitle || FALLBACK_HERO.subtitle}
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-koperasi-cream sm:text-lg">
              {hero.body || FALLBACK_HERO.body}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/katalog" className="btn-gold px-7 py-3.5 text-base">
                <Icon name="cart" className="h-5 w-5" /> Belanja di Gerai
              </Link>
              <Link href="/login" className="btn border-2 border-white bg-white/10 px-7 py-3.5 text-base text-white transition-all duration-200 hover:-translate-y-px hover:bg-white/20">
                <Icon name="lock" className="h-5 w-5" /> Login Sistem
              </Link>
            </div>
          </div>
          {/* Motif bendera Merah Putih */}
          <div className="hidden justify-center md:flex" aria-hidden="true">
            <svg width="260" height="300" viewBox="0 0 260 300" className="drop-shadow-[0_20px_25px_rgba(0,0,0,0.3)]">
              <rect x="60" y="10" width="120" height="80" rx="6" fill="#FFFFFF" />
              <path d="M60 16a6 6 0 0 1 6-6h108a6 6 0 0 1 6 6v64H60V16Z" fill="#C62828" />
              <rect x="60" y="90" width="120" height="40" rx="6" fill="#FFFFFF" />
              <rect x="55" y="10" width="6" height="280" fill="#8E1B1B" />
              <rect x="58" y="10" width="3" height="280" fill="#F9A825" />
              <text x="200" y="60" fontFamily="Rubik, sans-serif" fontSize="14" fontWeight="700" fill="#FFFFFF" opacity="0.9">MERAH PUTIH</text>
              <text x="200" y="80" fontFamily="Rubik, sans-serif" fontSize="10" fill="#F9A825">GERAI ALASBULUH</text>
            </svg>
          </div>
        </div>
        {/* Gelombang pemisah */}
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="block h-10 w-full text-neutral-50" aria-hidden="true">
          <path d="M0 60h1440V25c-180 25-360 35-720 15S90 18 0 32v28Z" fill="currentColor" />
        </svg>
      </section>

      {dbError && (
        <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-amber-300 bg-amber-50 p-5 text-center text-sm text-amber-900 shadow-[var(--shadow-md)]">
          <b>Database belum terhubung.</b> Jalankan <code className="rounded bg-amber-100 px-1">supabase/schema.sql</code> dan <code className="rounded bg-amber-100 px-1">supabase/seed.sql</code> di Supabase SQL Editor, lalu set <code className="rounded bg-amber-100 px-1">DATABASE_URL</code> di Vercel. Statistik & katalog live akan tampil otomatis setelahnya.
        </div>
      )}

      {/* ============ STATISTIK TRANSPARANSI ============ */}
      <section className="mx-auto -mt-2 max-w-5xl px-4 pt-4">
        <div className="card grid grid-cols-2 gap-6 p-8 md:grid-cols-4">
          {statItems.map((s) => (
            <div key={s.label} className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-koperasi-red/10 text-koperasi-red">
                <Icon name={s.icon} className="h-6 w-6" />
              </div>
              <div className="font-heading text-3xl font-bold text-koperasi-red">
                {dbError ? "—" : <Counter value={s.value} />}
              </div>
              <div className="mt-1 text-xs font-medium text-neutral-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ LAYANAN / UNIT USAHA ============ */}
      <section id="gerai" className="mx-auto mt-16 max-w-6xl px-4">
        <div className="mb-6 text-center">
          <h2 className="font-heading text-2xl font-bold text-koperasi-red sm:text-3xl">Unit Usaha & Layanan Gerai</h2>
          <p className="mt-2 text-sm text-neutral-500">Empat pilar layanan Koperasi Desa Merah Putih Alasbuluh</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LAYANAN.map((s) => (
            <div key={s.title} className="card card-hover p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-koperasi-red text-white shadow-[var(--shadow-md)]">
                <Icon name={s.icon} className="h-6 w-6" />
              </div>
              <h3 className="font-heading text-base font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ PROFIL / VISI MISI ============ */}
      <section id="profil" className="mt-16 bg-white py-16 shadow-[var(--shadow-sm)]">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-heading text-2xl font-bold text-koperasi-red sm:text-3xl">Profil Koperasi</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="card p-7">
              <div className="mb-3 flex items-center gap-2 text-koperasi-red">
                <Icon name="store" className="h-5 w-5" />
                <h3 className="font-heading font-bold">Tentang Kami</h3>
              </div>
              <p className="text-sm leading-relaxed text-neutral-600">
                {(cms.about_koperasi?.body) || "Koperasi Desa Merah Putih Alasbuluh adalah koperasi desa di Kecamatan Wongsorejo, Kabupaten Banyuwangi, yang mengelola Unit Usaha Gerai kebutuhan pokok, menampung produk UMKM warga, serta melayani delivery order ke seluruh dusun di Desa Alasbuluh. Berbadan hukum koperasi, kami berkomitmen membangun ekonomi desa secara gotong royong."}
              </p>
            </div>
            <div className="card p-7">
              <div className="mb-3 flex items-center gap-2 text-koperasi-red">
                <Icon name="check" className="h-5 w-5" />
                <h3 className="font-heading font-bold">Visi & Misi</h3>
              </div>
              <p className="text-sm leading-relaxed text-neutral-600">
                <b className="text-koperasi-red">Visi:</b> {(cms.about_koperasi?.vision) || "Menjadi koperasi desa yang kuat, modern, dan mandiri — motor penggerak ekonomi warga Desa Alasbuluh."}
              </p>
              <p className="mb-2 mt-4 text-sm font-bold text-koperasi-red">Misi:</p>
              <ul className="flex flex-col gap-1.5 text-sm text-neutral-600">
                {MISI.map((m) => (
                  <li key={m} className="flex items-start gap-2">
                    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-koperasi-gold" /> {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ PENGURUS ============ */}
      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="mb-6 text-center">
          <h2 className="font-heading text-2xl font-bold text-koperasi-red sm:text-3xl">Struktur Pengurus</h2>
          <p className="mt-2 text-sm text-neutral-500">Aparat koperasi yang bertanggung jawab atas tata kelola & operasional gerai</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(board.length ? board : [
            { name: "Ketua Pengurus", role: "Ketua Koperasi" },
            { name: "Sekretaris", role: "Pengurus Harian" },
            { name: "Bendahara", role: "Pengurus Harian" },
            { name: "Manajer Unit Gerai", role: "Manajer Usaha" }
          ]).map((p) => (
            <div key={p.name} className="card card-hover p-6 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-koperasi-red to-koperasi-darkred font-heading text-xl font-bold text-white shadow-[var(--shadow-md)]">
                {(p.name || "?")[0]}
              </div>
              <div className="font-heading font-semibold">{p.name}</div>
              <div className="mt-1 inline-block rounded-full bg-koperasi-gold/15 px-3 py-0.5 text-xs font-semibold text-amber-800">{p.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ ETALASE PRODUK LIVE ============ */}
      <section id="etalase" className="mt-16 bg-koperasi-cream py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl font-bold text-koperasi-red sm:text-3xl">Etalase Gerai — Belanja Langsung</h2>
              <p className="mt-2 text-sm text-neutral-600">Katalog produk gerai yang aktif dan berstok, diperbarui langsung dari sistem koperasi.</p>
            </div>
            <Link href="/katalog" className="btn-primary">
              Lihat Semua Produk <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
          {products.length === 0 ? (
            <div className="card p-8 text-center text-sm text-neutral-500">
              Katalog belum tersedia — database belum terhubung atau belum ada produk aktif.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <div key={p.id} className="card card-hover overflow-hidden">
                  <div className="flex h-28 items-center justify-center bg-white text-neutral-300">
                    <Icon name="box" className="h-10 w-10" />
                  </div>
                  <div className="p-4">
                    <div className="text-sm font-bold leading-tight">{p.name}</div>
                    {p.is_local_alasbuluh && (
                      <span className="badge mt-1.5 bg-koperasi-red text-white">
                        <Icon name="leaf" className="mr-1 h-3 w-3" /> UMKM Alasbuluh
                      </span>
                    )}
                    <div className="mt-2 font-heading text-lg font-bold text-koperasi-red">{fmtRp(p.selling_price)}</div>
                    <div className="text-xs text-neutral-500">{p.current_stock > 0 ? `Tersedia ${p.current_stock} ${p.unit}` : "Stok Habis"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ BANNER ANDROID + INFO GERAI ============ */}
      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card relative overflow-hidden bg-gradient-to-br from-koperasi-red to-koperasi-darkred p-7 text-white">
            <div aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-koperasi-gold/25 blur-2xl" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-koperasi-gold text-neutral-900 shadow-[var(--shadow-md)]">
                <Icon name="phone" className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold">Aplikasi Android Segera Hadir</h3>
                <p className="mt-1 text-sm leading-relaxed text-koperasi-cream">
                  Marketplace Koperasi Merah Putih di genggaman warga Alasbuluh — Tahap 2 dalam pengembangan.
                  Sementara ini, belanja bisa langsung melalui website resmi ini.
                </p>
                <span className="badge mt-3 bg-white/15 text-white">Tahap 2 · Dalam Pengembangan</span>
              </div>
            </div>
          </div>
          <div className="card p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-koperasi-red text-white shadow-[var(--shadow-md)]">
                <Icon name="pin" className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold">Lokasi & Jam Operasional</h3>
                <p className="mt-1 text-sm text-neutral-600">Gerai Koperasi, Desa Alasbuluh, Kec. Wongsorejo, Kab. Banyuwangi.</p>
                <div className="mt-3 flex flex-col gap-1.5 text-sm text-neutral-700">
                  <div className="flex items-center gap-2"><Icon name="clock" className="h-4 w-4 text-koperasi-red" /> Senin–Sabtu 07.30–20.00 · Minggu 08.00–14.00 WIB</div>
                  <div className="flex items-center gap-2"><Icon name="truck" className="h-4 w-4 text-koperasi-red" /> Delivery ke seluruh dusun Desa Alasbuluh (Rp 2.000–5.000)</div>
                  <div className="flex items-center gap-2"><Icon name="cash" className="h-4 w-4 text-koperasi-red" /> Pembayaran COD — QRIS Segera Hadir</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA AKHIR ============ */}
      <section className="mx-auto mt-16 max-w-5xl px-4">
        <div className="card relative overflow-hidden bg-koperasi-red p-10 text-center text-white shadow-[var(--shadow-xl)]">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-koperasi-gold" />
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">Warga Alasbuluh, Ayo Ikut Menjadi Anggota!</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-koperasi-cream">
            Daftar sebagai anggota koperasi, kumpulkan poin belanja SHU, dan nikmati harga koperasi serta layanan delivery ke rumah.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="btn-gold px-7 py-3 text-base">Daftar Anggota Sekarang</Link>
            <Link href="/katalog" className="btn border-2 border-white bg-transparent px-7 py-3 text-base text-white hover:bg-white/10">Mulai Belanja</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
