"use client";
import { useEffect, useState } from "react";
import { fmtRp } from "@/components/util";

const REASONS = ["Barang Rusak/Bocor", "Kedaluwarsa", "Susut Takaran", "Salah Input Kasir", "Belum Ditemukan"];

export default function OpnamePage() {
  const [sessions, setSessions] = useState([]);
  const [current, setCurrent] = useState(null);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");

  const load = () => {
    fetch("/api/v1/opname").then((r) => r.json()).then((j) => { if (j.success) setSessions(j.data); }).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const openSession = async (s) => {
    setCurrent(s);
    setItems([]);
    fetch("/api/v1/products").then((r) => r.json()).then((j) => { if (j.success) setProducts(j.data); }).catch(() => {});
  };

  const createSession = async () => {
    const title = prompt("Judul sesi opname:", "Opname Gerai " + new Date().toLocaleDateString("id-ID"));
    if (!title) return;
    const res = await fetch("/api/v1/opname", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", title }) });
    const j = await res.json();
    if (!j.success) { setErr(j.error); return; }
    openSession({ id: j.data.id, title, status: "DRAFT" });
    load();
  };

  const setPhysical = async (product, value) => {
    const phys = value === "" ? null : Number(value);
    // draft lokal (localStorage) agar aman jika sinyal terputus
    const draftKey = "kmp_opname_" + current.id;
    const draft = JSON.parse(localStorage.getItem(draftKey) || "{}");
    draft[product.id] = value;
    localStorage.setItem(draftKey, JSON.stringify(draft));
    if (phys === null) return;
    // Cek apakah ada selisih sebelum mengirim — perlu stok sistem server
    const res = await fetch("/api/v1/opname", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_item", session_id: current.id, product_id: product.id, physical_qty: phys }) });
    const j = await res.json();
    if (!j.success) { setErr(j.error); return; }
    setErr("");
    setItems((prev) => {
      const others = prev.filter((i) => i.product_id !== product.id);
      if (j.data.difference !== 0) {
        const reason = prompt(`Selisih ${j.data.difference} untuk ${product.name}. Alasan: ${REASONS.join(" / ")}`, "Susut Takaran");
        const notes = reason ? prompt("Catatan penjelasan (wajib):", "") : null;
        if (!reason || !notes) return others;
        fetch("/api/v1/opname", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "set_item", session_id: current.id, product_id: product.id, physical_qty: phys, reason_category: reason, notes }) });
        return [...others, { product_id: product.id, name: product.name, system_qty: j.data.system_qty, physical_qty: phys, difference_qty: j.data.difference, reason_category: reason, notes }];
      }
      return [...others, { product_id: product.id, name: product.name, system_qty: j.data.system_qty, physical_qty: phys, difference_qty: 0 }];
    });
  };

  const submit = async () => {
    const res = await fetch("/api/v1/opname", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit", session_id: current.id }) });
    const j = await res.json();
    if (!j.success) { setErr(j.error); return; }
    alert("Hasil opname diajukan ke Manajer.");
    setCurrent(null); load();
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Stock Opname</h1>
        <button className="btn-primary" onClick={createSession}>+ Sesi Baru</button>
      </div>
      {err && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      {!current ? (
        <div className="flex flex-col gap-3">
          {sessions.map((s) => (
            <button key={s.id} onClick={() => openSession(s)} className="card p-4 text-left hover:border-koperasi-red">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-xs text-neutral-500">{s.session_code} · {s.item_count} item · oleh {s.created_by_name || "-"}</div>
                </div>
                <span className={`badge ${s.status === "APPROVED" ? "bg-green-100 text-green-700" : s.status === "SUBMITTED" ? "bg-amber-100 text-amber-700" : s.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-neutral-100"}`}>{s.status}</span>
              </div>
            </button>
          ))}
          {sessions.length === 0 && <div className="card p-6 text-center text-sm text-neutral-500">Belum ada sesi opname.</div>}
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div><b>{current.title}</b> <span className="text-xs text-neutral-500">({current.status})</span></div>
            <div className="flex gap-2">
              <button className="btn-outline" onClick={() => setCurrent(null)}>← Kembali</button>
              {current.status === "DRAFT" && <button className="btn-primary" onClick={submit}>Ajukan ke Manajer</button>}
            </div>
          </div>
          <input className="input mb-3" placeholder="Cari produk…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex flex-col gap-2">
            {filtered.slice(0, 50).map((p) => (
              <div key={p.id} className="card flex items-center gap-3 p-3">
                <div className="flex-1">
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-neutral-500">Stok sistem: {p.current_stock} {p.unit}</div>
                </div>
                <input className="input w-24 text-center" type="number" min="0" placeholder="fisik" defaultValue={""}
                  onBlur={(e) => setPhysical(p, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
