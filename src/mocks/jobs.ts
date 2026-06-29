export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  routeType: string;
  equipment: string;
  experienceRequired: string;
  truckInfo: string;
  payRate: string;
  payPeriod: string;
  homeTime: string;
  description: string;
  benefits: string[];
  requirements: string[];
  featured: boolean;
  badge?: "New" | "Urgently Hiring" | "Featured";
  postedAt: string;
  createdAt?: string | null;
  // Aggregation fields (optional — only set for scraped jobs)
  isAggregated?: boolean;
  sourceCarrier?: string;
  externalApplyUrl?: string;
}

const CITIES: { city: string; state: string; weight: number }[] = [
  { city: "Dallas", state: "TX", weight: 4 },
  { city: "Houston", state: "TX", weight: 4 },
  { city: "San Antonio", state: "TX", weight: 3 },
  { city: "Fort Worth", state: "TX", weight: 3 },
  { city: "Austin", state: "TX", weight: 3 },
  { city: "Laredo", state: "TX", weight: 2 },
  { city: "Lubbock", state: "TX", weight: 2 },
  { city: "Corpus Christi", state: "TX", weight: 2 },
  { city: "Beaumont", state: "TX", weight: 2 },
  { city: "Amarillo", state: "TX", weight: 2 },
  { city: "Midland", state: "TX", weight: 2 },
  { city: "El Paso", state: "TX", weight: 2 },
  { city: "Los Angeles", state: "CA", weight: 4 },
  { city: "Fresno", state: "CA", weight: 3 },
  { city: "San Diego", state: "CA", weight: 3 },
  { city: "Sacramento", state: "CA", weight: 3 },
  { city: "Ontario", state: "CA", weight: 3 },
  { city: "Stockton", state: "CA", weight: 2 },
  { city: "San Francisco", state: "CA", weight: 2 },
  { city: "Bakersfield", state: "CA", weight: 2 },
  { city: "Riverside", state: "CA", weight: 2 },
  { city: "Tampa", state: "FL", weight: 3 },
  { city: "Orlando", state: "FL", weight: 3 },
  { city: "Jacksonville", state: "FL", weight: 3 },
  { city: "Miami", state: "FL", weight: 3 },
  { city: "Lakeland", state: "FL", weight: 2 },
  { city: "Pensacola", state: "FL", weight: 2 },
  { city: "Fort Lauderdale", state: "FL", weight: 2 },
  { city: "Atlanta", state: "GA", weight: 4 },
  { city: "Savannah", state: "GA", weight: 3 },
  { city: "Macon", state: "GA", weight: 2 },
  { city: "Augusta", state: "GA", weight: 2 },
  { city: "Columbus", state: "GA", weight: 2 },
  { city: "Chicago", state: "IL", weight: 4 },
  { city: "Indianapolis", state: "IN", weight: 3 },
  { city: "Rockford", state: "IL", weight: 2 },
  { city: "Springfield", state: "IL", weight: 2 },
  { city: "Joliet", state: "IL", weight: 2 },
  { city: "Columbus", state: "OH", weight: 3 },
  { city: "Cleveland", state: "OH", weight: 3 },
  { city: "Cincinnati", state: "OH", weight: 2 },
  { city: "Toledo", state: "OH", weight: 2 },
  { city: "Dayton", state: "OH", weight: 2 },
  { city: "Allentown", state: "PA", weight: 3 },
  { city: "Pittsburgh", state: "PA", weight: 3 },
  { city: "Philadelphia", state: "PA", weight: 3 },
  { city: "Harrisburg", state: "PA", weight: 2 },
  { city: "Scranton", state: "PA", weight: 2 },
  { city: "Nashville", state: "TN", weight: 3 },
  { city: "Memphis", state: "TN", weight: 3 },
  { city: "Knoxville", state: "TN", weight: 2 },
  { city: "Chattanooga", state: "TN", weight: 2 },
  { city: "Charlotte", state: "NC", weight: 3 },
  { city: "Mooresville", state: "NC", weight: 2 },
  { city: "Raleigh", state: "NC", weight: 3 },
  { city: "Durham", state: "NC", weight: 2 },
  { city: "Kansas City", state: "MO", weight: 3 },
  { city: "St. Louis", state: "MO", weight: 3 },
  { city: "Columbia", state: "MO", weight: 2 },
  { city: "Joplin", state: "MO", weight: 2 },
  { city: "Springfield", state: "MO", weight: 2 },
  { city: "Detroit", state: "MI", weight: 3 },
  { city: "Grand Rapids", state: "MI", weight: 2 },
  { city: "Phoenix", state: "AZ", weight: 3 },
  { city: "Tempe", state: "AZ", weight: 2 },
  { city: "Seattle", state: "WA", weight: 2 },
  { city: "Salt Lake City", state: "UT", weight: 2 },
  { city: "Denver", state: "CO", weight: 3 },
  { city: "Little Rock", state: "AR", weight: 2 },
  { city: "Oklahoma City", state: "OK", weight: 2 },
  { city: "Albuquerque", state: "NM", weight: 2 },
  { city: "Las Vegas", state: "NV", weight: 2 },
  { city: "Richmond", state: "VA", weight: 2 },
  { city: "Louisville", state: "KY", weight: 2 },
  { city: "Jackson", state: "MS", weight: 2 },
  { city: "Portland", state: "OR", weight: 2 },
  { city: "Minneapolis", state: "MN", weight: 2 },
  { city: "Marshfield", state: "WI", weight: 2 },
  { city: "Goodlettsville", state: "TN", weight: 2 },
  { city: "Gary", state: "IN", weight: 2 },
  { city: "St. Cloud", state: "MN", weight: 2 },
  { city: "Peoria", state: "IL", weight: 2 },
  { city: "Marysville", state: "OH", weight: 2 },
  { city: "Greensboro", state: "NC", weight: 2 },
  { city: "Greensboro", state: "NC", weight: 2 },
  { city: "Birmingham", state: "AL", weight: 2 },
  { city: "New Orleans", state: "LA", weight: 2 },
  { city: "Baton Rouge", state: "LA", weight: 2 },
  { city: "Huntsville", state: "AL", weight: 2 },
  { city: "Tucson", state: "AZ", weight: 2 },
  { city: "Boise", state: "ID", weight: 2 },
  { city: "Spokane", state: "WA", weight: 2 },
  { city: "Des Moines", state: "IA", weight: 2 },
  { city: "Omaha", state: "NE", weight: 2 },
  { city: "Wichita", state: "KS", weight: 2 },
  { city: "Tulsa", state: "OK", weight: 2 },
  { city: "Reno", state: "NV", weight: 2 },
  { city: "Billings", state: "MT", weight: 2 },
  { city: "Cheyenne", state: "WY", weight: 2 },
  { city: "Sioux Falls", state: "SD", weight: 2 },
  { city: "Fargo", state: "ND", weight: 2 },
  { city: "Anchorage", state: "AK", weight: 1 },
  { city: "Honolulu", state: "HI", weight: 1 },
  { city: "New York", state: "NY", weight: 3 },
  { city: "Buffalo", state: "NY", weight: 2 },
  { city: "Syracuse", state: "NY", weight: 2 },
  { city: "Rochester", state: "NY", weight: 2 },
  { city: "Boston", state: "MA", weight: 2 },
  { city: "Worcester", state: "MA", weight: 2 },
  { city: "Baltimore", state: "MD", weight: 2 },
  { city: "Newark", state: "NJ", weight: 2 },
  { city: "Hartford", state: "CT", weight: 2 },
  { city: "Providence", state: "RI", weight: 2 },
];

const COMPANIES = [
  "Schneider National", "J.B. Hunt Transport", "TMC Transportation", "XPO Logistics",
  "Landstar Ranger", "Werner Enterprises", "Quality Carriers", "Crete Carrier",
  "C.R. England", "Knight Transportation", "Swift Transportation", "Roehl Transport",
  "Maverick Transportation", "Heartland Express", "Prime Inc.", "Old Dominion Freight",
  "USA Truck", "KLLM Transport", "McElroy Truck Lines", "Builders Transportation",
  "Anderson Trucking", "Transport America", "Marten Transport", "Nussbaum Transportation",
  "Penske Logistics", "Ryder Supply Chain", "FedEx Freight", "UPS Freight",
  "Yusen Logistics", "Maher Terminals", "Pacific Coast Logistics", "SunRun Logistics",
  "Sunbelt Rentals", "Tropicana Logistics", "Harris Teeter Distribution", "Loves Travel Stops",
  "Sysco Foods", "Ralphs Grocery", "Anheuser-Busch Logistics", "AmerisourceBergen",
  "Boeing Logistics", "GM Logistics", "First Solar Logistics", "Lynden Transport",
  "Trimac Transportation", "Lynden Transport", "US LBM Holdings", "Atlas Construction Supply",
  "MTC Transportation", "MTC Transportation", "McLane Company", "P.A.M. Transport",
  "WEL Companies", "Boyd Bros. Transportation", "System Transport", "Pride Transport",
];

const EQUIPMENT = [
  "53' Dry Van", "53' Reefer", "48' Flatbed", "48' Step Deck", "Tanker", "Chassis / Container", "Day Cab / Box",
];

const ROUTE_TYPES = ["OTR", "Regional", "Local", "Dedicated"];

const TITLES: Record<string, string[]> = {
  "53' Dry Van": ["OTR Dry Van - No-Touch", "Regional Dry Van", "Local Dry Van - Day Shift", "Dedicated Dry Van", "Dry Van Team Driver", "OTR Dry Van - National Lanes"],
  "53' Reefer": ["OTR Reefer - Temperature Controlled", "Regional Reefer", "Local Reefer - Grocery", "Dedicated Reefer", "Reefer Team", "Southeast Reefer"],
  "48' Flatbed": ["OTR Flatbed - Heavy Haul", "Regional Flatbed", "Local Flatbed - Construction", "Flatbed - Steel", "Flatbed - Oversized", "Dedicated Flatbed"],
  "48' Step Deck": ["OTR Step Deck - Heavy Haul", "Regional Step Deck", "Step Deck - Equipment", "Dedicated Step Deck", "Step Deck - Wind Energy"],
  Tanker: ["OTR Tanker - Hazmat", "Regional Tanker", "Local Tanker - Fuel", "Tanker - Chemical", "Food Grade Tanker", "Dedicated Tanker"],
  "Chassis / Container": ["Local Intermodal - Drayage", "Port Container Drayage", "Intermodal Rail Yard", "Dedicated Intermodal", "Local Container Moves"],
  "Day Cab / Box": ["Local Day Cab - Delivery", "Day Shift Local", "Day Cab - Last Mile", "Local Box Truck", "Urban Delivery"],
};

const EXPERIENCE_OPTIONS = ["Less than 1 Year", "6+ Months", "1+ Years", "1-3 Years", "2+ Years", "3+ Years"];

const TRUCKS = [
  "2024 Freightliner Cascadia", "2024 Peterbilt 579", "2024 Kenworth T680", "2024 International LT",
  "2023 Freightliner Cascadia", "2023 Peterbilt 389", "2023 Kenworth T680", "2023 International HV",
  "2023 Volvo VNL 860", "2024 Freightliner M2", "2024 Kenworth T880", "2024 International HV",
  "2024 Peterbilt 389", "2024 Volvo VNL 860", "2023 International LT",
];

const PAY_RATES: Record<string, string[]> = {
  CPM: ["$0.65 CPM", "$0.68 CPM", "$0.70 CPM", "$0.71 CPM", "$0.72 CPM", "$0.73 CPM", "$0.74 CPM", "$0.75 CPM", "$0.76 CPM", "$0.78 CPM", "$0.79 CPM", "$0.80 CPM"],
  Weekly: ["$1,100/Week", "$1,150/Week", "$1,180/Week", "$1,200/Week", "$1,250/Week", "$1,300/Week", "$1,350/Week", "$1,400/Week", "$1,450/Week", "$1,500/Week"],
  Mile: ["$1.80/mi", "$1.85/mi", "$1.90/mi", "$2.00/mi", "$2.10/mi", "$2.20/mi", "$2.25/mi", "$2.35/mi"],
};

const HOME_TIME = ["Home Daily", "Home Weekly", "Home Every Weekend", "Home Every 10-14 Days", "Home Every 14 Days", "Home Every 2 Weeks", "Home 3x Per Week", "Flexible Scheduling"];

const DESCRIPTIONS: Record<string, string[]> = {
  OTR: [
    "OTR operation across the continental US. No-touch freight with pre-planned routes. Consistent miles and strong dispatch support.",
    "Cross-country OTR lanes. Coast-to-coast freight with automatic trucks and 24/7 driver support. Consistent miles year-round.",
    "National OTR dry van with strong freight network. Automatic trucks available. One of the most reliable carriers in the industry.",
    "OTR operation with dedicated lanes. Consistent miles and strong pay. Newer fleet with ELDs and APUs.",
  ],
  Regional: [
    "Regional lanes with consistent weekly home time. No-touch freight, mostly drop-and-hook. Predictable routes and strong pay.",
    "Regional freight with guaranteed weekly home time. Family-friendly carrier with strong benefits and retention.",
    "Regional operation with dedicated lanes. Drop-and-hook, no-touch. One of the most driver-friendly companies in the region.",
    "Regional lanes with top-tier pay. Consistent freight from major retail partners. Automatic trucks available.",
  ],
  Local: [
    "Local routes with home every night. Day shift, Monday through Friday. Stable year-round freight with no overnight travel.",
    "Local delivery routes with daily home time. Early morning start, home by afternoon. Overtime available.",
    "Local day shift with guaranteed home time. No weekends required. Strong benefits and stable employment.",
    "Local metro delivery. Home every night. Predictable routes with established customer relationships.",
  ],
  Dedicated: [
    "Dedicated account with predictable routes. Drop-and-hook, no-touch. Consistent schedule and guaranteed home time.",
    "Dedicated distribution center account. No-touch freight with guaranteed weekly pay. Best-in-class benefits.",
    "Dedicated retail account with 100% drop-and-hook. Consistent lanes and strong pay. One of the most stable jobs in trucking.",
    "Dedicated fleet with assigned lanes and customers. Predictable miles, guaranteed home time, and excellent pay.",
  ],
};

const BENEFITS = [
  "Home time guaranteed", "Health insurance from day 1", "401k with company match", "Quarterly safety bonuses",
  "No-touch freight", "Rider and pet policy", "Automatic trucks", "Weekly direct deposit",
  "Tuition reimbursement", "Sign-on bonus", "Fuel card and discounts", "24/7 dispatch support",
  "Paid orientation", "Paid vacation from day 1", "APU-equipped trucks", "Detention pay after 2 hours",
  "No forced dispatch", "Clean cab bonus", "Referral bonuses", "Overtime pay available",
  "Union wages and pension", "Paid holidays", "Safety recognition program", "Newer fleet",
  "Profit sharing", "Military veteran bonus", "Hazmat training paid", "TWIC card reimbursed",
  "Uniform allowance", "Steady year-round freight", "Local routes only", "Bilingual dispatchers",
];

const REQUIREMENTS = [
  "Valid Class A CDL", "Clean MVR", "No major violations in 3 years", "Pass DOT physical and drug screen",
  "Clean background check", "1 year experience", "2 years experience", "6 months experience",
  "No DUI in last 5 years", "Hazmat and Tanker endorsements", "TWIC card", "Flatbed experience",
  "Reefer experience preferred", "Team driving experience", "Willing to run 48 states", "New CDL grads welcome",
];

const BADGES: ("New" | "Urgently Hiring" | "Featured" | undefined)[] = [
  undefined, undefined, undefined, "New", "Urgently Hiring", undefined, "Featured", undefined, undefined, "New",
  "Urgently Hiring", undefined, undefined, undefined, "Featured", undefined, "New", undefined, undefined, "Urgently Hiring",
];

const POSTED_AT = [
  "Posted today", "Posted today", "Posted today", "Posted today", "Posted today",
  "Posted 2 days ago", "Posted 2 days ago", "Posted 2 days ago",
  "Posted 3 days ago", "Posted 3 days ago",
  "Posted 4 days ago", "Posted 4 days ago",
  "Posted 5 days ago", "Posted 5 days ago",
  "Posted 6 days ago", "Posted 6 days ago",
  "Posted 1 week ago", "Posted 1 week ago",
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickWeighted<T>(arr: { value: T; weight: number }[], rng: () => number): T {
  const total = arr.reduce((sum, a) => sum + a.weight, 0);
  let r = rng() * total;
  for (const item of arr) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return arr[arr.length - 1].value;
}

function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function generateJobs(count: number): Job[] {
  const rng = seededRandom(12345);
  const weightedCities = CITIES.map((c) => ({
    value: c,
    weight: c.weight,
  }));

  const result: Job[] = [];
  const usedCompanyLocations = new Set<string>();

  for (let i = 0; i < count; i++) {
    const cityData = pickWeighted(weightedCities, rng);
    const city = cityData.city;
    const state = cityData.state;
    const location = `${city}, ${state}`;

    let company: string;
    let attempts = 0;
    do {
      company = pick(COMPANIES, rng);
      attempts++;
    } while (usedCompanyLocations.has(`${company}-${location}`) && attempts < 50);
    usedCompanyLocations.add(`${company}-${location}`);

    const equipment = pick(EQUIPMENT, rng);
    const routeType = pick(ROUTE_TYPES, rng);
    const titleCandidates = TITLES[equipment] || TITLES["53' Dry Van"];
    const title = pick(titleCandidates, rng);
    const experience = pick(EXPERIENCE_OPTIONS, rng);
    const truck = pick(TRUCKS, rng);
    const home = pick(HOME_TIME, rng);
    const descriptions = DESCRIPTIONS[routeType] || DESCRIPTIONS.OTR;
    const description = pick(descriptions, rng);
    const shuffledBenefits = shuffleArray(BENEFITS, rng);
    const shuffledRequirements = shuffleArray(REQUIREMENTS, rng);
    const badge = pick(BADGES, rng);
    const postedAt = pick(POSTED_AT, rng);

    const payType = rng() > 0.6 ? "Weekly" : rng() > 0.3 ? "CPM" : "Mile";
    const payPeriod = payType === "Mile" ? "CPM" : payType;
    const payRate = pick(PAY_RATES[payType], rng);

    const featured = i < 6;

    result.push({
      id: String(i + 1),
      title,
      company,
      location,
      routeType,
      equipment,
      experienceRequired: experience,
      truckInfo: truck,
      payRate,
      payPeriod,
      homeTime: home,
      description,
      benefits: shuffledBenefits.slice(0, 5),
      requirements: shuffledRequirements.slice(0, 4),
      featured,
      badge,
      postedAt,
    });
  }

  return result;
}

export const jobs: Job[] = generateJobs(100);

export interface ApplicationData {
  id: string;
  fullName: string;
  phone: string;
  hasCdl: boolean;
  experience: string;
  jobId: string;
  jobTitle: string;
  status: "new" | "in_progress" | "placed";
  notes: string;
  createdAt: string;
}

export const mockApplications: ApplicationData[] = [
  {
    id: "app-1",
    fullName: "James Mitchell",
    phone: "(312) 555-0147",
    hasCdl: true,
    experience: "3+ years",
    jobId: "1",
    jobTitle: "Midwest Regional - Dry Van",
    status: "new",
    notes: "",
    createdAt: "2026-05-17T09:23:00Z",
  },
  {
    id: "app-2",
    fullName: "Carlos Rodriguez",
    phone: "(404) 555-0298",
    hasCdl: true,
    experience: "1-3 years",
    jobId: "2",
    jobTitle: "Southeast Dedicated - Reefer Team",
    status: "in_progress",
    notes: "Called back, waiting on MVR check",
    createdAt: "2026-05-17T08:45:00Z",
  },
  {
    id: "app-3",
    fullName: "Robert 'Duke' Henderson",
    phone: "(515) 555-0334",
    hasCdl: true,
    experience: "3+ years",
    jobId: "3",
    jobTitle: "Flatbed - Steel Haul",
    status: "placed",
    notes: "Owner-op with 2021 Volvo. Placed with TMC.",
    createdAt: "2026-05-16T16:12:00Z",
  },
  {
    id: "app-4",
    fullName: "Tyrone Washington",
    phone: "(773) 555-0412",
    hasCdl: true,
    experience: "Less than 1 year",
    jobId: "4",
    jobTitle: "Local Intermodal - Day Shift",
    status: "new",
    notes: "",
    createdAt: "2026-05-17T10:05:00Z",
  },
  {
    id: "app-5",
    fullName: "Derek 'Slim' Collins",
    phone: "(602) 555-0555",
    hasCdl: true,
    experience: "3+ years",
    jobId: "5",
    jobTitle: "Western 11 - Step Deck Solo",
    status: "in_progress",
    notes: "Phone interview scheduled for 2pm today",
    createdAt: "2026-05-17T07:30:00Z",
  },
  {
    id: "app-6",
    fullName: "Marcus Thompson",
    phone: "(610) 555-0678",
    hasCdl: false,
    experience: "Less than 1 year",
    jobId: "6",
    jobTitle: "Northeast Regional - Dry Van",
    status: "new",
    notes: "Needs CDL referral to training school",
    createdAt: "2026-05-17T11:15:00Z",
  },
];