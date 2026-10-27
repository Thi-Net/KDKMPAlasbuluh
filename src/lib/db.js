/**
 * Supabase REST (PostgREST) client — publishable key, tanpa package eksternal.
 * Logika transaksional (ledger stok, order, tutup kas, approval) berada di
 * fungsi RPC security definer di Supabase (supabase/01_rpcs.sql), bukan di sini.
 */
const SB_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SB_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "";

function headers(extra = {}) {
  return {
    apikey: SB_KEY,
    Authorization: `Bearer ${SB_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}

function dbConfigured() {
  return Boolean(SB_URL && SB_KEY);
}

class DbError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(path, options = {}) {
  if (!dbConfigured()) throw new DbError("Database belum dikonfigurasi — jalankan supabase/00_schema.sql, 01_rpcs.sql, 02_seed.sql di Supabase SQL Editor, lalu set SUPABASE_URL & SUPABASE_PUBLISHABLE_KEY di Vercel.", 503, "DB_NOT_CONFIGURED");
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, { ...options, headers: headers(options.headers) });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
  if (!res.ok) {
    const msg = (body && (body.message || body.error)) || `HTTP ${res.status}`;
    throw new DbError(msg, res.status, body && body.code);
  }
  return body;
}

/** SELECT: query(table, { select, eq: {col: val}, order, limit, single }) */
async function select(table, opts = {}) {
  const qs = new URLSearchParams();
  if (opts.select) qs.set("select", opts.select);
  if (opts.eq) for (const [k, v] of Object.entries(opts.eq)) qs.set(k, `eq.${v}`);
  if (opts.or) qs.set("or", opts.or.startsWith("(") ? opts.or : `(${opts.or})`);
  if (opts.order) qs.set("order", opts.order);
  if (opts.limit) qs.set("limit", String(opts.limit));
  let body = await request(`${table}?${qs.toString()}`);
  if (opts.single) return (body && body[0]) || null;
  return body || [];
}

/** INSERT (returns rows) */
async function insert(table, rows, opts = {}) {
  const qs = new URLSearchParams();
  if (opts.select) qs.set("select", opts.select);
  return request(`${table}?${qs.toString()}`, { method: "POST", body: JSON.stringify(rows) });
}

/** UPDATE by eq filters */
async function update(table, eq, patch, opts = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(eq)) qs.set(k, `eq.${v}`);
  if (opts.select) qs.set("select", opts.select);
  return request(`${table}?${qs.toString()}`, { method: "PATCH", body: JSON.stringify(patch) });
}

/** Panggil fungsi RPC PostgREST */
async function rpc(fn, args = {}) {
  return request(`rpc/${fn}`, { method: "POST", body: JSON.stringify(args) });
}

module.exports = { select, insert, update, rpc, dbConfigured, DbError, SB_URL, SB_KEY };
