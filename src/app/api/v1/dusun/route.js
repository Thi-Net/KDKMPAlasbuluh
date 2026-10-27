import { select } from "@/lib/db";

export async function GET(req) {
  try {
    const rows = await select("dusun_zones", { select: "id,dusun_name,delivery_fee,estimated_minutes", eq: { is_active: true }, order: "id" });
    return Response.json({ success: true, data: rows });
  } catch (e) {
    return Response.json({ success: false, error: e.message || "Gagal memuat dusun." }, { status: 500 });
  }
}
