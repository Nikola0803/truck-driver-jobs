/**
 * SEO content sections for /cdl-jobs/:slug landing pages.
 * Each entry provides a short intro blurb, key facts, and FAQ items
 * that appear below the job listings to give Google something to index.
 */

export interface LandingContent {
  intro: string;
  highlights: { icon: string; label: string; value: string }[];
  faq: { q: string; a: string }[];
  relatedLinks: { label: string; href: string }[];
}

export const STATE_CONTENT: Record<string, LandingContent> = {
  texas: {
    intro:
      "Texas is the largest freight state in the continental US, with major trucking hubs in Dallas-Fort Worth, Houston, San Antonio, and the Laredo border crossing — the busiest land port in the country. CDL-A drivers in Texas benefit from year-round demand, competitive pay, and a booming logistics sector fueled by energy, manufacturing, and cross-border trade with Mexico.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$78,000 – $100,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "Dallas, Houston, Laredo" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Flatbed, Tanker, Dry Van" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "How much do truck drivers make in Texas?",
        a: "CDL-A truck drivers in Texas earn between $78,000 and $100,000 per year depending on route type, equipment, and carrier. OTR and flatbed drivers typically earn the most. Owner-operators can gross $140,000–$200,000+ before expenses.",
      },
      {
        q: "What CDL jobs are most in demand in Texas?",
        a: "Flatbed, tanker, and dry van are the most in-demand equipment types in Texas. The Houston petrochemical corridor drives strong demand for tanker and hazmat-certified drivers, while DFW's distribution network needs thousands of dry van and reefer drivers.",
      },
      {
        q: "Do I need a Texas CDL to drive trucks in Texas?",
        a: "You need a valid CDL-A from any US state to drive commercially in Texas. If you hold an out-of-state CDL, you can transfer it to a Texas CDL at any DPS office without retaking the skills test, as long as your license is current.",
      },
      {
        q: "How do I apply for trucking jobs in Texas?",
        a: "Browse verified Texas CDL jobs on this page and click Apply. No resume needed — a recruiter from the carrier will contact you within 24–72 hours to verify your CDL and walk through the hiring process.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in Florida", href: "/cdl-jobs/florida" },
      { label: "CDL Jobs in Georgia", href: "/cdl-jobs/georgia" },
      { label: "Flatbed Jobs", href: "/cdl-jobs/flatbed" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  florida: {
    intro:
      "Florida's growing population, tourism industry, and year-round construction activity make it a strong market for CDL drivers. Key freight corridors run from Miami and Tampa north through Orlando and Jacksonville. Produce hauling from South Florida and refrigerated freight to and from the Southeast keep reefer and dry van demand consistently high.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$73,000 – $92,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "Miami, Tampa, Jacksonville" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Dry Van, Reefer, Flatbed" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "What is the average truck driver salary in Florida?",
        a: "Florida CDL-A drivers average $73,000–$92,000 per year. Local and dedicated routes tend to pay on the lower end, while OTR and specialized equipment like flatbed and tanker offer higher rates.",
      },
      {
        q: "Are there local CDL driving jobs in Florida?",
        a: "Yes. Florida has a strong local and dedicated lane market, especially around Miami, Orlando, and Tampa. Retailers, grocery distributors, and beverage companies hire local CDL drivers for day-cab routes with daily home time.",
      },
      {
        q: "Is there a truck driver shortage in Florida?",
        a: "Yes. Florida, like the rest of the country, faces an ongoing CDL driver shortage. This keeps wages competitive and hiring bonuses active — many Florida carriers offer $3,000–$10,000 sign-on bonuses in 2025.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in Georgia", href: "/cdl-jobs/georgia" },
      { label: "CDL Jobs in Texas", href: "/cdl-jobs/texas" },
      { label: "Reefer Jobs", href: "/cdl-jobs/reefer" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  georgia: {
    intro:
      "Georgia is one of the fastest-growing logistics markets in the Southeast, anchored by Atlanta's massive distribution infrastructure and the Port of Savannah — the third-busiest container port in the United States. CDL drivers in Georgia enjoy strong demand, competitive pay, and access to freight lanes running north into the Midwest and south to Florida.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$74,000 – $93,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "Atlanta, Savannah, Macon" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Dry Van, Reefer, Flatbed" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "Why is Georgia a good state for truck drivers?",
        a: "Georgia's Port of Savannah is the third-busiest container port in the US, and Atlanta is a top distribution hub for the Southeast. This creates constant demand for CDL drivers with strong pay and regular freight availability.",
      },
      {
        q: "What CDL jobs are available in Atlanta?",
        a: "Atlanta offers local, regional, and OTR opportunities. Large warehousing complexes in Kennesaw, Conyers, and Forest Park run dedicated routes. The I-85, I-75, and I-20 corridors feed steady freight into and out of the city.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in Florida", href: "/cdl-jobs/florida" },
      { label: "CDL Jobs in South Carolina", href: "/cdl-jobs/south-carolina" },
      { label: "Dry Van Jobs", href: "/cdl-jobs/dry-van" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  california: {
    intro:
      "California is the largest freight market in the United States, driven by the Port of Los Angeles, the Port of Long Beach (the two busiest ports in the country), and massive distribution networks serving 40 million residents. CDL drivers in California earn some of the highest wages in the nation, though the regulatory environment (AB5, CARB emissions) adds complexity for owner-operators.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$82,000 – $108,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "Los Angeles, Fresno, Sacramento" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Chassis, Dry Van, Reefer" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "How much do truck drivers earn in California?",
        a: "California CDL-A drivers are among the highest paid in the country, averaging $82,000–$108,000 per year. Port drayage drivers in LA/Long Beach often earn $90,000–$120,000. California's higher cost of living drives wages above the national average.",
      },
      {
        q: "What are CARB emissions requirements for truckers in California?",
        a: "California's Air Resources Board (CARB) requires trucks operating in California to meet strict emissions standards. Most trucks manufactured after 2010 are compliant, but older trucks may need engine upgrades or replacement to legally haul freight in California.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in Texas", href: "/cdl-jobs/texas" },
      { label: "CDL Jobs in Nevada", href: "/jobs" },
      { label: "Dry Van Jobs", href: "/cdl-jobs/dry-van" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  illinois: {
    intro:
      "Illinois sits at the crossroads of American freight — Chicago is the largest rail hub in the US and a critical distribution center for goods moving between the coasts. With O'Hare International Airport, intermodal yards, and thousands of miles of interstate highway converging in the Chicago metro, CDL drivers in Illinois are never short of work.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$76,000 – $95,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "Chicago, Joliet, Peoria" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Dry Van, Reefer, Flatbed" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "Why is Chicago important for trucking?",
        a: "Chicago is where six major Class I railroads converge, making it the largest intermodal hub in the country. Trucks connect the rail yards to distribution centers across the Midwest. The I-80/I-90/I-55 corridors see some of the heaviest truck traffic in the US.",
      },
      {
        q: "Are there local CDL jobs near Chicago?",
        a: "Yes — the Chicago metro and its suburbs (Joliet, Elgin, Bolingbrook, Elk Grove Village) are packed with warehouses, food distributors, and manufacturers running dedicated local routes with daily home time.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in Ohio", href: "/cdl-jobs/ohio" },
      { label: "CDL Jobs in Indiana", href: "/cdl-jobs/indiana" },
      { label: "Dry Van Jobs", href: "/cdl-jobs/dry-van" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  ohio: {
    intro:
      "Ohio's central location along I-70, I-71, and I-75 makes it a critical freight corridor between the East Coast, Midwest, and South. Columbus, Cleveland, and Cincinnati are major distribution hubs with high demand for CDL drivers across all equipment types.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$72,000 – $91,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "Columbus, Cleveland, Cincinnati" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Dry Van, Flatbed, Reefer" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "What trucking jobs are available in Ohio?",
        a: "Ohio offers a full mix of local, regional, and OTR opportunities. Columbus is a major e-commerce distribution center. Cleveland and Toledo handle automotive parts. Cincinnati is a key hub on the I-71/I-75 corridor connecting the Midwest to the South.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in Indiana", href: "/cdl-jobs/indiana" },
      { label: "CDL Jobs in Pennsylvania", href: "/cdl-jobs/pennsylvania" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  pennsylvania: {
    intro:
      "Pennsylvania is one of the most heavily trafficked freight corridors on the East Coast, sitting between the New York metro and the Midwest. The Pennsylvania Turnpike, I-78, and I-81 carry enormous truck volume. Philadelphia, Pittsburgh, and the Lehigh Valley are major logistics hubs.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$74,000 – $93,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "Philadelphia, Pittsburgh, Allentown" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Dry Van, Reefer, Flatbed" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "Are there trucking jobs near Philadelphia?",
        a: "Yes — the Philadelphia and Lehigh Valley area is one of the most active freight markets in the Northeast, with major e-commerce fulfillment centers, food distributors, and manufacturing plants all needing CDL drivers.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in New Jersey", href: "/cdl-jobs/new-jersey" },
      { label: "CDL Jobs in Maryland", href: "/cdl-jobs/maryland" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  "north-carolina": {
    intro:
      "North Carolina's logistics market is growing rapidly, anchored by Charlotte's distribution network and the Research Triangle's manufacturing sector. The I-85 and I-40 corridors make North Carolina a key link between the Mid-Atlantic and Southeast freight markets.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$71,000 – $89,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "Charlotte, Greensboro, Raleigh" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Dry Van, Reefer, Flatbed" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "What CDL jobs are available in Charlotte, NC?",
        a: "Charlotte is a major distribution hub with significant demand for dry van and reefer drivers. Local and regional positions with daily or weekly home time are available from multiple carriers operating out of the Charlotte metro.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in South Carolina", href: "/cdl-jobs/south-carolina" },
      { label: "CDL Jobs in Virginia", href: "/cdl-jobs/virginia" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  "south-carolina": {
    intro:
      "South Carolina's Port of Charleston is one of the fastest-growing ports on the East Coast, and BMW's manufacturing plant in Spartanburg generates constant automotive freight. CDL drivers in South Carolina benefit from growing freight demand and a lower cost of living.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$70,000 – $88,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "Charleston, Spartanburg, Columbia" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Dry Van, Flatbed, Reefer" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "Is trucking in demand in South Carolina?",
        a: "Yes — South Carolina's Port of Charleston and BMW Spartanburg plant drive significant freight volume, and the broader Upstate and Lowcountry regions have active distribution networks requiring CDL drivers.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in North Carolina", href: "/cdl-jobs/north-carolina" },
      { label: "CDL Jobs in Georgia", href: "/cdl-jobs/georgia" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  virginia: {
    intro:
      "Virginia's location on the I-95 corridor makes it a constant-flow freight market, with the Port of Virginia in Norfolk being one of the most modern and efficient ports on the East Coast. Northern Virginia serves as a logistics gateway to the DC metro market.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$73,000 – $92,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "Richmond, Norfolk, Northern VA" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Dry Van, Reefer, Flatbed" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "Are there CDL jobs near Richmond, VA?",
        a: "Yes — Richmond sits at the junction of I-95 and I-64, making it a significant freight hub. Multiple carriers and distribution centers in the Richmond area hire CDL drivers for local, regional, and OTR positions.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in Maryland", href: "/cdl-jobs/maryland" },
      { label: "CDL Jobs in North Carolina", href: "/cdl-jobs/north-carolina" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  tennessee: {
    intro:
      "Tennessee's geographic center makes it ideal for regional freight distribution. Nashville and Memphis are both major logistics hubs — Memphis in particular is home to FedEx World Hub and one of the largest air cargo facilities in the world, which drives significant ground freight activity.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$72,000 – $90,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "Memphis, Nashville, Chattanooga" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Dry Van, Reefer, Flatbed" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "Why is Memphis important for trucking?",
        a: "Memphis is a global logistics hub — home to FedEx's world headquarters and hub, plus a major Mississippi River port and rail intersections. This makes the Memphis metro one of the most freight-dense areas in the US.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in Alabama", href: "/cdl-jobs/alabama" },
      { label: "CDL Jobs in Georgia", href: "/cdl-jobs/georgia" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  alabama: {
    intro:
      "Alabama's automotive manufacturing boom — with Mercedes, Honda, and Hyundai all operating major plants — has driven significant demand for flatbed and specialized freight drivers. Birmingham and Mobile are growing logistics centers with strong hiring activity.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$69,000 – $87,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "Birmingham, Mobile, Huntsville" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Flatbed, Dry Van, Tanker" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "What CDL jobs are available in Alabama?",
        a: "Alabama's automotive manufacturing sector creates strong demand for flatbed drivers hauling parts and finished vehicles. The Port of Mobile and Birmingham's distribution network also support dry van and tanker positions.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in Mississippi", href: "/cdl-jobs/mississippi" },
      { label: "CDL Jobs in Tennessee", href: "/cdl-jobs/tennessee" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  mississippi: {
    intro:
      "Mississippi's location along the Mississippi River and Gulf Coast makes it an important freight corridor for bulk commodities, petrochemicals, and agriculture. The state offers competitive CDL wages relative to its lower cost of living.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$67,000 – $84,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "Jackson, Gulfport, Meridian" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Tanker, Dry Van, Flatbed" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "Are there good paying truck driver jobs in Mississippi?",
        a: "Yes — while base wages are slightly below the national average, Mississippi's very low cost of living means purchasing power is strong. Tanker and chemical transport jobs along the Gulf Coast pay above-average rates.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in Alabama", href: "/cdl-jobs/alabama" },
      { label: "CDL Jobs in Louisiana", href: "/cdl-jobs/louisiana" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  indiana: {
    intro:
      "Indiana is one of the most trucking-friendly states in the Midwest, sitting at the intersection of I-65, I-70, and I-74. Indianapolis is a major distribution hub, and the state's automotive and pharmaceutical manufacturing industries generate consistent freight demand.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$72,000 – $90,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "Indianapolis, Fort Wayne, Evansville" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Dry Van, Flatbed, Reefer" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "Is Indianapolis a good city for truck drivers?",
        a: "Indianapolis is excellent for CDL drivers — it sits at the crossroads of multiple interstate highways and hosts massive distribution centers for Amazon, Walmart, and auto parts manufacturers. Local, regional, and OTR opportunities are all strong here.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in Ohio", href: "/cdl-jobs/ohio" },
      { label: "CDL Jobs in Illinois", href: "/cdl-jobs/illinois" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  "new-jersey": {
    intro:
      "New Jersey is the gateway to the New York metro market — the largest consumer market in the US. Port Newark and Port Elizabeth handle massive container volumes, and the turnpike corridor is one of the most freight-dense highways in the country. CDL drivers in NJ earn well above the national average.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$80,000 – $105,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "Newark, Edison, Trenton" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Chassis, Dry Van, Reefer" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "How much do truck drivers make in New Jersey?",
        a: "New Jersey CDL-A drivers average $80,000–$105,000 per year — well above the national average. Port drayage, local delivery, and dedicated routes around the Newark/Edison area often pay the most due to high demand and cost of living.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in New York", href: "/cdl-jobs/new-york" },
      { label: "CDL Jobs in Pennsylvania", href: "/cdl-jobs/pennsylvania" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  "new-york": {
    intro:
      "New York state offers CDL opportunities ranging from local city delivery in the five boroughs to upstate regional freight and long-haul OTR. NYC local drivers command premium wages due to traffic complexity, while upstate drivers benefit from less congestion and steady freight from manufacturing and agriculture.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$79,000 – $103,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "New York City, Buffalo, Albany" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Dry Van, Reefer, Chassis" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "Are CDL driving jobs available in New York City?",
        a: "Yes — NYC has a strong local CDL market for food distribution, beverage delivery, and building materials. Navigating the city requires experience, but the pay is among the highest in the country for local drivers.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in New Jersey", href: "/cdl-jobs/new-jersey" },
      { label: "CDL Jobs in Pennsylvania", href: "/cdl-jobs/pennsylvania" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  maryland: {
    intro:
      "Maryland's position on the I-95 corridor and proximity to the Port of Baltimore and Washington DC metro makes it a strong CDL market. The port handles significant auto imports and ro-ro freight, while the DC metro's distribution needs keep demand for dedicated and local drivers high.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$76,000 – $96,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "Baltimore, Hagerstown, Beltway" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Dry Van, Auto Transport, Flatbed" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "Are there truck driver jobs near Baltimore, MD?",
        a: "Yes — Baltimore's port and its surrounding distribution network create strong demand for CDL drivers. The I-70 and I-95 corridors running through Maryland carry enormous freight volume with regional and local opportunities.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in Virginia", href: "/cdl-jobs/virginia" },
      { label: "CDL Jobs in Pennsylvania", href: "/cdl-jobs/pennsylvania" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  louisiana: {
    intro:
      "Louisiana's Port of New Orleans and Port of South Louisiana are among the largest ports by tonnage in the Western Hemisphere. The oil and gas industry generates constant demand for tanker and flatbed drivers, and chemical transport along the Mississippi River corridor offers premium pay.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$71,000 – $92,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "New Orleans, Baton Rouge, Shreveport" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Tanker, Flatbed, Dry Van" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "What type of CDL jobs pay the most in Louisiana?",
        a: "Tanker and hazmat drivers in Louisiana's petrochemical corridor (Baton Rouge, Lake Charles, Beaumont border area) earn the highest wages — often $85,000–$105,000/year. Flatbed for oil field equipment is also well-paid.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in Mississippi", href: "/cdl-jobs/mississippi" },
      { label: "CDL Jobs in Texas", href: "/cdl-jobs/texas" },
      { label: "Tanker Jobs", href: "/cdl-jobs/tanker" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  wisconsin: {
    intro:
      "Wisconsin's dairy, food manufacturing, and paper industries generate steady freight demand year-round. Milwaukee and Green Bay are active logistics hubs, and the state's position near Chicago's distribution network makes regional freight lanes readily available.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$71,000 – $89,000" },
      { icon: "ri-map-pin-line", label: "Top Hubs", value: "Milwaukee, Green Bay, Madison" },
      { icon: "ri-truck-line", label: "Top Equipment", value: "Reefer, Dry Van, Tanker" },
      { icon: "ri-briefcase-line", label: "CDL Age", value: "21+ interstate, 18+ intrastate" },
    ],
    faq: [
      {
        q: "Is there demand for CDL drivers in Wisconsin?",
        a: "Yes — Wisconsin's food and dairy industries, combined with its proximity to Chicago, create steady demand for CDL-A drivers. Reefer experience is especially valued for dairy and produce transport.",
      },
    ],
    relatedLinks: [
      { label: "CDL Jobs in Illinois", href: "/cdl-jobs/illinois" },
      { label: "CDL Jobs in Indiana", href: "/cdl-jobs/indiana" },
      { label: "Reefer Jobs", href: "/cdl-jobs/reefer" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },
};

export const EQUIPMENT_CONTENT: Record<string, LandingContent> = {
  "dry-van": {
    intro:
      "Dry van is the most common trailer type in American trucking — enclosed, weatherproof trailers carrying consumer goods, retail merchandise, e-commerce shipments, electronics, and industrial products. It's the best starting point for new CDL-A drivers and offers the largest selection of available loads in the country.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$72,000 – $90,000" },
      { icon: "ri-truck-line", label: "Trailer Type", value: "Enclosed 48' or 53'" },
      { icon: "ri-time-line", label: "Experience Needed", value: "Entry level OK" },
      { icon: "ri-road-map-line", label: "Route Options", value: "OTR, Regional, Local" },
    ],
    faq: [
      {
        q: "How much do dry van truck drivers make?",
        a: "Dry van CDL-A drivers earn $72,000–$90,000 per year on average. OTR dry van drivers at top carriers earn closer to $90,000+, while local and regional positions range from $65,000–$82,000 with more home time.",
      },
      {
        q: "Is dry van good for new CDL drivers?",
        a: "Yes — dry van is the best starting point for new CDL-A holders. Loads are abundant, the work is straightforward, and most carriers don't require prior experience beyond the CDL itself. You can be in a truck within days of getting your license.",
      },
      {
        q: "What does a dry van driver haul?",
        a: "Dry van drivers haul general freight: retail goods, automotive parts, electronics, packaged food, building materials, household products, and virtually anything that doesn't require temperature control or open-air transport.",
      },
      {
        q: "How does dry van compare to flatbed or reefer pay?",
        a: "Dry van typically pays 10–20% less than flatbed and 5–10% less than reefer. The trade-off is simplicity — no tarping, no temperature monitoring, no specialized skills required. Many drivers use dry van to build experience before switching to higher-paying equipment types.",
      },
    ],
    relatedLinks: [
      { label: "Flatbed Jobs", href: "/cdl-jobs/flatbed" },
      { label: "Reefer Jobs", href: "/cdl-jobs/reefer" },
      { label: "CDL Jobs in Texas", href: "/cdl-jobs/texas" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  flatbed: {
    intro:
      "Flatbed trucking is the highest-paying standard trailer type in the industry. Flatbed drivers haul steel, lumber, construction equipment, pipe, machinery, and oversized loads on open trailers without walls or a roof. The job requires tarping and securement skills, but rewards drivers with significantly higher pay and a more physically engaging workday.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$85,000 – $105,000" },
      { icon: "ri-truck-line", label: "Trailer Type", value: "48' or 53' flatbed, step deck" },
      { icon: "ri-time-line", label: "Experience Needed", value: "1–2 years preferred" },
      { icon: "ri-road-map-line", label: "Route Options", value: "OTR, Regional" },
    ],
    faq: [
      {
        q: "How much does a flatbed truck driver make?",
        a: "Flatbed CDL-A drivers average $85,000–$105,000 per year. Specialized flatbed drivers hauling oversized or permitted loads can earn $100,000–$130,000. The pay premium exists because of the physical demands — tarping and securement take time, skill, and effort.",
      },
      {
        q: "What do flatbed truck drivers haul?",
        a: "Flatbed drivers haul steel coils, lumber, construction equipment, agricultural machinery, pipe, structural steel, military equipment, and any cargo that doesn't fit in or doesn't need an enclosed trailer.",
      },
      {
        q: "How hard is flatbed trucking compared to dry van?",
        a: "Flatbed is physically harder — you'll tarp and strap loads in all weather conditions, climb on and off trailers multiple times per day, and manage heavy securement equipment. It's rewarding work, but not for drivers who want to stay in the cab.",
      },
      {
        q: "Do flatbed drivers need special training?",
        a: "No special license endorsement is required for standard flatbed, but most carriers want at least 1 year of CDL-A experience before hiring for flatbed positions. You'll learn proper securement and tarping during orientation.",
      },
    ],
    relatedLinks: [
      { label: "Dry Van Jobs", href: "/cdl-jobs/dry-van" },
      { label: "Reefer Jobs", href: "/cdl-jobs/reefer" },
      { label: "CDL Jobs in Texas", href: "/cdl-jobs/texas" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  reefer: {
    intro:
      "Refrigerated (reefer) trucking is the middle ground between dry van and flatbed — better pay than dry van, more responsibility, and strong year-round demand. Reefer drivers transport temperature-sensitive freight like fresh produce, frozen food, dairy, meat, and pharmaceuticals. The work requires monitoring reefer unit temperatures and maintaining proper cargo conditions.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$78,000 – $95,000" },
      { icon: "ri-truck-line", label: "Trailer Type", value: "53' refrigerated trailer" },
      { icon: "ri-time-line", label: "Experience Needed", value: "Entry level to 1 year" },
      { icon: "ri-road-map-line", label: "Route Options", value: "OTR, Regional, Local" },
    ],
    faq: [
      {
        q: "How much do reefer truck drivers make?",
        a: "Reefer CDL-A drivers earn $78,000–$95,000 per year on average, with experienced OTR reefer drivers clearing $95,000+ at top carriers. The pay premium over dry van comes from the added responsibility of temperature monitoring.",
      },
      {
        q: "What does a reefer driver haul?",
        a: "Reefer drivers haul temperature-sensitive freight: fresh produce, frozen foods, dairy products, meat and poultry, beverages, pharmaceuticals, and flowers. Temperatures are set by the shipper and must be maintained throughout transit.",
      },
      {
        q: "Is reefer trucking harder than dry van?",
        a: "Somewhat. You're responsible for monitoring the refrigeration unit, logging temperatures, and maintaining cargo conditions. Produce shippers often require strict pre-cooling and temperature logs. Reefer units can also break down, which adds stress — but also separates skilled drivers from the pack.",
      },
      {
        q: "Is reefer freight available year-round?",
        a: "Yes — food never stops moving. While produce volumes peak in summer, frozen food, dairy, and pharmaceutical freight runs 52 weeks a year. Reefer drivers rarely struggle to find loads.",
      },
    ],
    relatedLinks: [
      { label: "Dry Van Jobs", href: "/cdl-jobs/dry-van" },
      { label: "Flatbed Jobs", href: "/cdl-jobs/flatbed" },
      { label: "CDL Jobs in Florida", href: "/cdl-jobs/florida" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },

  tanker: {
    intro:
      "Tanker trucking is a specialized, high-paying segment of the CDL industry. Tanker drivers transport liquid or dry bulk freight — petroleum, chemicals, food-grade liquids, and gases — in cylindrical tank trailers. The work often requires a Hazmat endorsement and commands premium pay for the added skill, licensing, and responsibility involved.",
    highlights: [
      { icon: "ri-money-dollar-circle-line", label: "Avg. Annual Pay", value: "$80,000 – $105,000" },
      { icon: "ri-truck-line", label: "Trailer Type", value: "Liquid/dry bulk tanker" },
      { icon: "ri-time-line", label: "Experience Needed", value: "1–2 years + Hazmat" },
      { icon: "ri-road-map-line", label: "Route Options", value: "Regional, OTR, Local" },
    ],
    faq: [
      {
        q: "How much do tanker truck drivers make?",
        a: "Tanker CDL-A drivers earn $80,000–$105,000 per year on average. Chemical tanker drivers with Hazmat endorsements and experience with hazardous materials often earn $90,000–$120,000, particularly in petrochemical states like Texas and Louisiana.",
      },
      {
        q: "Do I need a Hazmat endorsement for tanker jobs?",
        a: "The Tanker (N) endorsement is required for all liquid bulk driving. Many tanker positions also require the Hazmat (H) endorsement, which requires a TSA background check and fingerprinting. The X endorsement combines both and is the gold standard for chemical tanker work.",
      },
      {
        q: "What is the difference between petroleum tanker and chemical tanker jobs?",
        a: "Petroleum tanker drivers deliver fuel to gas stations and depots — more local routes, consistent schedule, lower risk. Chemical tanker drivers haul industrial chemicals, often OTR, with higher risk, stricter safety protocols, and significantly higher pay.",
      },
      {
        q: "Is tanker trucking dangerous?",
        a: "It requires more training and attention than standard freight, but with proper protocols it's a well-managed profession. Hazmat training and endorsement prep you for the safety standards required. Carriers invest heavily in safety programs for tanker drivers.",
      },
    ],
    relatedLinks: [
      { label: "Flatbed Jobs", href: "/cdl-jobs/flatbed" },
      { label: "Dry Van Jobs", href: "/cdl-jobs/dry-van" },
      { label: "CDL Jobs in Texas", href: "/cdl-jobs/texas" },
      { label: "CDL Jobs in Louisiana", href: "/cdl-jobs/louisiana" },
      { label: "Browse All Jobs", href: "/jobs" },
    ],
  },
};
