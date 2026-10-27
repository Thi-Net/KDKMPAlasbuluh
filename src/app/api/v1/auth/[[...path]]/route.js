import { rpc, DbError } from "@/lib/db";
import { getUserFromRequest, verifyPassword, signToken, hashPassword } from "@/lib/auth";

export async function POST(req) {
  const { pathname } = new URL(req.url);
  const body = await req.json().catch(() => ({}));

  // --- LOGIN ---
  if (pathname.endsWith("/login")) {
    const { identifier, password } = body;
    if (!identifier || !password) return Response.json({ success: false, error: "Isi nomor HP/username dan password." }, { status: 400 });
    try {
      const user = await rpc("app_login", { p_identifier: identifier.trim() });
      if (!user || !user.is_active) return Response.json({ success: false, error: "Akun tidak ditemukan atau tidak aktif." }, { status: 401 });
      const ok = await verifyPassword(password, user.password_hash);
      if (!ok) return Response.json({ success: false, error: "Password salah." }, { status: 401 });
      try { await rpc("touch_last_login", { p_user_id: user.id }); } catch (e) {}
      const token = await signToken({ userId: user.id, role: user.role, name: user.name });
      const res = Response.json({ success: true, data: { role: user.role, name: user.name, redirect: user.role === "admin" ? "/admin" : user.role === "employee" ? "/employee" : "/katalog" } });
      res.headers.append("Set-Cookie", `kmp_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`);
      return res;
    } catch (e) {
      return Response.json({ success: false, error: e instanceof DbError ? e.message : "Gagal login." }, { status: 500 });
    }
  }

  // --- REGISTER (customer) ---
  if (pathname.endsWith("/register")) {
    const { name, phone, password, dusun_zone_id } = body;
    if (!name || !phone || !password || !dusun_zone_id)
      return Response.json({ success: false, error: "Nama, nomor HP/WA, dusun, dan password wajib diisi." }, { status: 400 });
    try {
      const dup = await select("v_users_safe", { select: "id", eq: { phone: phone.trim() }, limit: 1 });
      if (dup.length) return Response.json({ success: false, error: "Nomor HP sudah terdaftar. Silakan login." }, { status: 409 });
      const hash = await hashPassword(password);
      const created = await rpc("register_customer", { p_name: name.trim(), p_phone: phone.trim(), p_password_hash: hash, p_dusun_zone_id: dusun_zone_id });
      const user = { id: created.id, name: created.name, role: "customer" };
      const token = await signToken({ userId: user.id, role: "customer", name: user.name });
      const res = Response.json({ success: true, data: { role: "customer", name: user.name, redirect: "/katalog" } });
      res.headers.append("Set-Cookie", `kmp_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`);
      return res;
    } catch (e) {
      return Response.json({ success: false, error: e instanceof DbError ? e.message : "Gagal registrasi." }, { status: 500 });
    }
  }

  // --- LOGOUT ---
  if (pathname.endsWith("/logout")) {
    const res = Response.json({ success: true });
    res.headers.append("Set-Cookie", "kmp_token=; Path=/; HttpOnly; Max-Age=0");
    return res;
  }
  return Response.json({ success: false, error: "Endpoint tidak ditemukan." }, { status: 404 });
}

export async function GET(req) {
  if (new URL(req.url).pathname.endsWith("/me")) {
    const user = await getUserFromRequest(req);
    if (!user) return Response.json({ success: false, error: "Belum login." }, { status: 401 });
    return Response.json({ success: true, data: user });
  }
  return Response.json({ success: false, error: "Endpoint tidak ditemukan." }, { status: 404 });
}
