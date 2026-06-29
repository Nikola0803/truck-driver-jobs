import { useState } from "react";

// States, regions, and cities for bulk SEO page generation
const LOCATION_PRESETS = [
  {
    label: "Top 50 US Cities",
    locations: [
      "New York NY", "Los Angeles CA", "Chicago IL", "Houston TX", "Phoenix AZ",
      "Philadelphia PA", "San Antonio TX", "San Diego CA", "Dallas TX", "Austin TX",
      "San Jose CA", "Fort Worth TX", "Jacksonville FL", "Columbus OH", "Charlotte NC",
      "Indianapolis IN", "San Francisco CA", "Seattle WA", "Denver CO", "Nashville TN",
      "Oklahoma City OK", "El Paso TX", "Washington DC", "Boston MA", "Las Vegas NV",
      "Portland OR", "Memphis TN", "Louisville KY", "Baltimore MD", "Milwaukee WI",
      "Albuquerque NM", "Tucson AZ", "Fresno CA", "Sacramento CA", "Mesa AZ",
      "Kansas City MO", "Atlanta GA", "Omaha NE", "Colorado Springs CO", "Raleigh NC",
      "Long Beach CA", "Virginia Beach VA", "Miami FL", "Oakland CA", "Minneapolis MN",
      "Tampa FL", "Tulsa OK", "Arlington TX", "New Orleans LA", "Cleveland OH",
    ],
  },
  {
    label: "Top Trucking States",
    locations: [
      "Texas", "California", "Florida", "Illinois", "Ohio",
      "Georgia", "Pennsylvania", "North Carolina", "Michigan", "Indiana",
      "Tennessee", "Missouri", "Arizona", "Wisconsin", "Colorado",
    ],
  },
  {
    label: "All 50 States",
    locations: [
      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
      "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
      "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
      "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
      "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
      "New Hampshire", "New Jersey", "New Mexico", "New York",
      "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
      "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
      "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
      "West Virginia", "Wisconsin", "Wyoming",
    ],
  },
];

const PAGE_TEMPLATES = [
  {
    label: "CDL Jobs in {location}",
    slug: "cdl-jobs-{location-slug}",
    title: "CDL Truck Driving Jobs in {location} | TruckDriverJobs.co",
  },
  {
    label: "Class A CDL Jobs {location}",
    slug: "class-a-cdl-jobs-{location-slug}",
    title: "Class A CDL Jobs in {location} - Apply Today | TruckDriverJobs.co",
  },
  {
    label: "Trucking Companies Hiring in {location}",
    slug: "trucking-companies-{location-slug}",
    title: "Trucking Companies Hiring in {location} | TruckDriverJobs.co",
  },
  {
    label: "Owner-Operator Jobs {location}",
    slug: "owner-operator-jobs-{location-slug}",
    title: "Owner-Operator Trucking Jobs in {location} | TruckDriverJobs.co",
  },
  {
    label: "Regional Truck Driving Jobs {location}",
    slug: "regional-trucking-jobs-{location-slug}",
    title: "Regional Truck Driving Jobs in {location} - Apply Now | TruckDriverJobs.co",
  },
];

export default function SeoPages() {
  const [selectedPreset, setSelectedPreset] = useState(LOCATION_PRESETS[0].label);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([PAGE_TEMPLATES[0].label]);
  const [generated, setGenerated] = useState<any[]>([]);

  const currentPreset = LOCATION_PRESETS.find((p) => p.label === selectedPreset) || LOCATION_PRESETS[0];

  const toggleTemplate = (t: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const handleGenerate = () => {
    const templates = PAGE_TEMPLATES.filter((t) => selectedTemplates.includes(t.label));
    const pages: any[] = [];

    currentPreset.locations.forEach((loc) => {
      const locationSlug = loc.toLowerCase().replace(/\s+/g, "-").replace(/,/g, "");
      templates.forEach((t) => {
        pages.push({
          location: loc,
          url: `/${t.slug.replace("{location-slug}", locationSlug)}`,
          title: t.title.replace("{location}", loc),
          template: t.label,
        });
      });
    });

    setGenerated(pages);
  };

  const totalPages = generated.length;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-foreground-950">SEO Pages Generator</h1>
        <p className="mt-1 text-sm text-foreground-600">Bulk-generate location-based SEO landing pages. Each page targets a specific city or state + keyword combination to capture local search traffic.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <div className="rounded-xl border border-brand-border bg-brand-surface p-6">
          <h2 className="font-heading text-lg font-bold text-foreground-950 mb-4">Configuration</h2>

          {/* Location Presets */}
          <div className="mb-5">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-foreground-500">Location Set</label>
            <div className="space-y-1">
              {LOCATION_PRESETS.map((preset) => (
                <label key={preset.label} className="flex items-center gap-3 rounded-lg border border-brand-border bg-background-50 px-4 py-3 cursor-pointer hover:border-accent-400">
                  <input
                    type="radio"
                    name="preset"
                    checked={selectedPreset === preset.label}
                    onChange={() => setSelectedPreset(preset.label)}
                    className="h-4 w-4 accent-accent-500"
                  />
                  <div>
                    <p className="text-sm font-bold text-foreground-950">{preset.label}</p>
                    <p className="text-xs text-foreground-500">{preset.locations.length} locations</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Page Templates */}
          <div className="mb-5">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-foreground-500">Page Templates</label>
            <div className="space-y-1">
              {PAGE_TEMPLATES.map((t) => (
                <label key={t.label} className="flex items-center gap-3 rounded-lg border border-brand-border bg-background-50 px-4 py-3 cursor-pointer hover:border-accent-400">
                  <input
                    type="checkbox"
                    checked={selectedTemplates.includes(t.label)}
                    onChange={() => toggleTemplate(t.label)}
                    className="h-4 w-4 rounded accent-accent-500"
                  />
                  <div>
                    <p className="text-sm font-bold text-foreground-950">{t.label}</p>
                    <p className="text-xs text-foreground-500">/{t.slug.replace("{location-slug}", "city-state")}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={selectedTemplates.length === 0}
            className="w-full rounded-lg bg-accent-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Generate {currentPreset.locations.length * selectedTemplates.length} Pages
          </button>
        </div>

        {/* Preview / Output */}
        <div className="rounded-xl border border-brand-border bg-brand-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-bold text-foreground-950">Generated Pages</h2>
            {generated.length > 0 && (
              <span className="rounded-full bg-accent-100 px-3 py-0.5 text-xs font-bold text-accent-700">{totalPages} pages</span>
            )}
          </div>

          {generated.length === 0 ? (
            <div className="rounded-lg bg-background-50 p-10 text-center">
              <i className="ri-file-list-3-line text-3xl text-foreground-300" />
              <p className="mt-3 text-sm text-foreground-500">Select locations and templates, then click Generate to preview your SEO pages.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {generated.map((page, idx) => (
                <div key={idx} className="rounded-lg border border-brand-border bg-background-50 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground-950">{page.title}</p>
                      <p className="text-[11px] text-foreground-500 mt-0.5">URL: {page.url}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-600">{page.location}</span>
                  </div>
                </div>
              ))}
              {totalPages > 20 && (
                <p className="text-center text-xs text-foreground-400 pt-2">Showing all {totalPages} pages</p>
              )}
            </div>
          )}

          {generated.length > 0 && (
            <div className="mt-4 rounded-lg bg-accent-50 border border-accent-200 p-4">
              <p className="text-xs font-semibold text-accent-800 mb-2">
                <i className="ri-information-line mr-1" />
                Next Step
              </p>
              <p className="text-xs text-accent-700">
                These pages need to be created as individual files in <code className="rounded bg-accent-100 px-1">src/pages/seo/</code> with proper SEO metadata, structured data, and links to relevant jobs in each location. You can use the blog manager to create supporting content for each location page to improve topical authority.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}