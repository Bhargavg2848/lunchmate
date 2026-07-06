const jobs = [
  { id: "RJ-9001", preset: "CLASSIC", status: "queued" },
  { id: "RJ-9002", preset: "PREMIUM", status: "running" },
  { id: "RJ-9003", preset: "FESTIVE", status: "complete" },
];

export default function RenderJobsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-[#163a28]">Render Job Automation</h1>
      <div className="rounded-2xl border border-[#e8c468]/40 bg-white p-5">
        <p className="mb-4 text-sm text-zinc-600">Queue Blender render jobs and publish outputs as active website brand assets.</p>
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3">
              <p className="font-medium text-zinc-700">{job.id} · {job.preset}</p>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase text-zinc-600">{job.status}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
