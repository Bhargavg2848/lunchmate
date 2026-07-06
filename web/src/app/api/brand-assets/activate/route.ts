import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase env not configured" }, { status: 501 });
  }

  const body = await request.json();
  const assetId = String(body?.assetId ?? "").trim();

  if (!assetId) {
    return NextResponse.json({ error: "assetId is required" }, { status: 400 });
  }

  const { error: deactivateError } = await supabase
    .from("brand_assets")
    .update({ is_active: false })
    .eq("is_active", true);

  if (deactivateError) {
    return NextResponse.json({ error: deactivateError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("brand_assets")
    .update({ is_active: true })
    .eq("id", assetId)
    .select("id,name,is_active,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ activeAsset: data });
}
