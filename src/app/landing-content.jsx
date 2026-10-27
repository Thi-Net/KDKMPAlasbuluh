"use client";
import { useEffect, useRef, useState } from "react";
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
  { icon: "leaf", title: "Produk UMKM Alasbuluh", desc: "Hasil olahan dan tani warga desa ditampilkan dengan lencana khusus \"Produk Lokal Alasbuluh\"." },
  { icon: "truck", title: "Delivery Order Dusun", desc: "Pesan online, kurir gerai mengantar ke rumah di seluruh dusun Desa Alasbuluh. Bayar di tempat (COD)." },
  { icon: "receipt", title: "Laporan Keuangan Transparan", desc: "Setiap transaksi gerai tercatat dan diaudit — wujud tata kelola koperasi yang sehat." }
];

const MANFAAT = [
  "Meningkatkan kesejahteraan masyarakat desa",
  "Menciptakan lapangan kerja warga",
  "Menekan harga di tingkat konsumen",
  "Memperpendek rantai pasok",
  "Meningkatkan inklusi keuangan desa",
  "Menjadi akselerator & agregator UMKM",
  "Menekan pergerakan tengkulak",
  "Menekan tingkat kemiskinan ekstrem"
];

function Counter({ value }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const target = Number(value || 0);
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setDisplay(target); return; }
    const run = () => {
      if (started.current) return;
      started.current = true;
      const dur = 1100; const start = performance.now();
      let raf;
      const tick = (t) => {
        const p = Math.min((t - start) / dur, 1);
        setDisplay(Math.floor(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && run()), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return <span ref={ref}>{display.toLocaleString("id-ID")}</span>;
}

function SectionHead({ eyebrow, title, desc, light }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
      {eyebrow && (
        <p className={`mb-3 text-xs font-bold uppercase tracking-[0.2em] ${light ? "text-koperasi-gold" : "text-koperasi-red"}`}>{eyebrow}</p>
      )}
      <h2 className={`font-heading text-3xl font-bold leading-tight md:text-4xl ${light ? "text-white" : "text-neutral-900"}`}>{title}</h2>
      {desc && <p className={`mt-4 text-base leading-relaxed ${light ? "text-white/75" : "text-neutral-500"}`}>{desc}</p>}
    </div>
  );
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
    { label: "Produk Tersedia", value: stats.products, icon: "box" },
    { label: "Anggota Terdaftar", value: stats.members, icon: "users" },
    { label: "Produk UMKM Lokal", value: stats.umkm, icon: "leaf" },
    { label: "Transaksi Terlayani", value: stats.orders, icon: "receipt" }
  ];

  return (
    <div>
      {/* ============ HERO FULL-BLEED (ala simkopdes) ============ */}
      <section className="relative flex min-h-[560px] w-full flex-col overflow-hidden bg-gradient-to-b from-koperasi-darkred via-koperasi-red to-[#8E1B1B] md:min-h-[680px]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0 2px, transparent 2px 22px)" }} />
        <div aria-hidden="true" className="absolute -right-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-koperasi-gold/15 blur-3xl" />
        <div aria-hidden="true" className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-[#121212] from-[12%] via-[#121212]/70 via-[45%] to-transparent" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-4 pb-10 pt-24 md:px-6 md:pb-16">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[560px] text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-koperasi-gold md:text-sm">
                Koperasi Desa/Kelurahan Merah Putih
              </p>
              <h1 className="mt-2 font-heading text-4xl font-bold leading-[1.1] md:text-6xl">
                {hero.title || FALLBACK_HERO.title}
              </h1>
              <p className="mt-3 font-heading text-lg font-semibold text-koperasi-gold md:text-2xl">
                {hero.subtitle || FALLBACK_HERO.subtitle}
              </p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
                {hero.body || FALLBACK_HERO.body}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/katalog" className="inline-flex items-center gap-2 rounded-[10px] bg-koperasi-gold px-5 py-3 text-sm font-bold text-neutral-900 shadow-[0_10px_30px_rgba(249,168,37,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 md:px-6 md:text-base">
                  <Icon name="cart" className="h-5 w-5" /> Belanja di Gerai
                  <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
                <Link href="/register" className="inline-flex items-center gap-2 rounded-[10px] bg-white px-5 py-3 text-sm font-bold text-[#121212] transition-colors duration-200 hover:bg-white/90 md:px-6 md:text-base">
                  Daftar Keanggotaan Koperasi <Icon name="arrowRight" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* statistik overlay hero (ala simkopdes) */}
          <div className="mt-12 grid grid-cols-2 gap-4 border-t border-white/15 pt-6 sm:grid-cols-4 md:mt-16">
            {statItems.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-koperasi-gold ring-1 ring-white/15">
                  <Icon name={s.icon} className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-heading text-2xl font-bold leading-none text-white md:text-3xl">
                    {dbError ? "—" : <Counter value={s.value} />}
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-white/60 md:text-xs">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {dbError && (
        <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-amber-300 bg-amber-50 p-5 text-center text-sm text-amber-900 shadow-[var(--shadow-md)]">
          <b>Database belum terhubung.</b> Statistik & katalog live akan tampil otomatis setelah database dikonfigurasi.
        </div>
      )}

      {/* ============ UNIT USAHA & LAYANAN ============ */}
      <section id="gerai" className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHead
            eyebrow="Unit Usaha Gerai"
            title="Melayani Kebutuhan Warga, Membangun Ekonomi Desa"
            desc="Empat pilar layanan Koperasi Desa Merah Putih Alasbuluh yang dikelola secara profesional dan transparan."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {LAYANAN.map((s, i) => (
              <div key={s.title} className="group rounded-2xl bg-[#F2F3F7] p-7 transition-all duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_45px_rgba(198,40,40,0.12)] hover:ring-1 hover:ring-koperasi-red/15">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-koperasi-red text-white shadow-[0_10px_25px_rgba(198,40,40,0.3)] transition-transform duration-200 group-hover:scale-105">
                  <Icon name={s.icon} className="h-7 w-7" />
                </div>
                <h3 className="font-heading text-lg font-bold text-neutral-900">{s.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-neutral-500">{s.desc}</p>
                <div className="mt-4 text-xs font-bold text-koperasi-red">0{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PROFIL / VISI MISI ============ */}
      <section id="profil" className="bg-[#F5F6F6] py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHead
            eyebrow="Profil Koperasi"
            title="Berbadan Hukum, Dikelola Modern, Dipercaya Warga"
          />
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl bg-koperasi-red p-8 text-white shadow-[0_20px_50px_rgba(198,40,40,0.25)] md:p-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-koperasi-gold">
                <Icon name="store" className="h-3.5 w-3.5" /> Tentang Kami
              </div>
              <p className="text-base leading-relaxed text-white/90 md:text-lg">
                {(cms.about_koperasi?.body) || "Koperasi Desa Merah Putih Alasbuluh adalah koperasi desa di Kecamatan Wongsorejo, Kabupaten Banyuwangi, yang mengelola Unit Usaha Gerai kebutuhan pokok, menampung produk UMKM warga, serta melayani delivery order ke seluruh dusun di Desa Alasbuluh. Berbadan hukum koperasi, kami berkomitmen membangun ekonomi desa secara gotong royong."}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/15 pt-6 text-sm">
                <div>
                  <div className="font-heading text-2xl font-bold text-koperasi-gold"><Counter value={stats.members ?? 1} /></div>
                  <div className="text-white/60">Anggota Terdaftar</div>
                </div>
                <div>
                  <div className="font-heading text-2xl font-bold text-koperasi-gold"><Counter value={stats.products ?? 0} /></div>
                  <div className="text-white/60">Produk Gerai</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-8 shadow-[var(--shadow-md)] md:p-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-koperasi-red/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-koperasi-red">
                <Icon name="check" className="h-3.5 w-3.5" /> Visi & Misi
              </div>
              <p className="text-sm leading-relaxed text-neutral-600 md:text-base">
                <b className="text-koperasi-red">Visi:</b> {(cms.about_koperasi?.vision) || "Menjadi koperasi desa yang kuat, modern, dan mandiri — motor penggerak ekonomi warga Desa Alasbuluh."}
              </p>
              <p className="mb-3 mt-6 text-xs font-bold uppercase tracking-wider text-neutral-400">Misi Kami</p>
              <ul className="flex flex-col gap-3">
                {MISI.map((m) => (
                  <li key={m} className="flex items-start gap-3 text-sm leading-relaxed text-neutral-600">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-koperasi-gold/20 text-koperasi-red">
                      <Icon name="check" className="h-3 w-3" />
                    </span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MANFAAT KOPERASI (ala 13 manfaat simkopdes) ============ */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHead
            eyebrow="Manfaat Koperasi Desa"
            title="Manfaat Nyata bagi Warga Alasbuluh"
            desc="Kehadiran koperasi desa membawa dampak ekonomi langsung bagi seluruh warga desa."
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {MANFAAT.map((m, i) => (
              <div key={m} className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-[#F2F3F7] px-5 py-4 transition-colors duration-200 hover:border-koperasi-red/30 hover:bg-white">
                <span className="font-heading text-xl font-bold text-koperasi-red/25">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm font-medium leading-snug text-neutral-700">{m}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PENGURUS ============ */}
      <section className="bg-[#F5F6F6] py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHead
            eyebrow="Struktur Organisasi"
            title="Pengurus & Manajemen"
            desc="Aparat koperasi yang bertanggung jawab atas tata kelola & operasional gerai."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(board.length ? board : [
              { name: "Ketua Pengurus", role: "Ketua Koperasi" },
              { name: "Sekretaris", role: "Pengurus Harian" },
              { name: "Bendahara", role: "Pengurus Harian" },
              { name: "Manajer Unit Gerai", role: "Manajer Usaha" }
            ]).map((p) => (
              <div key={p.name} className="group rounded-2xl bg-white p-7 text-center shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-koperasi-red to-koperasi-darkred font-heading text-2xl font-bold text-white shadow-[0_12px_30px_rgba(198,40,40,0.3)] ring-4 ring-koperasi-gold/30">
                  {(p.name || "?")[0]}
                </div>
                <div className="font-heading font-bold text-neutral-900">{p.name}</div>
                <div className="mt-1.5 inline-block rounded-full bg-koperasi-gold/15 px-3 py-1 text-xs font-bold text-amber-800">{p.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ETALASE PRODUK LIVE ============ */}
      <section id="etalase" className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
            <div className="max-w-xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-koperasi-red">Etalase Gerai</p>
              <h2 className="font-heading text-3xl font-bold leading-tight text-neutral-900 md:text-4xl">Katalog Produk — Belanja Langsung</h2>
              <p className="mt-3 text-base text-neutral-500">Produk gerai yang aktif dan berstok, diperbarui langsung dari sistem koperasi.</p>
            </div>
            <Link href="/katalog" className="inline-flex items-center gap-2 rounded-[10px] bg-koperasi-red px-5 py-3 text-sm font-bold text-white shadow-[0_10px_25px_rgba(198,40,40,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-koperasi-darkred">
              Lihat Semua Produk <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
          {products.length === 0 ? (
            <div className="rounded-2xl bg-[#F2F3F7] p-10 text-center text-sm text-neutral-400">
              Katalog belum tersedia — database belum terhubung atau belum ada produk aktif.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {products.map((p) => (
                <Link key={p.id} href="/katalog" className="group overflow-hidden rounded-2xl bg-[#F2F3F7] transition-all duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_45px_rgba(0,0,0,0.1)]">
                  <div className="relative flex h-32 items-center justify-center bg-white text-neutral-200 transition-colors duration-200 group-hover:text-koperasi-red/20">
                    <Icon name="box" className="h-12 w-12" />
                    {p.is_local_alasbuluh && (
                      <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-koperasi-red px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
                        <Icon name="leaf" className="h-3 w-3" /> UMKM Lokal
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-sm font-bold leading-snug text-neutral-900">{p.name}</div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="font-heading text-lg font-bold text-koperasi-red">{fmtRp(p.selling_price)}</span>
                    </div>
                    <div className={`mt-0.5 text-xs ${p.current_stock > 0 ? "text-neutral-400" : "font-bold text-red-500"}`}>
                      {p.current_stock > 0 ? `Tersedia ${p.current_stock} ${p.unit || "pcs"}` : "Stok Habis"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ BANNER ANDROID + INFO GERAI (ala CTA mobile simkopdes) ============ */}
      <section className="bg-[#121212] py-16 text-white md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-koperasi-gold">Segera Hadir</p>
              <h2 className="font-heading text-3xl font-bold leading-tight md:text-4xl">Pusat Informasi Digital untuk Anggota Koperasi</h2>
              <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-white/70">
                Aplikasi Android Koperasi Merah Putih sedang dikembangkan — pantau catatan belanja, cek status pesanan,
                dan akses pengumuman resmi koperasi kapan saja langsung dari genggaman. Sementara ini semua layanan tersedia melalui website resmi ini.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold">
                  <Icon name="phone" className="h-5 w-5 text-koperasi-gold" /> Android App · Tahap 2
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold">
                  <Icon name="check" className="h-5 w-5 text-koperasi-gold" /> Website Aktif Sekarang
                </span>
              </div>
            </div>
            <div className="rounded-2xl bg-white/5 p-8 ring-1 ring-white/10">
              <div className="mb-4 flex items-center gap-2 font-heading text-lg font-bold">
                <Icon name="pin" className="h-5 w-5 text-koperasi-gold" /> Lokasi & Jam Operasional Gerai
              </div>
              <div className="flex flex-col gap-3.5 text-sm">
                <div className="flex items-start gap-3 text-white/80"><Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-koperasi-gold" /> Gerai Koperasi, Desa Alasbuluh, Kec. Wongsorejo, Kab. Banyuwangi</div>
                <div className="flex items-start gap-3 text-white/80"><Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-koperasi-gold" /> Senin–Sabtu 07.30–20.00 · Minggu 08.00–14.00 WIB</div>
                <div className="flex items-start gap-3 text-white/80"><Icon name="truck" className="mt-0.5 h-4 w-4 shrink-0 text-koperasi-gold" /> Delivery ke seluruh dusun Desa Alasbuluh (ongkir Rp 2.000–5.000)</div>
                <div className="flex items-start gap-3 text-white/80"><Icon name="cash" className="mt-0.5 h-4 w-4 shrink-0 text-koperasi-gold" /> Pembayaran COD — QRIS Segera Hadir</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA AKHIR ============ */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-koperasi-red to-koperasi-darkred p-10 text-center text-white shadow-[0_30px_70px_rgba(198,40,40,0.3)] md:p-14">
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-2 bg-koperasi-gold" />
            <div aria-hidden="true" className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-koperasi-gold/20 blur-3xl" />
            <h2 className="relative font-heading text-3xl font-bold md:text-4xl">Warga Alasbuluh, Ayo Jadi Anggota!</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-base text-white/85">
              Daftar sebagai anggota koperasi, kumpulkan poin belanja SHU, dan nikmati harga koperasi serta layanan delivery ke rumah.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/register" className="rounded-[10px] bg-koperasi-gold px-7 py-3.5 text-base font-bold text-neutral-900 shadow-[0_10px_30px_rgba(249,168,37,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105">Daftar Anggota Sekarang</Link>
              <Link href="/katalog" className="rounded-[10px] border-2 border-white/70 px-7 py-3.5 text-base font-bold text-white transition-colors duration-200 hover:bg-white/10">Mulai Belanja</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
