"use client";

import { useCallback, useEffect, useState } from "react";
import { useDashboardAuth } from "@/components/dashboard/auth-provider";

type BrandingPreset = {
  id: string;
  name: string;
  payload: {
    colors?: string[];
  } | null;
};

type BrandAsset = {
  id: string;
  name: string;
  preset: string;
  is_active: boolean;
};

const fallbackColors = ["#C9971F", "#E8C468", "#2F6B4F", "#163A28", "#FBF6EC"];

export default function BrandingPage() {
  const { supabase } = useDashboardAuth();
  const [presets, setPresets] = useState<BrandingPreset[]>([]);
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activatingAssetId, setActivatingAssetId] = useState<string | null>(null);

  const loadBrandingData = useCallback(async () => {
    setLoading(true);
    const [presetsRes, assetsRes] = await Promise.all([
      supabase.from("branding_presets").select("id,name,payload").order("created_at", { ascending: false }),
      supabase.from("brand_assets").select("id,name,preset,is_active").order("created_at", { ascending: false }),
    ]);

    if (presetsRes.error || assetsRes.error) {
      setError(presetsRes.error?.message ?? assetsRes.error?.message ?? "Failed to load branding data");
      setLoading(false);
      return;
    }

    setPresets((presetsRes.data as BrandingPreset[]) ?? []);
    setAssets((assetsRes.data as BrandAsset[]) ?? []);
    setError(null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadBrandingData();
    });
  }, [loadBrandingData]);

  const activateAsset = async (asset: BrandAsset) => {
    setActivatingAssetId(asset.id);
    const { error: deactivateError } = await supabase.from("brand_assets").update({ is_active: false }).eq("is_active", true);
    if (deactivateError) {
      setError(deactivateError.message);
      setActivatingAssetId(null);
      return;
    }

    const { error: activateError } = await supabase.from("brand_assets").update({ is_active: true }).eq("id", asset.id);
    if (activateError) {
      setError(activateError.message);
      setActivatingAssetId(null);
      return;
    }

    await loadBrandingData();
    setActivatingAssetId(null);
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-[#163a28]">Brand Presets</h1>
      {loading ? <p className="text-sm text-zinc-600">Loading live branding data…</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-3">
        {presets.map((preset) => (
          <article key={preset.name} className="rounded-2xl border border-[#e8c468]/40 bg-white p-4">
            <p className="font-semibold text-[#163a28]">{preset.name}</p>
            <div className="mt-3 flex gap-2">
              {(preset.payload?.colors ?? fallbackColors).map((color) => (
                <span key={color} className="h-8 w-8 rounded-full border border-zinc-200" style={{ backgroundColor: color }} title={color} />
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="rounded-2xl border border-[#e8c468]/40 bg-white p-5">
        <h2 className="text-lg font-semibold text-[#163a28]">Brand Assets</h2>
        <p className="mb-4 mt-1 text-sm text-zinc-600">Set the active asset used by the website.</p>
        <div className="space-y-3">
          {assets.map((asset) => (
            <div key={asset.id} className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3">
              <p className="text-sm font-medium text-zinc-700">
                {asset.name} · {asset.preset}
              </p>
              <button
                type="button"
                onClick={() => activateAsset(asset)}
                disabled={activatingAssetId === asset.id}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  asset.is_active ? "bg-[#2f6b4f]/10 text-[#2f6b4f]" : "bg-zinc-100 text-zinc-700"
                } disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {asset.is_active ? "Active" : activatingAssetId === asset.id ? "Activating…" : "Set active"}
              </button>
            </div>
          ))}
          {!loading && assets.length === 0 ? <p className="text-sm text-zinc-500">No brand assets found.</p> : null}
        </div>
      </div>
    </>
  );
}
