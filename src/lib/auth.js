const bcrypt = require("bcryptjs");
const { SignJWT, jwtVerify } = require("jose");
const { select, rpc } = require("./db");

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "kmp-alasbuluh-dev-secret-ganti-di-produksi-2026"
);

async function hashPassword(plain) { return bcrypt.hash(plain, 10); }
async function verifyPassword(plain, hash) {
  try { return await bcrypt.compare(plain, hash); } catch (e) { return false; }
}

async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch (e) { return null; }
}

/** Ambil user dari request (cookie httpOnly 'kmp_token' atau Bearer untuk Android). */
async function getUserFromRequest(req) {
  let token = null;
  const cookieHeader = req.headers.get ? req.headers.get("cookie") : req.headers.cookie;
  if (cookieHeader) {
    const m = cookieHeader.match(/(?:^|;\s*)kmp_token=([^;]+)/);
    if (m) token = decodeURIComponent(m[1]);
  }
  if (!token) {
    const auth = req.headers.get ? req.headers.get("authorization") : req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) token = auth.slice(7);
  }
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !payload.userId) return null;
  try {
    const u = await select("v_users_safe", {
      select: "id,name,phone,email,role,dusun_zone_id,member_number,is_active",
      eq: { id: payload.userId },
      single: true
    });
    if (!u || !u.is_active) return null;
    return u;
  } catch (e) { return null; }
}

function apiError(status, message) {
  return Response.json({ success: false, error: message }, { status });
}

function requireRole(user, roles) {
  if (!user) return apiError(401, "Belum login / sesi berakhir.");
  if (!roles.includes(user.role)) return apiError(403, "Akses ditolak untuk peran Anda.");
  return null;
}

function genCode(prefix) {
  const n = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}-${n}`;
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken, getUserFromRequest, apiError, requireRole, genCode, rpc };
