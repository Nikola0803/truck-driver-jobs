-- ============================================================
-- Jobs table — replaces src/mocks/jobs.ts
-- ============================================================

CREATE TABLE IF NOT EXISTS jobs (
  id                  BIGSERIAL PRIMARY KEY,
  title               TEXT NOT NULL,
  company             TEXT NOT NULL,
  location            TEXT NOT NULL,
  city                TEXT,
  state               TEXT,
  route_type          TEXT,
  equipment           TEXT,
  experience_required TEXT,
  truck_info          TEXT,
  pay_rate            TEXT,
  pay_period          TEXT,
  home_time           TEXT,
  description         TEXT,
  benefits            JSONB DEFAULT '[]',
  requirements        JSONB DEFAULT '[]',
  featured            BOOLEAN DEFAULT false,
  badge               TEXT,          -- 'New' | 'Urgently Hiring' | 'Featured' | null
  status              TEXT DEFAULT 'active', -- active | paused | filled
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status   ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_featured ON jobs (featured);
CREATE INDEX IF NOT EXISTS idx_jobs_state    ON jobs (state);
CREATE INDEX IF NOT EXISTS idx_jobs_equipment ON jobs (equipment);
CREATE INDEX IF NOT EXISTS idx_jobs_route_type ON jobs (route_type);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_jobs_updated_at ON jobs;
CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_jobs_updated_at();

-- RLS: drivers can read active jobs; admins can do everything
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_public_read" ON jobs
  FOR SELECT USING (status = 'active');

CREATE POLICY "jobs_admin_all" ON jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- ============================================================
-- Seed: 15 real-looking jobs (add more via /admin/jobs)
-- ============================================================

INSERT INTO jobs (title, company, location, city, state, route_type, equipment, experience_required, truck_info, pay_rate, pay_period, home_time, description, benefits, requirements, featured, badge, status) VALUES

('OTR Dry Van — No-Touch Freight',
 'Schneider National', 'Dallas, TX', 'Dallas', 'TX', 'OTR', '53'' Dry Van', '1+ Years',
 '2024 Freightliner Cascadia',
 '$0.72 CPM', 'CPM', 'Home Every 2 Weeks',
 'OTR operation across the continental US. No-touch freight with pre-planned routes. Consistent miles and strong dispatch support. ELD compliant, APU-equipped fleet.',
 '["Health insurance from day 1","401k with company match","No-touch freight","Weekly direct deposit","Quarterly safety bonuses"]',
 '["Valid Class A CDL","Clean MVR","No major violations in 3 years","Pass DOT physical and drug screen"]',
 true, 'Featured', 'active'),

('Regional Reefer — Home Weekly',
 'J.B. Hunt Transport', 'Atlanta, GA', 'Atlanta', 'GA', 'Regional', '53'' Reefer', '1-3 Years',
 '2024 Kenworth T680',
 '$1,300/Week', 'Weekly', 'Home Weekly',
 'Regional lanes out of Atlanta. Drop-and-hook, 100% no-touch. Guaranteed weekly home time. Family-friendly carrier with top-tier benefits and driver retention program.',
 '["Home Weekly guaranteed","Health insurance from day 1","401k with company match","Rider and pet policy","Paid vacation from day 1"]',
 '["Valid Class A CDL","Clean MVR","Reefer experience preferred","Pass DOT physical and drug screen"]',
 true, 'Featured', 'active'),

('Local Day Cab — Home Every Night',
 'XPO Logistics', 'Chicago, IL', 'Chicago', 'IL', 'Local', 'Day Cab / Box', 'Less than 1 Year',
 '2024 International LT',
 '$1,250/Week', 'Weekly', 'Home Daily',
 'Local routes in the Chicago metro area. Home every night, Monday through Friday. Stable year-round freight from major retail distribution centers. Overtime available.',
 '["Home Daily","Health insurance from day 1","Overtime pay available","Paid holidays","Union wages and pension"]',
 '["Valid Class A CDL","Clean MVR","Pass DOT physical and drug screen","Local experience preferred"]',
 true, 'Featured', 'active'),

('OTR Flatbed — Steel & Heavy Haul',
 'TMC Transportation', 'Houston, TX', 'Houston', 'TX', 'OTR', '48'' Flatbed', '2+ Years',
 '2024 Peterbilt 389',
 '$0.78 CPM', 'CPM', 'Home Every 14 Days',
 'OTR flatbed operation hauling steel and heavy materials nationwide. Dedicated lanes with consistent freight. Newer fleet with fully-paid tarps and straps. Top flatbed carrier in the industry.',
 '["Weekly direct deposit","Health insurance from day 1","401k with company match","Flatbed training paid","Fuel card and discounts"]',
 '["Valid Class A CDL","Flatbed experience","2 years OTR experience","Clean MVR","Pass DOT physical"]',
 true, null, 'active'),

('Dedicated Dry Van — Retail Account',
 'Werner Enterprises', 'Phoenix, AZ', 'Phoenix', 'AZ', 'Dedicated', '53'' Dry Van', '1+ Years',
 '2024 Freightliner Cascadia',
 '$1,400/Week', 'Weekly', 'Home Weekly',
 'Dedicated distribution center account. 100% drop-and-hook, no-touch freight. Guaranteed weekly pay regardless of miles. Best-in-class benefits and predictable schedule.',
 '["Guaranteed weekly pay","Home Weekly guaranteed","No-touch freight","Health insurance from day 1","401k with company match"]',
 '["Valid Class A CDL","Clean MVR","1 year experience","Pass DOT physical and drug screen"]',
 true, null, 'active'),

('Regional Step Deck — Equipment Haul',
 'Maverick Transportation', 'Nashville, TN', 'Nashville', 'TN', 'Regional', '48'' Step Deck', '2+ Years',
 '2024 Kenworth T680',
 '$1,350/Week', 'Weekly', 'Home Every Weekend',
 'Regional step deck lanes in the Southeast and Midwest. Hauling construction equipment and industrial machinery. Consistent freight, home every weekend.',
 '["Home Every Weekend","Health insurance from day 1","Weekly direct deposit","Detention pay after 2 hours","Safety recognition program"]',
 '["Valid Class A CDL","Step deck experience preferred","Clean MVR","2 years experience","Pass DOT physical"]',
 true, 'New', 'active'),

('OTR Tanker — Chemical / Hazmat',
 'Quality Carriers', 'Los Angeles, CA', 'Los Angeles', 'CA', 'OTR', 'Tanker', '3+ Years',
 '2024 Volvo VNL 860',
 '$0.80 CPM', 'CPM', 'Home Every 14 Days',
 'OTR tanker operation hauling chemicals and food-grade liquid freight nationwide. Hazmat and tanker endorsements required. Top pay in the industry for qualified drivers.',
 '["Hazmat training paid","Health insurance from day 1","401k with company match","Weekly direct deposit","TWIC card reimbursed"]',
 '["Valid Class A CDL","Hazmat and Tanker endorsements","3 years tanker experience","Clean MVR","Pass DOT physical"]',
 false, 'New', 'active'),

('Local Intermodal — Port Drayage',
 'Penske Logistics', 'Miami, FL', 'Miami', 'FL', 'Local', 'Chassis / Container', '1+ Years',
 '2024 Freightliner M2',
 '$1,200/Week', 'Weekly', 'Home Daily',
 'Local container drayage at the Port of Miami. Home every night with consistent daytime hours. Dedicated account with stable year-round freight and strong dispatch support.',
 '["Home Daily","Health insurance from day 1","TWIC card reimbursed","Paid holidays","Weekly direct deposit"]',
 '["Valid Class A CDL","TWIC card","Clean MVR","Pass DOT physical","Intermodal experience preferred"]',
 false, null, 'active'),

('Team OTR Dry Van — National Lanes',
 'Prime Inc.', 'Kansas City, MO', 'Kansas City', 'MO', 'OTR', '53'' Dry Van', '6+ Months',
 '2024 Freightliner Cascadia',
 '$1,500/Week', 'Weekly', 'Home Every 2 Weeks',
 'Team driving operation across the continental US. National lanes with consistent high-paying freight. Split pay for each driver. Newest fleet available to team drivers.',
 '["Health insurance from day 1","Weekly direct deposit","Rider and pet policy","APU-equipped trucks","Sign-on bonus"]',
 '["Valid Class A CDL","Team driving experience preferred","Clean MVR","Pass DOT physical and drug screen"]',
 false, 'Urgently Hiring', 'active'),

('Dedicated Reefer — Grocery Chain',
 'Crete Carrier', 'Indianapolis, IN', 'Indianapolis', 'IN', 'Dedicated', '53'' Reefer', '1+ Years',
 '2024 Kenworth T680',
 '$1,450/Week', 'Weekly', 'Home Every Weekend',
 'Dedicated grocery distribution center account. Drop-and-hook, temperature-controlled freight. Consistent lanes with guaranteed home every weekend. Best-in-class benefits.',
 '["Home Every Weekend","Health insurance from day 1","401k with company match","No-touch freight","Profit sharing"]',
 '["Valid Class A CDL","Reefer experience","Clean MVR","Pass DOT physical and drug screen"]',
 false, null, 'active'),

('Regional Flatbed — Construction Materials',
 'Old Dominion Freight', 'Charlotte, NC', 'Charlotte', 'NC', 'Regional', '48'' Flatbed', '1-3 Years',
 '2024 Peterbilt 579',
 '$1,300/Week', 'Weekly', 'Home Weekly',
 'Regional flatbed lanes in the Southeast. Hauling construction materials and building supplies. Home weekly with consistent freight from established customers.',
 '["Home Weekly guaranteed","Health insurance from day 1","Weekly direct deposit","Detention pay after 2 hours","Paid orientation"]',
 '["Valid Class A CDL","Flatbed experience preferred","Clean MVR","Pass DOT physical"]',
 false, 'Urgently Hiring', 'active'),

('OTR Dry Van — Automated Trucks Available',
 'Knight Transportation', 'Seattle, WA', 'Seattle', 'WA', 'OTR', '53'' Dry Van', '1+ Years',
 '2024 Kenworth T680',
 '$0.74 CPM', 'CPM', 'Home Every 2 Weeks',
 'National OTR dry van with strong freight network in the Pacific Northwest and nationwide. Automatic trucks available for all drivers. One of the most reliable carriers in the industry.',
 '["Automatic trucks","Health insurance from day 1","401k with company match","No-touch freight","Weekly direct deposit"]',
 '["Valid Class A CDL","Clean MVR","1 year OTR experience","Pass DOT physical and drug screen"]',
 false, null, 'active'),

('Local Delivery — Day Shift Box Truck',
 'FedEx Freight', 'Denver, CO', 'Denver', 'CO', 'Local', 'Day Cab / Box', 'Less than 1 Year',
 '2024 International HV',
 '$1,150/Week', 'Weekly', 'Home Daily',
 'Local FedEx delivery routes in the Denver metro area. Early morning start, home by mid-afternoon. Monday through Friday with overtime available. No overnight travel required.',
 '["Home Daily","Paid holidays","Overtime pay available","Uniform allowance","Steady year-round freight"]',
 '["Valid Class A CDL","Clean MVR","Pass DOT physical","Good customer service skills"]',
 false, null, 'active'),

('OTR Step Deck — Wind Energy / Oversized',
 'System Transport', 'Portland, OR', 'Portland', 'OR', 'OTR', '48'' Step Deck', '3+ Years',
 '2024 Peterbilt 389',
 '$0.79 CPM', 'CPM', 'Home Every 2 Weeks',
 'OTR step deck specializing in wind energy components and oversized loads. Permit-pulling experience a plus. Top pay for qualified drivers with heavy haul experience.',
 '["Permit training paid","Health insurance from day 1","401k with company match","Weekly direct deposit","Sign-on bonus"]',
 '["Valid Class A CDL","Step deck / oversized experience","3 years OTR","Clean MVR","Pass DOT physical"]',
 false, 'Urgently Hiring', 'active'),

('Dedicated Tanker — Food Grade',
 'Ryder Supply Chain', 'Tampa, FL', 'Tampa', 'FL', 'Dedicated', 'Tanker', '2+ Years',
 '2024 Volvo VNL 860',
 '$1,450/Week', 'Weekly', 'Home Daily',
 'Dedicated food grade tanker account servicing major food manufacturers in the Tampa Bay area. Home daily with Monday through Friday schedule. Tanker endorsement required.',
 '["Home Daily","Health insurance from day 1","401k with company match","Weekly direct deposit","No forced dispatch"]',
 '["Valid Class A CDL","Tanker endorsement","Food grade experience preferred","Clean MVR","Pass DOT physical"]',
 false, null, 'active');
