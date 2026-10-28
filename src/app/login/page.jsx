"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KoperasiLogo, Icon } from "@/components/Icon";

const DEMO = [
  { role: "Admin", id: "admin", pw: "admin123", desc: "Kelola gerai & laporan", icon: "lock" },
  { role: "Karyawan", id: "karyawan", pw: "karyawan123", desc: "Kasir, kirim, opname", icon: "truck" },
  { role: "Customer", id: "customer", pw: "customer123", desc: "Belanja & lacak pesanan", icon: "cart" }
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const doLogin = async (id, pw) => {
    setBusy(true); setErr("");
    const res = await fetch("/api/v1/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: id, password: pw })
    });
    const json = await res.json();
    setBusy(false);
    if (!json.success) { setErr(json.error || "Gagal login."); return; }
    const next = params.get("next");
    router.push(next || json.data.redirect);
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Panel kiri: identitas koperasi */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-koperasi-darkred via-koperasi-red to-[#E0574F] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "repeating-linear-gradient(45deg,#fff 0 2px,transparent 2px 24px)" }} />
        <div aria-hidden="true" className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-koperasi-gold/20 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg"><KoperasiLogo size={36} /></span>
          <span className="font-heading text-lg font-extrabold leading-tight">Koperasi Desa<br />Merah Putih</span>
        </Link>
        <div className="relative max-w-md">
          <h1 className="font-heading text-4xl font-extrabold leading-tight">Satu akun untuk seluruh layanan gerai.</h1>
          <p className="mt-4 text-white/80">Belanja kebutuhan pokok, pantau pesanan, kelola stok, dan lihat laporan keuangan koperasi — semuanya dalam satu platform digital.</p>
          <div className="mt-8 grid gap-3">
            {[["shopping cart", "Belanja online, antar ke dusun"], ["receipt", "Laporan keuangan transparan"], ["truck", "COD & ambil di gerai"]].map(([t, d]) => (
              <div key={t} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
                <Icon name="check" className="h-4 w-4 shrink-0 text-koperasi-gold" /><span className="text-sm font-semibold">{d}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/50">Desa Alasbuluh · Kec. Wongsorejo · Kab. Banyuwangi</p>
      </section>

      {/* Panel kanan: form */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-md"><KoperasiLogo size={32} /></span>
              <span className="font-heading text-base font-extrabold leading-tight text-neutral-900">Koperasi Desa<br />Merah Putih</span>
            </Link>
          </div>

          <h2 className="font-heading text-2xl font-extrabold text-neutral-900">Masuk ke akun Anda</h2>
          <p className="mt-1.5 text-sm text-neutral-500">Gunakan nomor HP atau username yang terdaftar.</p>

          {err && (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-red-50 p-3.5 text-sm font-semibold text-red-700">
              <Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0" /> {err}
            </div>
          )}

          <form className="mt-6" onSubmit={(e) => { e.preventDefault(); doLogin(identifier, password); }}>
            <label className="label" htmlFor="identifier">Nomor HP / Username</label>
            <input id="identifier" className="input mb-4" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="cth: 0812xxxxxxxx atau admin" required autoComplete="username" />
            <label className="label" htmlFor="password">Password</label>
            <div className="relative mb-5">
              <input id="password" className="input pr-12" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-2 text-[11px] font-bold text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800">
                {showPw ? "SEMBUNYI" : "LIHAT"}
              </button>
            </div>
            <button className="btn-primary w-full" disabled={busy}>{busy ? "Memproses…" : "Masuk"}</button>
          </form>

          <p className="mt-5 text-center text-sm text-neutral-500">
            Belum punya akun? <Link href="/register" className="font-bold text-koperasi-red hover:underline">Daftar Warga</Link>
          </p>

          <div className="mt-8">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-neutral-200" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Akun demo</span>
              <span className="h-px flex-1 bg-neutral-200" />
            </div>
            <div className="grid gap-2">
              {DEMO.map((dm) => (
                <button key={dm.id} disabled={busy} onClick={() => doLogin(dm.id, dm.pw)}
                  className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-koperasi-red/40 hover:shadow-md disabled:opacity-50">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-koperasi-red/8 text-koperasi-red"><Icon name={dm.icon} className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-neutral-900">{dm.role}</span>
                    <span className="block text-[11px] text-neutral-400">{dm.desc}</span>
                  </span>
                  <Icon name="arrowRight" className="h-4 w-4 shrink-0 text-neutral-300 transition-colors group-hover:text-koperasi-red" />
                </button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-neutral-400"><Link href="/" className="hover:text-koperasi-red">← Kembali ke beranda</Link></p>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center text-sm text-neutral-400">Memuat…</main>}>
      <LoginForm />
    </Suspense>
  );
}
