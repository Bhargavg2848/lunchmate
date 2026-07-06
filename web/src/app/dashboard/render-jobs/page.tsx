"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useDashboardAuth } from "@/components/dashboard/auth-provider";

type RenderJob = {
  id: string;
  preset: string;
  template: string;
  status: "queued" | "running" | "failed" | "complete";
};

const presets = ["CLASSIC", "PREMIUM", "FESTIVE"];

export default function RenderJobsPage() {
  const { supabase } = useDashboardAuth();
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [preset, setPreset] = useState("CLASSIC");
  const [template, setTemplate] = useState("default");
  const [loading, setLoading] = useState(true);
  const [queueing, setQueueing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("render_jobs")
      .select("id,preset,template,status")
      .order("created_at", { ascending: false })
      .limit(50);

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setJobs((data as RenderJob[]) ?? []);
    setError(null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadJobs();
    });
  }, [loadJobs]);

  const queueJob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!template.trim()) {
      setError("Template is required.");
      return;
    }

    setQueueing(true);
    const { error: insertError } = await supabase.from("render_jobs").insert({
      preset,
      template: template.trim(),
      status: "queued",
    });

    if (insertError) {
      setError(insertError.message);
      setQueueing(false);
      return;
    }

    await loadJobs();
    setQueueing(false);
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-[#163a28]">Render Job Automation</h1>
      <div className="rounded-2xl border border-[#e8c468]/40 bg-white p-5">
        <p className="mb-4 text-sm text-zinc-600">Queue Blender render jobs and publish outputs as active website brand assets.</p>
        <form onSubmit={queueJob} className="mb-4 grid gap-3 rounded-xl border border-zinc-200 p-4 md:grid-cols-[160px_1fr_auto]">
          <select
            value={preset}
            onChange={(event) => setPreset(event.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-[#2f6b4f]/30 focus:ring-2"
          >
            {presets.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            value={template}
            onChange={(event) => setTemplate(event.target.value)}
            placeholder="Template"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-[#2f6b4f]/30 focus:ring-2"
            required
          />
          <button
            type="submit"
            disabled={queueing}
            className="rounded-full bg-[#2f6b4f] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {queueing ? "Queueing…" : "Queue job"}
          </button>
        </form>
        {loading ? <p className="mb-3 text-sm text-zinc-600">Loading live render jobs…</p> : null}
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3">
              <p className="font-medium text-zinc-700">
                {job.id.slice(0, 8).toUpperCase()} · {job.preset} · {job.template}
              </p>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase text-zinc-600">{job.status}</span>
            </div>
          ))}
          {!loading && jobs.length === 0 ? <p className="text-sm text-zinc-500">No render jobs found.</p> : null}
        </div>
      </div>
    </>
  );
}
