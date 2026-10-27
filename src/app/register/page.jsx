"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", password: "", dusun_zone_id: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

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
    if (!json.success) { setErr(json.error); return; }
    router.push("/katalog");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-koperasi-red/5 px-4 py-10">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-xl font-bold">Daftar Akun Warga</h1>
        <p className="mb-5 text-sm text-neutral-500">Koperasi Desa Merah Putih Alasbuluh</p>
        {err && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</div>}
        <form onSubmit={submit}>
          <label className="label">Nama Lengkap</label>
          <input className="input mb-3" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label className="label">Nomor HP / WhatsApp</label>
          <input className="input mb-3" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" />
          <label className="label">Dusun Domisili</label>
          <select className="input mb-3" required value={form.dusun_zone_id} onChange={(e) => setForm({ ...form, dusun_zone_id: e.target.value })}>
            <option value="">— Pilih Dusun —</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.dusun_name}</option>)}
          </select>
          <label className="label">Password</label>
          <input className="input mb-4" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Mendaftarkan…" : "Daftar Sekarang"}</button>
        </form>
        <p className="mt-4 text-center text-sm">
          Sudah punya akun? <Link href="/login" className="font-semibold text-koperasi-red hover:underline">Masuk</Link>
        </p>
      </div>
    </main>
  );
}
