import { NextResponse } from "next/server";

export const config = { matcher: ["/admin/:path*", "/employee/:path*", "/katalog", "/keranjang", "/checkout", "/pesanan", "/pesanan/:path*"] };

const ROLE_FOR = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/employee", roles: ["admin", "employee"] },
  { prefix: "/katalog", roles: ["customer", "admin", "employee"] },
  { prefix: "/keranjang", roles: ["customer"] },
  { prefix: "/checkout", roles: ["customer"] },
  { prefix: "/pesanan", roles: ["customer"] }
];

const HOME_BY_ROLE = { admin: "/admin", employee: "/employee", customer: "/katalog" };

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("kmp_token")?.value;
  let role = null;
  if (token) {
    try {
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "kmp-alasbuluh-dev-secret-ganti-di-produksi-2026");
      const { payload } = await jwtVerify(token, secret);
      role = payload.role || null;
    } catch (e) { role = null; }
  }
  const rule = ROLE_FOR.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  if (!rule) return NextResponse.next();
  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (!rule.roles.includes(role)) {
    const url = req.nextUrl.clone();
    url.pathname = HOME_BY_ROLE[role] || "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
