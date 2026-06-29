/**
 * Run once to populate the database:
 *   npm run db:seed
 *
 * Creates an admin user + 15 seed jobs + 27 Facebook groups.
 */

import { db, stringifyRow } from "./db.js";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { seedBlogPosts } from "./seeds/blog-posts.js";

// ── Admin user ────────────────────────────────────────────────────────────

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@truckdriverjobs.co";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "TDJadmin2026!";

const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(ADMIN_EMAIL);
if (!existing) {
  const id = randomUUID();
  const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  db.prepare("INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)").run(id, ADMIN_EMAIL, password_hash);
  db.prepare("INSERT INTO profiles (id, full_name, is_admin) VALUES (?, ?, 1)").run(id, "Admin");
  console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);
} else {
  console.log(`ℹ️  Admin user already exists: ${ADMIN_EMAIL}`);
}

// ── Seed jobs ─────────────────────────────────────────────────────────────

const jobCount = (db.prepare("SELECT COUNT(*) AS c FROM jobs").get() as any).c;
if (jobCount === 0) {
  const jobs = [
    { title: "OTR Dry Van — No-Touch Freight", company: "Schneider National", location: "Dallas, TX", city: "Dallas", state: "TX", route_type: "OTR", equipment: "53'' Dry Van", experience_required: "1+ Years", truck_info: "2024 Freightliner Cascadia", pay_rate: "$0.72 CPM", pay_period: "CPM", home_time: "Home Every 2 Weeks", description: "OTR operation across the continental US. No-touch freight with pre-planned routes. Consistent miles and strong dispatch support.", benefits: ["Health insurance from day 1", "401k with company match", "No-touch freight", "Weekly direct deposit"], requirements: ["Valid Class A CDL", "Clean MVR", "1+ Years OTR"], featured: 1, badge: "Featured", status: "active" },
    { title: "Regional Reefer — Home Weekly", company: "J.B. Hunt Transport", location: "Atlanta, GA", city: "Atlanta", state: "GA", route_type: "Regional", equipment: "53'' Reefer", experience_required: "1-3 Years", truck_info: "2024 Kenworth T680", pay_rate: "$1,300/Week", pay_period: "Weekly", home_time: "Home Weekly", description: "Regional lanes out of Atlanta. Drop-and-hook, 100% no-touch. Guaranteed weekly home time.", benefits: ["Home Weekly", "Health insurance from day 1", "401k", "Rider and pet policy"], requirements: ["Valid Class A CDL", "Clean MVR", "Reefer experience preferred"], featured: 1, badge: "Featured", status: "active" },
    { title: "Local Day Cab — Home Every Night", company: "XPO Logistics", location: "Chicago, IL", city: "Chicago", state: "IL", route_type: "Local", equipment: "Day Cab / Box", experience_required: "Less than 1 Year", truck_info: "2024 International LT", pay_rate: "$1,250/Week", pay_period: "Weekly", home_time: "Home Daily", description: "Local routes in the Chicago metro area. Home every night, Monday through Friday.", benefits: ["Home Daily", "Health insurance from day 1", "Overtime pay", "Union wages"], requirements: ["Valid Class A CDL", "Clean MVR", "Pass DOT physical"], featured: 1, badge: "Featured", status: "active" },
    { title: "OTR Flatbed — Steel & Heavy Haul", company: "TMC Transportation", location: "Houston, TX", city: "Houston", state: "TX", route_type: "OTR", equipment: "48'' Flatbed", experience_required: "2+ Years", truck_info: "2024 Peterbilt 389", pay_rate: "$0.78 CPM", pay_period: "CPM", home_time: "Home Every 14 Days", description: "OTR flatbed operation hauling steel and heavy materials nationwide. Top flatbed carrier.", benefits: ["Weekly direct deposit", "Health insurance", "401k", "Flatbed training paid"], requirements: ["Valid Class A CDL", "Flatbed experience", "2 years OTR", "Clean MVR"], featured: 1, badge: null, status: "active" },
    { title: "Dedicated Dry Van — Retail Account", company: "Werner Enterprises", location: "Phoenix, AZ", city: "Phoenix", state: "AZ", route_type: "Dedicated", equipment: "53'' Dry Van", experience_required: "1+ Years", truck_info: "2024 Freightliner Cascadia", pay_rate: "$1,400/Week", pay_period: "Weekly", home_time: "Home Weekly", description: "Dedicated distribution center account. 100% drop-and-hook, no-touch freight. Guaranteed weekly pay.", benefits: ["Guaranteed weekly pay", "Home Weekly", "No-touch freight", "Health insurance"], requirements: ["Valid Class A CDL", "Clean MVR", "1 year experience"], featured: 1, badge: null, status: "active" },
    { title: "Regional Step Deck — Equipment Haul", company: "Maverick Transportation", location: "Nashville, TN", city: "Nashville", state: "TN", route_type: "Regional", equipment: "48'' Step Deck", experience_required: "2+ Years", truck_info: "2024 Kenworth T680", pay_rate: "$1,350/Week", pay_period: "Weekly", home_time: "Home Every Weekend", description: "Regional step deck lanes in the Southeast and Midwest. Home every weekend.", benefits: ["Home Every Weekend", "Health insurance", "Detention pay", "Safety bonuses"], requirements: ["Valid Class A CDL", "Step deck experience preferred", "2 years", "Clean MVR"], featured: 1, badge: "New", status: "active" },
    { title: "OTR Tanker — Chemical / Hazmat", company: "Quality Carriers", location: "Los Angeles, CA", city: "Los Angeles", state: "CA", route_type: "OTR", equipment: "Tanker", experience_required: "3+ Years", truck_info: "2024 Volvo VNL 860", pay_rate: "$0.80 CPM", pay_period: "CPM", home_time: "Home Every 14 Days", description: "OTR tanker hauling chemicals nationwide. Hazmat and tanker endorsements required.", benefits: ["Hazmat training paid", "Health insurance", "401k", "TWIC card reimbursed"], requirements: ["Valid Class A CDL", "Hazmat & Tanker endorsements", "3 years tanker experience"], featured: 0, badge: "New", status: "active" },
    { title: "Team OTR Dry Van — National Lanes", company: "Prime Inc.", location: "Kansas City, MO", city: "Kansas City", state: "MO", route_type: "OTR", equipment: "53'' Dry Van", experience_required: "6+ Months", truck_info: "2024 Freightliner Cascadia", pay_rate: "$1,500/Week", pay_period: "Weekly", home_time: "Home Every 2 Weeks", description: "Team driving operation across the US. National lanes with high-paying freight. Newest fleet.", benefits: ["Health insurance", "Weekly direct deposit", "APU trucks", "Sign-on bonus"], requirements: ["Valid Class A CDL", "Team experience preferred", "Clean MVR"], featured: 0, badge: "Urgently Hiring", status: "active" },
    { title: "Dedicated Reefer — Grocery Chain", company: "Crete Carrier", location: "Indianapolis, IN", city: "Indianapolis", state: "IN", route_type: "Dedicated", equipment: "53'' Reefer", experience_required: "1+ Years", truck_info: "2024 Kenworth T680", pay_rate: "$1,450/Week", pay_period: "Weekly", home_time: "Home Every Weekend", description: "Dedicated grocery distribution center. Drop-and-hook, temperature-controlled. Home every weekend.", benefits: ["Home Every Weekend", "Health insurance", "401k", "Profit sharing"], requirements: ["Valid Class A CDL", "Reefer experience", "Clean MVR"], featured: 0, badge: null, status: "active" },
    { title: "Regional Flatbed — Construction Materials", company: "Old Dominion Freight", location: "Charlotte, NC", city: "Charlotte", state: "NC", route_type: "Regional", equipment: "48'' Flatbed", experience_required: "1-3 Years", truck_info: "2024 Peterbilt 579", pay_rate: "$1,300/Week", pay_period: "Weekly", home_time: "Home Weekly", description: "Regional flatbed in the Southeast. Hauling construction materials. Home weekly.", benefits: ["Home Weekly", "Health insurance", "Detention pay after 2 hours", "Paid orientation"], requirements: ["Valid Class A CDL", "Flatbed preferred", "Clean MVR"], featured: 0, badge: "Urgently Hiring", status: "active" },
    { title: "Local Intermodal — Port Drayage", company: "Penske Logistics", location: "Miami, FL", city: "Miami", state: "FL", route_type: "Local", equipment: "Chassis / Container", experience_required: "1+ Years", truck_info: "2024 Freightliner M2", pay_rate: "$1,200/Week", pay_period: "Weekly", home_time: "Home Daily", description: "Local container drayage at Port of Miami. Home every night with consistent daytime hours.", benefits: ["Home Daily", "Health insurance", "TWIC card reimbursed", "Paid holidays"], requirements: ["Valid Class A CDL", "TWIC card", "Clean MVR"], featured: 0, badge: null, status: "active" },
    { title: "OTR Dry Van — Automated Trucks", company: "Knight Transportation", location: "Seattle, WA", city: "Seattle", state: "WA", route_type: "OTR", equipment: "53'' Dry Van", experience_required: "1+ Years", truck_info: "2024 Kenworth T680", pay_rate: "$0.74 CPM", pay_period: "CPM", home_time: "Home Every 2 Weeks", description: "National OTR dry van. Strong freight network. Automatic trucks available for all drivers.", benefits: ["Automatic trucks", "Health insurance", "401k", "Weekly direct deposit"], requirements: ["Valid Class A CDL", "Clean MVR", "1 year OTR"], featured: 0, badge: null, status: "active" },
    { title: "OTR Step Deck — Wind Energy / Oversized", company: "System Transport", location: "Portland, OR", city: "Portland", state: "OR", route_type: "OTR", equipment: "48'' Step Deck", experience_required: "3+ Years", truck_info: "2024 Peterbilt 389", pay_rate: "$0.79 CPM", pay_period: "CPM", home_time: "Home Every 2 Weeks", description: "OTR step deck specializing in wind energy and oversized loads. Top pay.", benefits: ["Permit training paid", "Health insurance", "401k", "Sign-on bonus"], requirements: ["Valid Class A CDL", "Step deck / oversized experience", "3 years OTR"], featured: 0, badge: "Urgently Hiring", status: "active" },
    { title: "Dedicated Tanker — Food Grade", company: "Ryder Supply Chain", location: "Tampa, FL", city: "Tampa", state: "FL", route_type: "Dedicated", equipment: "Tanker", experience_required: "2+ Years", truck_info: "2024 Volvo VNL 860", pay_rate: "$1,450/Week", pay_period: "Weekly", home_time: "Home Daily", description: "Dedicated food grade tanker near Tampa Bay. Home daily, Monday–Friday. Tanker endorsement required.", benefits: ["Home Daily", "Health insurance", "401k", "No forced dispatch"], requirements: ["Valid Class A CDL", "Tanker endorsement", "Food grade preferred", "Clean MVR"], featured: 0, badge: null, status: "active" },
    { title: "Local Delivery — Day Shift Box Truck", company: "FedEx Freight", location: "Denver, CO", city: "Denver", state: "CO", route_type: "Local", equipment: "Day Cab / Box", experience_required: "Less than 1 Year", truck_info: "2024 International HV", pay_rate: "$1,150/Week", pay_period: "Weekly", home_time: "Home Daily", description: "Local FedEx delivery routes in Denver metro. Early morning start, home mid-afternoon. Mon–Fri.", benefits: ["Home Daily", "Paid holidays", "Overtime available", "Uniform allowance"], requirements: ["Valid Class A CDL", "Clean MVR", "Pass DOT physical"], featured: 0, badge: null, status: "active" },
  ];

  const insertJob = db.prepare(`INSERT INTO jobs (title,company,location,city,state,route_type,equipment,experience_required,truck_info,pay_rate,pay_period,home_time,description,benefits,requirements,featured,badge,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insertMany = db.transaction((rows: typeof jobs) => {
    for (const j of rows) {
      insertJob.run(j.title,j.company,j.location,j.city,j.state,j.route_type,j.equipment,j.experience_required,j.truck_info,j.pay_rate,j.pay_period,j.home_time,j.description,JSON.stringify(j.benefits),JSON.stringify(j.requirements),j.featured,j.badge,j.status);
    }
  });
  insertMany(jobs);
  console.log(`✅ Seeded ${jobs.length} jobs`);
} else {
  console.log(`ℹ️  Jobs already seeded (${jobCount} rows)`);
}

// ── Seed recruitment groups ───────────────────────────────────────────────

const groupCount = (db.prepare("SELECT COUNT(*) AS c FROM recruitment_groups").get() as any).c;
if (groupCount === 0) {
  const groups = [
    { name: "Truck Drivers USA (Main)", platform: "facebook", url: "https://www.facebook.com/groups/921396095025365/", fb_group_id: "921396095025365", members_count: 285000, category: "General", priority: "high" },
    { name: "Dispatch USA Serbia", platform: "facebook", url: "https://www.facebook.com/groups/dispatch.usa.serbia/", fb_group_id: "dispatch.usa.serbia", members_count: 52000, category: "General", priority: "high" },
    { name: "CDL Drivers Wanted", platform: "facebook", url: "https://www.facebook.com/groups/CDLDriversWanted/", fb_group_id: "CDLDriversWanted", members_count: 18000, category: "Hiring", priority: "high" },
    { name: "Trucking Companies Hiring Now", platform: "facebook", url: "https://www.facebook.com/groups/truckingcompanieshiringnow/", fb_group_id: "truckingcompanieshiringnow", members_count: 15000, category: "Hiring", priority: "high" },
    { name: "OTR Trucking Jobs", platform: "facebook", url: "https://www.facebook.com/groups/OTRTruckingJobs/", fb_group_id: "OTRTruckingJobs", members_count: 12000, category: "OTR", priority: "high" },
    { name: "Truck Driver Jobs – USA", platform: "facebook", url: "https://www.facebook.com/groups/truckdriverjobsusa/", fb_group_id: "truckdriverjobsusa", members_count: 9500, category: "General", priority: "medium" },
    { name: "CDL A Drivers Network", platform: "facebook", url: "https://www.facebook.com/groups/CDLADriversNetwork/", fb_group_id: "CDLADriversNetwork", members_count: 8200, category: "Network", priority: "medium" },
    { name: "Flatbed Trucking Jobs", platform: "facebook", url: "https://www.facebook.com/groups/flatbedtuckingjobs/", fb_group_id: "flatbedtuckingjobs", members_count: 7100, category: "Flatbed", priority: "medium" },
    { name: "Reefer Truck Drivers", platform: "facebook", url: "https://www.facebook.com/groups/ReeferTruckDrivers/", fb_group_id: "ReeferTruckDrivers", members_count: 6500, category: "Reefer", priority: "medium" },
    { name: "Owner Operator Trucking", platform: "facebook", url: "https://www.facebook.com/groups/OwnerOperatorTrucking/", fb_group_id: "OwnerOperatorTrucking", members_count: 22000, category: "Owner-Op", priority: "medium" },
    { name: "Trucking Jobs – Texas", platform: "facebook", url: "https://www.facebook.com/groups/truckingjobstexas/", fb_group_id: "truckingjobstexas", members_count: 5800, category: "Regional", state: "TX", priority: "medium" },
    { name: "Trucking Jobs – Florida", platform: "facebook", url: "https://www.facebook.com/groups/truckingjobsflorida/", fb_group_id: "truckingjobsflorida", members_count: 4900, category: "Regional", state: "FL", priority: "medium" },
    { name: "Trucking Jobs – California", platform: "facebook", url: "https://www.facebook.com/groups/truckingjobscalifornia/", fb_group_id: "truckingjobscalifornia", members_count: 5200, category: "Regional", state: "CA", priority: "medium" },
    { name: "Trucking Jobs – Illinois", platform: "facebook", url: "https://www.facebook.com/groups/truckingjobsillinois/", fb_group_id: "truckingjobsillinois", members_count: 3800, category: "Regional", state: "IL", priority: "low" },
    { name: "Trucking Jobs – Georgia", platform: "facebook", url: "https://www.facebook.com/groups/truckingjobsgeorgia/", fb_group_id: "truckingjobsgeorgia", members_count: 4200, category: "Regional", state: "GA", priority: "low" },
    { name: "CDL Jobs – North Carolina", platform: "facebook", url: "https://www.facebook.com/groups/cdljobsnc/", fb_group_id: "cdljobsnc", members_count: 2900, category: "Regional", state: "NC", priority: "low" },
    { name: "Truck Drivers – Southeast", platform: "facebook", url: "https://www.facebook.com/groups/TruckDriversSoutheast/", fb_group_id: "TruckDriversSoutheast", members_count: 6100, category: "Regional", priority: "medium" },
    { name: "Truckers – Midwest", platform: "facebook", url: "https://www.facebook.com/groups/TruckersMidwest/", fb_group_id: "TruckersMidwest", members_count: 5500, category: "Regional", priority: "medium" },
    { name: "Local Truck Driving Jobs", platform: "facebook", url: "https://www.facebook.com/groups/LocalTruckDrivingJobs/", fb_group_id: "LocalTruckDrivingJobs", members_count: 8900, category: "Local", priority: "medium" },
    { name: "Dedicated Route Trucking", platform: "facebook", url: "https://www.facebook.com/groups/DedicatedRouteTrucking/", fb_group_id: "DedicatedRouteTrucking", members_count: 4700, category: "Dedicated", priority: "medium" },
    { name: "CDL Tanker Jobs", platform: "facebook", url: "https://www.facebook.com/groups/CDLTankerJobs/", fb_group_id: "CDLTankerJobs", members_count: 3200, category: "Tanker", priority: "low" },
    { name: "Step Deck & Flatbed Drivers", platform: "facebook", url: "https://www.facebook.com/groups/StepDeckFlatbedDrivers/", fb_group_id: "StepDeckFlatbedDrivers", members_count: 4100, category: "Flatbed", priority: "low" },
    { name: "Trucking Industry Jobs & News", platform: "facebook", url: "https://www.facebook.com/groups/TruckingIndustryJobsNews/", fb_group_id: "TruckingIndustryJobsNews", members_count: 11200, category: "General", priority: "medium" },
    { name: "Dispatcher – Vozači Serbia USA", platform: "facebook", url: "https://www.facebook.com/groups/DispatcherVozaciSerbiaUSA/", fb_group_id: "DispatcherVozaciSerbiaUSA", members_count: 28000, category: "General", priority: "high" },
    { name: "Vozaci Kamiona USA Srbija", platform: "facebook", url: "https://www.facebook.com/groups/vozacikamionausasrbija/", fb_group_id: "vozacikamionausasrbija", members_count: 19000, category: "General", priority: "high" },
    { name: "CDL Truck Driving School & Jobs", platform: "facebook", url: "https://www.facebook.com/groups/CDLTruckDrivingSchoolJobs/", fb_group_id: "CDLTruckDrivingSchoolJobs", members_count: 6800, category: "Training", priority: "low" },
    { name: "Team Drivers Wanted", platform: "facebook", url: "https://www.facebook.com/groups/TeamDriversWanted/", fb_group_id: "TeamDriversWanted", members_count: 3500, category: "Team", priority: "low" },
  ];

  const insertGroup = db.prepare(`INSERT INTO recruitment_groups (name,platform,url,fb_group_id,members_count,category,state,priority,status,post_method) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const insertMany = db.transaction((rows: typeof groups) => {
    for (const g of rows) insertGroup.run(g.name, g.platform, g.url, g.fb_group_id, g.members_count, g.category, (g as any).state ?? null, g.priority, "active", "manual");
  });
  insertMany(groups);
  console.log(`✅ Seeded ${groups.length} recruitment groups`);
} else {
  console.log(`ℹ️  Groups already seeded (${groupCount} rows)`);
}

// ── Seed blog posts ───────────────────────────────────────────────────────
seedBlogPosts();

console.log("\n✅ Seed complete. Run `npm run dev` to start.");
db.close();
