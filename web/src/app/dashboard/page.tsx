const cards = [
  ["Today Orders", "26"],
  ["Pending Customer Updates", "9"],
  ["Menu Items", "18"],
  ["Active Brand Assets", "Classic"],
] as const;

export default function DashboardPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-[#163a28]">Dashboard Overview</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-[#e8c468]/40 bg-white p-5">
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-[#163a28]">{value}</p>
          </article>
        ))}
      </div>
    </>
  );
}
