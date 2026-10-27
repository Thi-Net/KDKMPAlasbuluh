"use client";
import { useEffect, useState } from "react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", password: "", role: "employee" });
  const [msg, setMsg] = useState("");

  const load = () => fetch("/api/v1/admin?what=users").then((r) => r.json()).then((j) => { if (j.success) setUsers(j.data); }).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    const res = await fetch("/api/v1/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_employee", ...form }) });
    const j = await res.json();
    setMsg(j.success ? "✅ Akun dibuat." : j.error);
    if (j.success) { setForm({ name: "", phone: "", password: "", role: "employee" }); load(); }
  };
  const toggle = async (id) => {
    const res = await fetch("/api/v1/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "toggle_user", user_id: id }) });
    if ((await res.json()).success) load();
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">Manajemen Akun</h1>
      {msg && <div className="mb-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{msg}</div>}
      <div className="card mb-4 p-5">
        <h2 className="mb-3 font-semibold">+ Buat Akun Karyawan / Admin</h2>
        <div className="grid gap-2 sm:grid-cols-4">
          <input className="input" placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="No. HP" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="employee">Karyawan</option><option value="admin">Admin</option>
          </select>
        </div>
        <button className="btn-primary mt-3" onClick={create}>Buat Akun</button>
      </div>
      <div className="card overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-xs text-neutral-500"><th className="py-1">Nama</th><th>HP</th><th>Peran</th><th>Poin SHU</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-1 font-medium">{u.name}</td><td>{u.phone}</td>
                <td><span className={`badge ${u.role === "admin" ? "bg-koperasi-red text-white" : u.role === "employee" ? "bg-koperasi-gold/30 text-amber-800" : "bg-neutral-100"}`}>{u.role}</span></td>
                <td>{u.shu_points}</td>
                <td>{u.is_active ? "Aktif" : "Nonaktif"}</td>
                <td><button className="btn-outline text-xs" onClick={() => toggle(u.id)}>{u.is_active ? "Nonaktifkan" : "Aktifkan"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
