const presets = [
  { name: "CLASSIC", colors: ["#C9971F", "#E8C468", "#2F6B4F", "#163A28", "#FBF6EC"] },
  { name: "PREMIUM", colors: ["#BD8920", "#DFBA5B", "#275F44", "#103121", "#F6F2E9"] },
  { name: "FESTIVE", colors: ["#D39F2A", "#EEC979", "#3B7B58", "#1A3E2B", "#FCF8EF"] },
];

export default function BrandingPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-[#163a28]">Brand Presets</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {presets.map((preset) => (
          <article key={preset.name} className="rounded-2xl border border-[#e8c468]/40 bg-white p-4">
            <p className="font-semibold text-[#163a28]">{preset.name}</p>
            <div className="mt-3 flex gap-2">
              {preset.colors.map((color) => (
                <span key={color} className="h-8 w-8 rounded-full border border-zinc-200" style={{ backgroundColor: color }} title={color} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
