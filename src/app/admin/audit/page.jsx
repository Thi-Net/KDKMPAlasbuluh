"use client";
import { useEffect, useState } from "react";

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    fetch("/api/v1/admin?what=audit").then((r) => r.json()).then((j) => { if (j.success) setLogs(j.data); }).catch(() => {});
  }, []);
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-2 text-xl font-bold">Audit Log — Mesin Waktu Koperasi</h1>
      <p className="mb-4 text-sm text-neutral-500">Rekam jejak permanen perubahan stok, produk, dan laporan keuangan.</p>
      <div className="card overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-xs text-neutral-500"><th className="py-1">Waktu</th><th>Pelaku</th><th>Aksi</th><th>Entitas</th><th>Detail</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b align-top">
                <td className="py-1 whitespace-nowrap text-xs">{new Date(l.created_at).toLocaleString("id-ID")}</td>
                <td>{l.actor_name || "-"} <span className="text-xs text-neutral-400">({l.actor_role})</span></td>
                <td className="font-medium">{l.action}</td>
                <td className="text-xs">{l.entity_name} #{String(l.entity_id).slice(0, 8)}</td>
                <td className="max-w-md truncate text-xs text-neutral-500">{(l.after_state_json || "").slice(0, 140)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="py-4 text-center text-sm text-neutral-400">Belum ada aktivitas tercatat.</p>}
      </div>
    </main>
  );
}
