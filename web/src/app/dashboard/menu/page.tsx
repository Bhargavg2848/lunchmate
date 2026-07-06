const items = [
  { name: "Mini Veg Thali", price: 149, status: "Active" },
  { name: "Protein Rice Bowl", price: 179, status: "Active" },
  { name: "Family Combo", price: 399, status: "Seasonal" },
];

export default function MenuPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-[#163a28]">Menu Manager</h1>
      <div className="rounded-2xl border border-[#e8c468]/40 bg-white p-5">
        <p className="mb-4 text-sm text-zinc-600">Use this module to add/edit menu items, pricing, and availability.</p>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.name} className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3">
              <div>
                <p className="font-medium text-zinc-800">{item.name}</p>
                <p className="text-sm text-zinc-500">₹{item.price}</p>
              </div>
              <span className="rounded-full bg-[#2f6b4f]/10 px-3 py-1 text-xs font-semibold text-[#2f6b4f]">{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
