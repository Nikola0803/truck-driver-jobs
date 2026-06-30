import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/feature/Navbar";
import Footer from "@/components/feature/Footer";
import SeoHead from "@/components/feature/SeoHead";
import SITE_URL from "@/lib/siteUrl";

const EQUIPMENT_OPTIONS = [
  "Dry Van",
  "Reefer",
  "Flatbed",
  "Step Deck",
  "Tanker",
  "Heavy Haul",
  "Other",
];

const TESTIMONIALS = [
  {
    quote: "We needed 8 OTR drivers in 2 weeks. TruckDriverJobs.co delivered 12 pre-qualified candidates in 4 days. 6 of them are still with us 8 months later.",
    name: "Mark Davis",
    title: "Fleet Manager, Midwest Freight Solutions",
    location: "Indianapolis, IN",
  },
  {
    quote: "Before them, we burned through 3 recruiters. Their team actually understands trucking. They sent us flatbed guys with real flatbed experience. Not wannabes.",
    name: "Rachel Torres",
    title: "HR Director, Lone Star Logistics",
    location: "Dallas, TX",
  },
  {
    quote: "We are a 40-truck reefer fleet. Finding clean drivers with reefer experience was brutal. They solved it in under a week. Pay only after 30 days is genius.",
    name: "Jake Petrovic",
    title: "Owner, Petrovic Transport Group",
    location: "Chicago, IL",
  },
];

const FAQS = [
  {
    q: "How much does it cost to hire through you?",
    a: "Nothing upfront. We only invoice after a driver passes your orientation and completes 30 days. If they leave before that, we replace them at no extra charge. Our fee is a flat per-hire rate, not a percentage of salary.",
  },
  {
    q: "What kind of drivers do you have in your network?",
    a: "All Class A CDL holders. Company drivers, owner-operators, and teams. We cover OTR, regional, dedicated, and local lanes. Equipment types include dry van, reefer, flatbed, tanker, step deck, and heavy haul.",
  },
  {
    q: "How fast can we expect candidates?",
    a: "We guarantee at least 3 matched, pre-screened candidates within 72 hours of receiving your hiring request. Most fleets get their first interview scheduled within 24 hours.",
  },
  {
    q: "Do you handle background checks and drug screens?",
    a: "We pre-screen every candidate for CDL validity, MVR history, and employment verification. We do not run drug screens. That is between you and your preferred TPA or clinic. We provide the clean, verified candidates so you can run your final checks.",
  },
  {
    q: "Can we hire drivers in specific states only?",
    a: "Absolutely. We match candidates within your hiring radius. Most of our network is concentrated in Texas, California, Florida, Georgia, Illinois, Ohio, and the Midwest, but we cover all 48 contiguous states.",
  },
  {
    q: "What if a driver quits in the first 30 days?",
    a: "Our 30-day replacement guarantee covers you. If a driver leaves for any reason within their first 30 days, we source a replacement at no additional cost. We want long-term matches, not quick hires.",
  },
];

const TRUSTED_CARRIERS = [
  "Midwest Freight Solutions",
  "Lone Star Logistics",
  "Petrovic Transport",
  "Atlantic Reefer Lines",
  "Great Plains Flatbed",
  "Sunbelt Tanker Co.",
  "Blue Ridge Dedicated",
  "Northern Chassis Group",
];

export default function ForFleets() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notesLength, setNotesLength] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const validate = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const newErrors: Record<string, string> = {};

    const company = data.get("company_name")?.toString().trim();
    const contact = data.get("contact_name")?.toString().trim();
    const email = data.get("email")?.toString().trim();
    const phone = data.get("phone")?.toString().trim();
    const fleet = data.get("fleet_size")?.toString();
    const drivers = data.get("drivers_needed")?.toString();

    if (!company) newErrors.company_name = "Company name is required";
    if (!contact) newErrors.contact_name = "Contact name is required";
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email";
    }
    if (!phone) {
      newErrors.phone = "Phone is required";
    } else if (!/^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(phone)) {
      newErrors.phone = "Enter a valid US phone number";
    }
    if (!fleet) newErrors.fleet_size = "Select fleet size";
    if (!drivers || Number(drivers) < 1) newErrors.drivers_needed = "Enter at least 1 driver";

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const form = e.currentTarget;
    const validation = validate(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setSubmitting(true);

    const formData = new FormData(form);
    const params = new URLSearchParams();
    formData.forEach((value, key) => {
      if (typeof value === "string") {
        params.append(key, value);
      }
    });

    try {
      const res = await fetch("https://readdy.ai/api/form/d852gc1n2eikjpjtqhu0", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });

      if (res.ok) {
        setSubmitted(true);
        form.reset();
        setNotesLength(0);
      } else {
        setErrors({ submit: "Something went wrong. Please try again." });
      }
    } catch {
      setErrors({ submit: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text">
      <SeoHead
        title="Hire CDL Drivers: We Fill Your Seats in 72 Hours | For Fleets & Carriers"
        description="Hire vetted CDL Class A drivers fast. We hand-match qualified candidates to your lanes and equipment. No upfront fees — pay only when drivers stay 30 days."
        keywords="hire CDL drivers, fleet recruiting, truck driver hiring, carrier driver sourcing, CDL recruitment, trucking fleet staffing"
        canonicalUrl={`${SITE_URL}/for-fleets`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQS.map((faq) => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.a
            }
          }))
        }}
      />
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://readdy.ai/api/search-image?query=Aerial%20view%20of%20a%20large%20modern%20trucking%20fleet%20yard%20at%20golden%20hour%20with%20rows%20of%20semi%20trucks%20parked%20neatly%20warm%20amber%20sunlight%20professional%20commercial%20photography%20clean%20organized%20logistics%20hub%20warm%20orange%20and%20cream%20tones%20high%20resolution%20sharp%20details%20no%20text&width=1400&height=600&seq=fleet-hero-aerial-01&orientation=landscape"
            alt="Fleet yard aerial view"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-12 md:px-10 md:pb-24 md:pt-20">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-brand-orange" />
              <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
                For Fleets & Carriers
              </span>
            </div>

            <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
              Need CDL Drivers?
              <br />
              <span className="text-brand-orange">We Fill Your Seats in 72 Hours.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 md:text-lg">
              Join 450+ vetted carriers who rely on our 12,000+ driver network.
              We hand-match qualified CDL Class A candidates to your lanes, equipment, and culture.
              No upfront fees. Pay only when drivers stay.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-white/80">
                <i className="ri-shield-check-line text-brand-orange" />
                <span>Verified drivers only</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <i className="ri-flashlight-line text-brand-orange" />
                <span>72-hour match guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <i className="ri-hand-coin-line text-brand-orange" />
                <span>No upfront fees</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED CARRIERS */}
      <section className="border-y border-brand-border bg-brand-surface px-6 py-10 md:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="mb-6 text-center text-xs font-bold uppercase tracking-wider text-brand-text-muted">
            Trusted By 450+ Carriers Nationwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {TRUSTED_CARRIERS.map((name) => (
              <span
                key={name}
                className="text-sm font-semibold text-brand-text-muted transition-colors hover:text-brand-text"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FORM + TRUST */}
      <section className="px-6 py-14 md:px-10 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_440px]">
            {/* LEFT — Why Partner */}
            <div className="order-2 lg:order-1">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-brand-orange">
                Why Partner With Us
              </span>
              <h2 className="font-heading text-3xl font-bold text-brand-text md:text-4xl">
                Hiring Drivers Should Not Be a Full-Time Job.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-brand-text-secondary">
                You run a fleet. We run a driver network. Let us handle the recruiting, screening, and matching so you can focus on moving freight.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: "ri-user-search-line",
                    title: "Pre-Qualified Candidates",
                    text: "Every driver has a valid Class A CDL, clean MVR, and verifiable work history. No tire-kickers.",
                  },
                  {
                    icon: "ri-global-line",
                    title: "Bilingual Recruiting",
                    text: "Deep access to Spanish-speaking and Balkan-American drivers. Our recruiters speak their language.",
                  },
                  {
                    icon: "ri-shield-check-line",
                    title: "72-Hour Guarantee",
                    text: "At least 3 matched, screened candidates within 72 hours, or you pay nothing.",
                  },
                  {
                    icon: "ri-hand-coin-line",
                    title: "Pay-After-Hire Model",
                    text: "We only invoice after a driver completes 30 days. If they quit early, we replace them free.",
                  },
                  {
                    icon: "ri-route-line",
                    title: "Lane-Specific Matching",
                    text: "We match drivers to your exact routes, not just your zip code. Better fits, longer retention.",
                  },
                  {
                    icon: "ri-customer-service-2-line",
                    title: "Dedicated Account Rep",
                    text: "One point of contact who knows your fleet, your lanes, and your hiring standards.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-brand-border bg-brand-surface p-5 transition-all hover:border-brand-orange/30"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange-light">
                      <i className={`${item.icon} text-brand-orange`} />
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-brand-text">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-brand-text-secondary">{item.text}</p>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { value: "12,000+", label: "Drivers in Network" },
                  { value: "450+", label: "Carrier Partners" },
                  { value: "72h", label: "Time to First Match" },
                  { value: "94%", label: "30-Day Retention" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-brand-border bg-brand-surface p-4 text-center"
                  >
                    <p className="font-heading text-2xl font-bold text-brand-text md:text-3xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-brand-text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Form */}
            <div className="order-1 lg:order-2">
              <div className="sticky top-6 rounded-2xl border border-brand-border bg-brand-surface p-6 md:p-8">
                {submitted ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange-light">
                      <i className="ri-check-line text-2xl text-brand-orange" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-brand-text">Request Received!</h3>
                    <p className="mx-auto mt-2 max-w-xs text-sm text-brand-text-secondary">
                      A fleet specialist will call you within 24 hours to discuss your open positions and driver requirements.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="mt-6 rounded-lg border border-brand-border px-6 py-2.5 text-sm font-semibold text-brand-text transition-colors hover:bg-brand-bg"
                    >
                      Submit Another Request
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    data-readdy-form
                    id="employer-lead-form"
                    className="space-y-4"
                  >
                    <div>
                      <h3 className="font-heading text-lg font-bold text-brand-text">Tell Us What You Need</h3>
                      <p className="text-xs text-brand-text-muted">
                        We collect all the details upfront so our first call is productive.
                      </p>
                    </div>

                    {/* Company */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-brand-text">Company Name</label>
                      <input
                        type="text"
                        name="company_name"
                        placeholder="e.g. Midwest Freight Solutions"
                        className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text placeholder-brand-text-muted outline-none transition-colors focus:border-brand-orange"
                      />
                      {errors.company_name && (
                        <p className="mt-1 text-xs text-red-500">{errors.company_name}</p>
                      )}
                    </div>

                    {/* Contact Name */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-brand-text">Your Name</label>
                      <input
                        type="text"
                        name="contact_name"
                        placeholder="e.g. John Miller"
                        className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text placeholder-brand-text-muted outline-none transition-colors focus:border-brand-orange"
                      />
                      {errors.contact_name && (
                        <p className="mt-1 text-xs text-red-500">{errors.contact_name}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Email */}
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-brand-text">Email</label>
                        <input
                          type="email"
                          name="email"
                          placeholder="john@company.com"
                          className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text placeholder-brand-text-muted outline-none transition-colors focus:border-brand-orange"
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-brand-text">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="(555) 123-4567"
                          className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text placeholder-brand-text-muted outline-none transition-colors focus:border-brand-orange"
                        />
                        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Fleet Size */}
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-brand-text">Fleet Size</label>
                        <select
                          name="fleet_size"
                          className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none transition-colors focus:border-brand-orange"
                        >
                          <option value="">Select...</option>
                          <option value="1-5">1 - 5 trucks</option>
                          <option value="6-20">6 - 20 trucks</option>
                          <option value="21-50">21 - 50 trucks</option>
                          <option value="50+">50+ trucks</option>
                        </select>
                        {errors.fleet_size && (
                          <p className="mt-1 text-xs text-red-500">{errors.fleet_size}</p>
                        )}
                      </div>

                      {/* Drivers Needed */}
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-brand-text">Drivers Needed</label>
                        <input
                          type="number"
                          name="drivers_needed"
                          min={1}
                          placeholder="3"
                          className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text placeholder-brand-text-muted outline-none transition-colors focus:border-brand-orange"
                        />
                        {errors.drivers_needed && (
                          <p className="mt-1 text-xs text-red-500">{errors.drivers_needed}</p>
                        )}
                      </div>
                    </div>

                    {/* Equipment */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-brand-text">Equipment Types Needed</label>
                      <div className="flex flex-wrap gap-2">
                        {EQUIPMENT_OPTIONS.map((eq) => (
                          <label
                            key={eq}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-xs font-medium text-brand-text-secondary transition-colors hover:border-brand-orange/40 has-[:checked]:border-brand-orange has-[:checked]:bg-brand-orange-light has-[:checked]:text-brand-orange"
                          >
                            <input type="checkbox" name="equipment_needed" value={eq} className="sr-only" />
                            {eq}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Route Type */}
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-brand-text">Route Type</label>
                        <select
                          name="route_type"
                          className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none transition-colors focus:border-brand-orange"
                        >
                          <option value="">Select...</option>
                          <option value="OTR">OTR (Over-the-Road)</option>
                          <option value="Regional">Regional</option>
                          <option value="Dedicated">Dedicated</option>
                          <option value="Local">Local</option>
                          <option value="Mixed">Mixed / Flexible</option>
                        </select>
                      </div>

                      {/* Urgency */}
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-brand-text">Hiring Urgency</label>
                        <select
                          name="urgency"
                          className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text outline-none transition-colors focus:border-brand-orange"
                        >
                          <option value="">Select...</option>
                          <option value="Immediate">Immediate (trucks sitting)</option>
                          <option value="1-2 weeks">1 - 2 weeks</option>
                          <option value="1 month">Within 1 month</option>
                          <option value="Flexible">Flexible / Planning ahead</option>
                        </select>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-brand-text">
                        Additional Details <span className="text-brand-text-muted">(optional)</span>
                      </label>
                      <textarea
                        name="notes"
                        rows={4}
                        maxLength={500}
                        onChange={(e) => setNotesLength(e.target.value.length)}
                        placeholder="Pay range, home time requirements, endorsements needed, anything else..."
                        className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-sm text-brand-text placeholder-brand-text-muted outline-none transition-colors focus:border-brand-orange resize-none"
                      />
                      <div className="mt-1 flex justify-between">
                        <span className="text-[10px] text-brand-text-muted">Max 500 characters</span>
                        <span className="text-[10px] text-brand-text-muted">{notesLength}/500</span>
                      </div>
                    </div>

                    {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-lg bg-brand-orange py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange-hover disabled:opacity-50 whitespace-nowrap"
                    >
                      {submitting ? "Sending..." : "Get Qualified Drivers - Free Quote"}
                    </button>

                    <p className="text-center text-xs text-brand-text-muted">
                      No obligation. We will never share your contact info with third parties.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-brand-surface px-6 py-14 md:px-10 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-brand-orange">
              The Process
            </span>
            <h2 className="font-heading text-3xl font-bold text-brand-text md:text-4xl">
              How <span className="text-brand-orange">Fleet Hiring</span> Works
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-brand-text-secondary">
              We have been matching carriers with reliable drivers since 2016. Here is the exact process.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Tell Us What You Need",
                text: "Fill out the form with your fleet size, equipment, route type, and urgency. The more detail, the better the match.",
                icon: "ri-file-list-3-line",
              },
              {
                step: "02",
                title: "We Match From 12,000+ Drivers",
                text: "Our recruiting team filters our active driver database for candidates who match your lanes, pay, home-time, and culture.",
                icon: "ri-user-search-line",
              },
              {
                step: "03",
                title: "You Interview & Hire",
                text: "We send you pre-screened, qualified candidates within 72 hours. You interview them, run your own checks, and make the hire.",
                icon: "ri-briefcase-line",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="group relative rounded-2xl border border-brand-border bg-brand-bg p-6 md:p-8"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange-light transition-colors group-hover:bg-brand-orange">
                  <i className={`${s.icon} text-xl text-brand-orange transition-colors group-hover:text-white`} />
                </div>
                <span className="font-heading text-3xl font-bold text-brand-orange/20">{s.step}</span>
                <h3 className="font-heading mt-2 text-lg font-bold text-brand-text">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-text-secondary">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-6 py-14 md:px-10 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-brand-orange">
              Partner Stories
            </span>
            <h2 className="font-heading text-3xl font-bold text-brand-text md:text-4xl">
              What Fleet Managers <span className="text-brand-orange">Say About Us</span>
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="flex flex-col rounded-2xl border border-brand-border bg-brand-surface p-6 md:p-8"
              >
                <i className="ri-double-quotes-l text-3xl text-brand-orange/30" />
                <p className="mt-4 flex-1 text-sm leading-relaxed text-brand-text">
                  {t.quote}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange-light font-bold text-sm text-brand-orange">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-brand-text">{t.name}</p>
                    <p className="text-xs text-brand-text-secondary">
                      {t.title} &middot; {t.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-brand-surface px-6 py-14 md:px-10 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-brand-orange">
              Common Questions
            </span>
            <h2 className="font-heading text-3xl font-bold text-brand-text md:text-4xl">
              Fleet Hiring <span className="text-brand-orange">FAQ</span>
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-brand-border bg-brand-bg overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-brand-surface"
                >
                  <span className="text-sm font-bold text-brand-text">{faq.q}</span>
                  <i
                    className={`ri-arrow-down-s-line text-lg text-brand-text-muted transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm leading-relaxed text-brand-text-secondary">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FOR DRIVERS */}
      <section className="px-6 py-14 md:px-10 md:py-20">
        <div className="mx-auto max-w-4xl rounded-2xl border border-brand-border bg-brand-surface p-8 text-center md:p-12">
          <h2 className="font-heading text-2xl font-bold text-brand-text md:text-3xl">
            Are You a Driver Looking for Work?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-brand-text-secondary md:text-base">
            That is our main thing. Browse active positions, apply in 30 seconds, and get a recruiter call within 15 minutes.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-block rounded-xl bg-brand-orange px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-brand-orange-hover whitespace-nowrap"
            >
              Find CDL Jobs
            </Link>
            <Link
              to="/blog"
              className="inline-block rounded-xl border border-brand-border px-8 py-3.5 text-sm font-semibold text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange whitespace-nowrap"
            >
              Read the Blog
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}