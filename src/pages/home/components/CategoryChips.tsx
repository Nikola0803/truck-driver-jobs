interface CategoryChipsProps {
  activeCategory: string;
  onChange: (category: string) => void;
  counts: Record<string, number>;
}

const categories = [
  { label: "All Jobs", value: "All" },
  { label: "Dry Van", value: "Dry Van" },
  { label: "Reefer", value: "Reefer" },
  { label: "Flatbed", value: "Flatbed" },
  { label: "Step Deck", value: "Step Deck" },
  { label: "Tanker", value: "Tanker" },
  { label: "Local", value: "Local" },
  { label: "OTR", value: "OTR" },
  { label: "Regional", value: "Regional" },
  { label: "Dedicated", value: "Dedicated" },
  { label: "Team", value: "Team" },
];

export default function CategoryChips({ activeCategory, onChange, counts }: CategoryChipsProps) {
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((cat) => {
        const isActive = activeCategory === cat.value;
        const count = counts[cat.value] ?? 0;
        return (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              isActive
                ? "bg-brand-orange text-white"
                : "border border-brand-border bg-brand-surface text-brand-text-secondary hover:border-brand-orange/30 hover:text-brand-text"
            }`}
          >
            {cat.label}
            {count > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-brand-bg text-brand-text-muted"}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}