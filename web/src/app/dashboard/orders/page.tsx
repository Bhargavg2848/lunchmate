"use client";

import { useEffect, useState } from "react";
import { useDashboardAuth } from "@/components/dashboard/auth-provider";

type OrderRow = {
  id: string;
  customer_name: string;
  status: "pending" | "preparing" | "out_for_delivery" | "completed" | "cancelled";
  total_inr: number;
};

const statuses: OrderRow["status"][] = ["pending", "preparing", "out_for_delivery", "completed", "cancelled"];

export default function OrdersPage() {
  const { supabase } = useDashboardAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from("orders")
      .select("id,customer_name,status,total_inr")
      .order("created_at", { ascending: false })
      .limit(50);

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setOrders((data as OrderRow[]) ?? []);
    setError(null);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (order: OrderRow, status: OrderRow["status"]) => {
    setSavingOrderId(order.id);
    const { error: updateError } = await supabase.from("orders").update({ status }).eq("id", order.id);
    if (updateError) {
      setError(updateError.message);
      setSavingOrderId(null);
      return;
    }

    await loadOrders();
    setSavingOrderId(null);
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-[#163a28]">Order Status Board</h1>
      <div className="rounded-2xl border border-[#e8c468]/40 bg-white p-5">
        {loading ? <p className="mb-3 text-sm text-zinc-600">Loading live orders…</p> : null}
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        <div className="space-y-3">
          {orders.map((order) => (
            <article key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3">
              <div>
                <p className="font-semibold text-zinc-800">{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-sm text-zinc-500">{order.customer_name}</p>
              </div>
              <p className="text-sm font-medium text-zinc-700">₹{order.total_inr}</p>
              <select
                value={order.status}
                onChange={(event) => updateStatus(order, event.target.value as OrderRow["status"])}
                disabled={savingOrderId === order.id}
                className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </article>
          ))}
          {!loading && orders.length === 0 ? <p className="text-sm text-zinc-500">No orders found.</p> : null}
        </div>
      </div>
    </>
  );
}
