import { createClient } from "@supabase/supabase-js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";

const execFileAsync = promisify(execFile);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const blenderBinary = process.env.BLENDER_BINARY || "blender";
const blenderScriptPath = process.env.BLENDER_SCRIPT_PATH;
const outputDir = process.env.BLENDER_OUTPUT_DIR || join(process.cwd(), "tmp-renders");

if (!supabaseUrl || !serviceRoleKey || !blenderScriptPath) {
  throw new Error("Missing SUPABASE or BLENDER environment variables.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function updateJob(id, values) {
  const { error } = await supabase.from("render_jobs").update(values).eq("id", id);
  if (error) throw error;
}

async function uploadAsset(localPath, storagePath) {
  const buffer = await readFile(localPath);
  const { error } = await supabase.storage.from("brand-assets").upload(storagePath, buffer, {
    upsert: true,
    contentType: "image/png",
  });
  if (error) throw error;

  const { data } = supabase.storage.from("brand-assets").getPublicUrl(storagePath);
  return data.publicUrl;
}

async function processNextJob() {
  const { data: job, error } = await supabase
    .from("render_jobs")
    .select("id,preset")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!job) {
    console.log("No queued jobs");
    return;
  }

  await updateJob(job.id, { status: "running" });

  try {
    await execFileAsync(blenderBinary, ["--background", "--python", blenderScriptPath], {
      env: {
        ...process.env,
        OUTPUT_DIR: outputDir,
        ACTIVE_PALETTE: job.preset,
      },
    });

    const logoFile = join(outputDir, "lunchmate_logo_PRINT_4K.png");
    const heroFile = join(outputDir, "lunchmate_hero_POSTER_4K.png");
    const manifestFile = join(outputDir, "export_manifest.json");

    const logoUrl = await uploadAsset(logoFile, `jobs/${job.id}/${basename(logoFile)}`);
    const heroUrl = await uploadAsset(heroFile, `jobs/${job.id}/${basename(heroFile)}`);
    const manifestContent = await readFile(manifestFile, "utf8");

    const { error: assetError } = await supabase.from("brand_assets").insert({
      name: `Lunchmate ${job.preset}`,
      preset: job.preset,
      logo_png_url: logoUrl,
      hero_png_url: heroUrl,
    });

    if (assetError) throw assetError;

    await updateJob(job.id, {
      status: "complete",
      output_manifest_url: `inline:${manifestContent.slice(0, 1000)}`,
      error_message: null,
    });
  } catch (error) {
    await updateJob(job.id, {
      status: "failed",
      error_message: error instanceof Error ? error.message.slice(0, 1000) : "Unknown worker error",
    });
    throw error;
  }
}

processNextJob().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
