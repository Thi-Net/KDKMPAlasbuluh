"use client";
import { useEffect, useState } from "react";
import { fmtRp } from "@/components/util";

export default function AdminOpname() {
  const [sessions, setSessions] = useState([]);
  const [msg, setMsg] = useState("");
  const [detail, setDetail] = useState(null);

  const load = () => fetch("/api/v1/opname").then((r) => r.json()).then((j) => { if (j.success) setSessions(j.data); }).catch(() => {});
  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    const res = await fetch("/api/v1/opname", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session_id: id, action }) });
    const j = await res.json();
    setMsg(j.success ? (action === "approve" ? "✅ Disetujui — stok disesuaikan via ledger (ADJUST_OPNAME)." : "Sesi diminta hitung ulang.") : j.error);
    load();
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-5">
        <h1 className="font-heading text-2xl font-extrabold text-neutral-900">Approval Stock Opname</h1>
        <p className="text-sm text-neutral-500">Setujui atau tolak sesi opname dari karyawan.</p>
      </div>
      {msg && <div className="mb-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">{msg}</div>}
      <div className="flex flex-col gap-3">
        {sessions.map((s) => (
          <div key={s.id} className="card card-pad">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-semibold">{s.title} <span className="text-xs text-neutral-400">({s.session_code})</span></div>
                <div className="text-xs text-neutral-500">oleh {s.created_by_name || "-"} · {s.item_count} item · nilai selisih {fmtRp(s.total_variance_value)}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${s.status === "APPROVED" ? "bg-green-100 text-green-700" : s.status === "SUBMITTED" ? "bg-amber-100 text-amber-700" : s.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-neutral-100"}`}>{s.status}</span>
                {s.status === "SUBMITTED" && (
                  <>
                    <button className="btn-primary text-xs" onClick={() => act(s.id, "approve")}>Setujui & Sesuaikan Stok</button>
                    <button className="btn-outline text-xs" onClick={() => act(s.id, "reject")}>Minta Hitung Ulang</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {sessions.length === 0 && <div className="card p-6 text-center text-sm text-neutral-500">Belum ada sesi opname.</div>}
      </div>
    </main>
  );
}
