import { select, rpc, DbError } from "@/lib/db";

export async function GET() {
  try {
    const stats = await rpc("landing_stats");
    const cmsRows = await select("cms_profiles", { select: "section_key,content_json" });
    const flags = await select("feature_flags", { select: "key,is_enabled" });
    const sections = {};
    cmsRows.forEach((r) => (sections[r.section_key] = r.content_json));
    return Response.json({ success: true, data: { stats, cms: sections, flags: Object.fromEntries(flags.map((f) => [f.key, f.is_enabled])) } });
  } catch (e) {
    const msg = e instanceof DbError && e.code === "DB_NOT_CONFIGURED" ? e.message
      : (e.message || "").includes("schema cache") || e.message.includes("Could not find") ? "Database belum dikonfigurasi — jalankan supabase/00_schema.sql, 01_rpcs.sql, 02_seed.sql di Supabase SQL Editor." : "Gagal memuat profil koperasi.";
    return Response.json({ success: false, error: msg }, { status: 500 });
  }
}
