const updates = [
  "Order packed and dispatched",
  "Delivery delayed by 10 minutes",
  "Add-on recommendation: buttermilk",
];

export default function CustomersPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-[#163a28]">Customer Updates + Add-ons</h1>
      <div className="rounded-2xl border border-[#e8c468]/40 bg-white p-5">
        <ul className="space-y-2 text-sm text-zinc-700">
          {updates.map((update) => (
            <li key={update} className="rounded-lg border border-zinc-200 px-3 py-2">
              {update}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
