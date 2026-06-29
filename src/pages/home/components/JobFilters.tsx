import { useState } from "react";
import type { Job } from "@/mocks/jobs";

interface JobFiltersProps {
  jobs: Job[];
  activeFilters: {
    routeType: string[];
    equipment: string[];
    experience: string[];
    homeTime: string[];
  };
  onChange: (filters: JobFiltersProps["activeFilters"]) => void;
}

export default function JobFilters({ activeFilters, onChange }: JobFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const routeTypes = ["OTR", "Regional", "Dedicated", "Local"];
  const equipments = ["Dry Van", "Reefer", "Flatbed", "Step Deck", "Tanker", "Chassis / Container"];
  const experiences = ["Less than 1 Year", "6+ Months", "1+ Years", "1-3 Years", "2+ Years", "3+ Years"];
  const homeTimes = ["Home Daily", "Home 3x Weekly", "Every Weekend", "Home Every 10-14 Days", "Flexible Scheduling"];

  const toggleArray = (key: keyof typeof activeFilters, value: string) => {
    const current = activeFilters[key] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...activeFilters, [key]: next });
  };

  const clearAll = () => {
    onChange({ routeType: [], equipment: [], experience: [], homeTime: [] });
  };

  const hasFilters =
    activeFilters.routeType.length +
    activeFilters.equipment.length +
    activeFilters.experience.length +
    activeFilters.homeTime.length > 0;

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-border bg-brand-surface px-4 py-3 text-sm font-semibold text-brand-text md:hidden"
      >
        <i className="ri-equalizer-line" />
        Filters
        {hasFilters && (
          <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white">
            {activeFilters.routeType.length + activeFilters.equipment.length + activeFilters.experience.length + activeFilters.homeTime.length}
          </span>
        )}
      </button>

      {/* Filter panel */}
      <div className={`${mobileOpen ? "block" : "hidden"} md:block`}>
        <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 md:sticky md:top-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-text">Filter Jobs</h3>
            {hasFilters && (
              <button
                onClick={clearAll}
                className="text-xs font-semibold text-brand-orange hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Route Type */}
          <div className="mb-5">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-text-muted">
              Route Type
            </h4>
            <div className="flex flex-wrap gap-2">
              {routeTypes.map((rt) => (
                <button
                  key={rt}
                  onClick={() => toggleArray("routeType", rt)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeFilters.routeType.includes(rt)
                      ? "bg-brand-orange text-white"
                      : "bg-brand-bg text-brand-text-secondary hover:text-brand-text"
                  }`}
                >
                  {rt}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div className="mb-5">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-text-muted">
              Equipment
            </h4>
            <div className="flex flex-wrap gap-2">
              {equipments.map((eq) => (
                <button
                  key={eq}
                  onClick={() => toggleArray("equipment", eq)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeFilters.equipment.includes(eq)
                      ? "bg-brand-orange text-white"
                      : "bg-brand-bg text-brand-text-secondary hover:text-brand-text"
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="mb-5">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-text-muted">
              Experience Required
            </h4>
            <div className="flex flex-wrap gap-2">
              {experiences.map((exp) => (
                <button
                  key={exp}
                  onClick={() => toggleArray("experience", exp)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeFilters.experience.includes(exp)
                      ? "bg-brand-orange text-white"
                      : "bg-brand-bg text-brand-text-secondary hover:text-brand-text"
                  }`}
                >
                  {exp}
                </button>
              ))}
            </div>
          </div>

          {/* Home Time */}
          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-text-muted">
              Home Time
            </h4>
            <div className="flex flex-wrap gap-2">
              {homeTimes.map((ht) => (
                <button
                  key={ht}
                  onClick={() => toggleArray("homeTime", ht)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeFilters.homeTime.includes(ht)
                      ? "bg-brand-orange text-white"
                      : "bg-brand-bg text-brand-text-secondary hover:text-brand-text"
                  }`}
                >
                  {ht}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}