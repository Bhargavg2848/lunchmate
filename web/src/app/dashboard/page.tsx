"use client";

import { useEffect, useState } from "react";
import { useDashboardAuth } from "@/components/dashboard/auth-provider";

type DashboardMetrics = {
  todayOrders: number;
  pendingUpdates: number;
  menuItems: number;
  activeAsset: string;
};

const defaultMetrics: DashboardMetrics = {
  todayOrders: 0,
  pendingUpdates: 0,
  menuItems: 0,
  activeAsset: "None",
};

export default function DashboardPage() {
  const { supabase } = useDashboardAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadMetrics = async () => {
      setLoading(true);
      setError(null);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [todayOrdersRes, updatesRes, menuRes, assetRes] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
        supabase
          .from("customer_updates")
          .select("id", { count: "exact", head: true })
          .ilike("message", "%pending%"),
        supabase.from("menu_items").select("id", { count: "exact", head: true }),
        supabase.from("brand_assets").select("name").eq("is_active", true).limit(1).maybeSingle(),
      ]);

      const failures = [todayOrdersRes.error, updatesRes.error, menuRes.error, assetRes.error].filter(Boolean);
      if (failures.length > 0) {
        if (isActive) {
          setError(failures[0]?.message ?? "Failed to load dashboard data");
          setLoading(false);
        }
        return;
      }

      if (isActive) {
        setMetrics({
          todayOrders: todayOrdersRes.count ?? 0,
          pendingUpdates: updatesRes.count ?? 0,
          menuItems: menuRes.count ?? 0,
          activeAsset: assetRes.data?.name ?? "None",
        });
        setLoading(false);
      }
    };

    loadMetrics();

    return () => {
      isActive = false;
    };
  }, [supabase]);

  const cards = [
    ["Today Orders", String(metrics.todayOrders)],
    ["Pending Customer Updates", String(metrics.pendingUpdates)],
    ["Menu Items", String(metrics.menuItems)],
    ["Active Brand Asset", metrics.activeAsset],
  ] as const;

  return (
    <>
      <h1 className="text-2xl font-bold text-[#163a28]">Dashboard Overview</h1>
      {loading ? <p className="text-sm text-zinc-600">Loading live metrics…</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
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
