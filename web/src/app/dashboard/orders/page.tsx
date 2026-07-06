const orders = [
  { id: "LM-1021", customer: "Aarav", status: "Preparing", amount: 338 },
  { id: "LM-1022", customer: "Meera", status: "Out for delivery", amount: 149 },
  { id: "LM-1023", customer: "Rahul", status: "Pending", amount: 179 },
];

export default function OrdersPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-[#163a28]">Order Status Board</h1>
      <div className="rounded-2xl border border-[#e8c468]/40 bg-white p-5">
        <div className="space-y-3">
          {orders.map((order) => (
            <article key={order.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 px-4 py-3">
              <div>
                <p className="font-semibold text-zinc-800">{order.id}</p>
                <p className="text-sm text-zinc-500">{order.customer}</p>
              </div>
              <p className="text-sm font-medium text-zinc-700">₹{order.amount}</p>
              <span className="rounded-full bg-[#c9971f]/15 px-3 py-1 text-xs font-semibold text-[#8d6f17]">{order.status}</span>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
