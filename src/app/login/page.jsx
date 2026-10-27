"use client";
import { Suspense } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KoperasiLogo, Icon } from "@/components/Icon";

const DEMO = [
  { label: "Masuk sebagai Admin", id: "admin", hint: "admin / admin123" },
  { label: "Masuk sebagai Karyawan", id: "employee", hint: "karyawan / karyawan123" },
  { label: "Masuk sebagai Customer", id: "customer", hint: "customer / customer123" }
];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

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
    <main className="flex min-h-screen items-center justify-center bg-koperasi-red/5 px-4 py-10">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[var(--shadow-md)]">
            <KoperasiLogo size={52} />
          </div>
          <h1 className="font-heading text-xl font-bold">Login Sistem Koperasi</h1>
          <p className="text-sm text-neutral-500">Koperasi Desa Merah Putih Alasbuluh</p>
        </div>
        {err && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</div>}
        <form onSubmit={(e) => { e.preventDefault(); doLogin(identifier, password); }}>
          <label className="label">Nomor HP / Username</label>
          <input className="input mb-3" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="cth: 0812xxxxxxxx / admin" required />
          <label className="label">Password</label>
          <input className="input mb-4" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Memproses…" : "Masuk"}</button>
        </form>
        <p className="mt-4 text-center text-sm">
          Belum punya akun? <Link href="/register" className="font-semibold text-koperasi-red hover:underline">Daftar Warga</Link> · <Link href="/" className="hover:underline">← Beranda</Link>
        </p>
        <div className="mt-6 border-t pt-4">
          <div className="mb-2 text-center text-xs font-semibold text-neutral-400">AKUN DEMO (CEPAT UJI)</div>
        <div className="grid gap-2">
            {DEMO.map((d) => (
              <button key={d.id} className="btn-outline w-full text-xs" disabled={busy}
                onClick={() => doLogin(d.hint.split(" / ")[0], d.hint.split(" / ")[1])}>
                <Icon name="user" className="h-4 w-4" /> {d.label} ({d.hint})
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center text-sm text-neutral-500">Memuat…</main>}>
      <LoginForm />
    </Suspense>
  );
}
