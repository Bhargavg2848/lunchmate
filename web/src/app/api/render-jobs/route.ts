import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase env not configured" }, { status: 501 });
  }

  const { data, error } = await supabase
    .from("render_jobs")
    .select("id,preset,status,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: data });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase env not configured" }, { status: 501 });
  }

  const body = await request.json();
  const preset = String(body?.preset ?? "CLASSIC").toUpperCase();
  const template = String(body?.template ?? "default");

  const { data, error } = await supabase
    .from("render_jobs")
    .insert({ preset, template, status: "queued" })
    .select("id,preset,status,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ job: data }, { status: 201 });
}
