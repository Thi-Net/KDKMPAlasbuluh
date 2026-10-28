"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KoperasiLogo, Icon } from "@/components/Icon";

export default function RegisterPage() {
  const router = useRouter();
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", password: "", dusun_zone_id: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    fetch("/api/v1/dusun").then((r) => r.json()).then((j) => { if (j.success) setZones(j.data); }).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    const res = await fetch("/api/v1/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form)
    });
    const json = await res.json();
    setBusy(false);
    if (!json.success) { setErr(json.error || "Gagal mendaftar."); return; }
    router.push("/katalog");
  };

  const filled = form.name && form.phone && form.dusun_zone_id;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10">
      <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1fr] lg:items-center">
        <div className="hidden lg:block">
          <Link href="/" className="mb-8 flex items-center gap-2.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-md"><KoperasiLogo size={32} /></span>
            <span className="font-heading text-base font-extrabold leading-tight text-neutral-900">Koperasi Desa<br />Merah Putih</span>
          </Link>
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-neutral-900">Jadi anggota koperasi desa, nikmati harga & layanan warga.</h1>
          <div className="mt-6 space-y-2.5">
            {["Harga koperasi untuk kebutuhan pokok", "Delivery ke seluruh dusun Alasbuluh", "Dapat SHU dari belanja Anda", "Bayar di tempat (COD) — tanpa aplikasi tambahan"].map((b) => (
              <div key={b} className="flex items-start gap-2.5 text-sm text-neutral-600">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-koperasi-gold/20 text-koperasi-red"><Icon name="check" className="h-3 w-3" /></span>
                {b}
              </div>
            ))}
          </div>
        </div>

        <div className="card card-pad shadow-[var(--shadow-lg)]">
          <div className="mb-5 flex items-center gap-2 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow"><KoperasiLogo size={28} /></span>
            <span className="font-heading text-sm font-extrabold leading-tight">Koperasi Desa Merah Putih</span>
          </div>
          <h2 className="font-heading text-2xl font-extrabold text-neutral-900">Daftar Akun Warga</h2>
          <p className="mt-1 text-sm text-neutral-500">Gratis, cukup 4 data. Langsung bisa belanja.</p>

          {err && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3.5 text-sm font-semibold text-red-700">
              <Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0" /> {err}
            </div>
          )}

          <form className="mt-5" onSubmit={submit}>
            <label className="label" htmlFor="name">Nama Lengkap</label>
            <input id="name" className="input mb-3.5" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="cth: Siti Aminah" autoComplete="name" />
            <label className="label" htmlFor="phone">Nomor HP / WhatsApp</label>
            <input id="phone" className="input mb-3.5" required inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" autoComplete="tel" />
            <label className="label" htmlFor="dusun">Dusun Domisili</label>
            <select id="dusun" className="input mb-3.5" required value={form.dusun_zone_id} onChange={(e) => setForm({ ...form, dusun_zone_id: e.target.value })}>
              <option value="">— Pilih Dusun —</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.dusun_name}</option>)}
            </select>
            <label className="label" htmlFor="pw">Password</label>
            <input id="pw" className="input mb-5" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 6 karakter" autoComplete="new-password" />
            <button className="btn-primary w-full" disabled={busy || !filled}>{busy ? "Mendaftarkan…" : "Daftar Sekarang"}</button>
          </form>

          <p className="mt-5 text-center text-sm text-neutral-500">
            Sudah punya akun? <Link href="/login" className="font-bold text-koperasi-red hover:underline">Masuk</Link>
          </p>
          <p className="mt-3 text-center text-xs text-neutral-400"><Link href="/" className="hover:text-koperasi-red">← Kembali ke beranda</Link></p>
        </div>
      </div>
    </main>
  );
}
