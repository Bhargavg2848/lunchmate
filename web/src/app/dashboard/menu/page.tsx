"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useDashboardAuth } from "@/components/dashboard/auth-provider";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price_inr: number;
  is_available: boolean;
};

export default function MenuPage() {
  const { supabase } = useDashboardAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("menu_items")
      .select("id,name,description,price_inr,is_available")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setItems(data ?? []);
    setError(null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadItems();
    });
  }, [loadItems]);

  const createItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedPrice = Number.parseInt(price, 10);
    if (!name.trim() || Number.isNaN(parsedPrice)) {
      setError("Name and a valid numeric price are required.");
      return;
    }

    setSaving(true);
    const { error: insertError } = await supabase.from("menu_items").insert({
      name: name.trim(),
      description: description.trim() || null,
      price_inr: parsedPrice,
      is_available: true,
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setName("");
    setPrice("");
    setDescription("");
    await loadItems();
    setSaving(false);
  };

  const toggleAvailability = async (item: MenuItem) => {
    const { error: updateError } = await supabase
      .from("menu_items")
      .update({ is_available: !item.is_available })
      .eq("id", item.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadItems();
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-[#163a28]">Menu Manager</h1>
      <div className="rounded-2xl border border-[#e8c468]/40 bg-white p-5">
        <p className="mb-4 text-sm text-zinc-600">Use this module to add/edit menu items, pricing, and availability.</p>
        <form onSubmit={createItem} className="mb-5 grid gap-3 rounded-xl border border-zinc-200 p-4 md:grid-cols-3">
          <input
            placeholder="Item name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-[#2f6b4f]/30 focus:ring-2"
            required
          />
          <input
            type="number"
            min={1}
            placeholder="Price (INR)"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-[#2f6b4f]/30 focus:ring-2"
            required
          />
          <input
            placeholder="Description (optional)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-[#2f6b4f]/30 focus:ring-2"
          />
          <button
            type="submit"
            disabled={saving}
            className="md:col-span-3 w-fit rounded-full bg-[#2f6b4f] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving…" : "Add menu item"}
          </button>
        </form>
        {loading ? <p className="mb-3 text-sm text-zinc-600">Loading live menu items…</p> : null}
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3">
              <div>
                <p className="font-medium text-zinc-800">{item.name}</p>
                <p className="text-sm text-zinc-500">
                  ₹{item.price_inr}
                  {item.description ? ` · ${item.description}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleAvailability(item)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  item.is_available ? "bg-[#2f6b4f]/10 text-[#2f6b4f]" : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {item.is_available ? "Active" : "Inactive"}
              </button>
            </div>
          ))}
          {!loading && items.length === 0 ? <p className="text-sm text-zinc-500">No menu items yet.</p> : null}
        </div>
      </div>
    </>
  );
}
