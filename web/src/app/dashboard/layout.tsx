import Link from "next/link";

const nav = [
  ["Overview", "/dashboard"],
  ["Menu", "/dashboard/menu"],
  ["Orders", "/dashboard/orders"],
  ["Customers", "/dashboard/customers"],
  ["Branding", "/dashboard/branding"],
  ["Render Jobs", "/dashboard/render-jobs"],
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbf6ec]">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-[#e8c468]/40 bg-white p-4">
          <h2 className="mb-4 text-lg font-bold text-[#163a28]">Lunchmate Admin</h2>
          <nav className="space-y-2">
            {nav.map(([label, href]) => (
              <Link key={href} href={href} className="block rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-[#fbf6ec] hover:text-[#163a28]">
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="space-y-4">{children}</section>
      </div>
    </div>
  );
}
