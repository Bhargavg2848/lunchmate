"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useDashboardAuth } from "@/components/dashboard/auth-provider";

type OrderOption = {
  id: string;
  customer_name: string;
};

type CustomerUpdate = {
  id: string;
  message: string;
  channel: string;
  created_at: string;
  order_id: string;
  orders: { customer_name: string }[] | null;
};

export default function CustomersPage() {
  const { supabase } = useDashboardAuth();
  const [updates, setUpdates] = useState<CustomerUpdate[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [orderId, setOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [updatesRes, ordersRes] = await Promise.all([
      supabase
        .from("customer_updates")
        .select("id,message,channel,created_at,order_id,orders(customer_name)")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("orders").select("id,customer_name").order("created_at", { ascending: false }).limit(100),
    ]);

    if (updatesRes.error || ordersRes.error) {
      setError(updatesRes.error?.message ?? ordersRes.error?.message ?? "Failed to load updates");
      setLoading(false);
      return;
    }

    const orderRows = ordersRes.data ?? [];
    setOrders(orderRows as OrderOption[]);
    setOrderId((currentOrderId) => (currentOrderId || orderRows.length === 0 ? currentOrderId : orderRows[0].id));

    setUpdates((updatesRes.data as CustomerUpdate[]) ?? []);
    setError(null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadData();
    });
  }, [loadData]);

  const addUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!orderId || !message.trim()) {
      setError("Order and message are required.");
      return;
    }

    setSaving(true);
    const { error: insertError } = await supabase.from("customer_updates").insert({
      order_id: orderId,
      message: message.trim(),
      channel: "dashboard",
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setMessage("");
    await loadData();
    setSaving(false);
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-[#163a28]">Customer Updates + Add-ons</h1>
      <div className="rounded-2xl border border-[#e8c468]/40 bg-white p-5">
        <form onSubmit={addUpdate} className="mb-4 grid gap-3 rounded-xl border border-zinc-200 p-4 md:grid-cols-[1fr_2fr_auto]">
          <select
            value={orderId}
            onChange={(event) => setOrderId(event.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-[#2f6b4f]/30 focus:ring-2"
          >
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.customer_name} · {order.id.slice(0, 8).toUpperCase()}
              </option>
            ))}
          </select>
          <input
            placeholder="Write a customer update"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-[#2f6b4f]/30 focus:ring-2"
            required
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#2f6b4f] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Posting…" : "Post"}
          </button>
        </form>
        {loading ? <p className="mb-3 text-sm text-zinc-600">Loading live updates…</p> : null}
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        <ul className="space-y-2 text-sm text-zinc-700">
          {updates.map((update) => (
            <li key={update.id} className="rounded-lg border border-zinc-200 px-3 py-2">
              <p>{update.message}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {update.orders?.[0]?.customer_name ?? "Unknown customer"} · {new Date(update.created_at).toLocaleString()}
              </p>
            </li>
          ))}
          {!loading && updates.length === 0 ? <li className="rounded-lg border border-zinc-200 px-3 py-2 text-zinc-500">No updates yet.</li> : null}
        </ul>
      </div>
    </>
  );
}
