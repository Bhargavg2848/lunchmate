"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";

const ScrollModel = dynamic(() => import("@/components/landing/scroll-model"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[460px] w-full items-center justify-center rounded-3xl border border-[#e8c468]/40 bg-white/70">
      <Image src="/lunchmate-fallback.svg" alt="Lunchmate fallback" width={340} height={340} className="h-[340px] w-[340px]" />
    </div>
  ),
});

const features = [
  "Scroll-driven 3D model section",
  "Fallback image for low-power devices",
  "Dashboard-ready architecture",
  "Supabase-ready backend scaffolding",
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-[#163a28] md:text-4xl">Lunchmate</h1>
        <Link href="/dashboard" className="rounded-full bg-[#2f6b4f] px-5 py-2 text-sm font-semibold text-white hover:bg-[#24533d]">
          Open Dashboard
        </Link>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="space-y-5">
          <p className="inline-block rounded-full bg-[#c9971f] px-3 py-1 text-xs font-semibold text-white">Cloud Food Brand Platform</p>
          <h2 className="text-4xl font-bold leading-tight text-[#163a28] md:text-5xl">3D-first website with easy brand and menu updates.</h2>
          <p className="text-zinc-700">
            Built for posters, videos, online ordering, and live customer updates. Scroll the page to rotate the center tiffin model.
          </p>
          <ul className="grid gap-2 text-sm text-zinc-700">
            {features.map((feature) => (
              <li key={feature} className="rounded-xl border border-[#e8c468]/40 bg-white/60 px-3 py-2">
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <ScrollModel />
      </section>
    </main>
  );
}
