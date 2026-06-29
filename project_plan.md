# TruckDriverJobs.co — Project Plan

## 1. Project Description
TruckDriverJobs.co is a CDL truck driver recruiting platform connecting Class A drivers with verified carriers across the United States. The platform serves as a dual-purpose marketing engine: an SEO-optimized public-facing job directory that attracts organic search traffic, and a gated driver registration system that collects detailed driver profiles before unlocking full job details and application capabilities.

**Primary target audience:** CDL Class A drivers (company drivers, owner-operators, team drivers, and new CDL students) across America, with bilingual support for Spanish, Serbian/Croatian/Bosnian speakers.

**Secondary target audience:** Fleet managers and carriers seeking pre-qualified driver candidates.

**Core value proposition:**
- For drivers: Free access to vetted, high-paying trucking jobs with a 72-hour recruiter callback guarantee
- For fleets: Access to a pre-qualified driver pool of 12,000+ candidates with guaranteed 72-hour placement

### The Recruitment CRM (Admin Platform)
The admin dashboard is being rebuilt as a full **Recruitment CRM** — think Buffer/Hootsuite but purpose-built for trucking recruiters. One campaign → AI generates content → queued to groups → published on schedule → analytics track everything. The goal: **one click distributes a recruiting campaign everywhere.**

## 2. Page Structure
| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Home — SEO-optimized landing page with job preview cards, Google Reviews | No |
| `/jobs` | Full job board with filters for logged-in drivers | Yes |
| `/jobs/:id` | Job detail page with full carrier info, apply modal | Yes |
| `/login` | Driver login with email/password | No |
| `/signup` | Driver registration — CDL info, experience, preferences | No |
| `/forgot-password` | Password reset | No |
| `/blog` | Blog listing with SEO articles for drivers | No |
| `/blog/:slug` | Individual blog post with markdown rendering | No |
| `/for-fleets` | Employer lead capture form | No |
| `/dashboard` | Driver dashboard — saved jobs, applications, profile | Yes |
| `/admin` | Admin CRM Dashboard — overview stats, quick actions | Yes (admin) |
| `/admin/campaigns` | Campaign Builder — create/edit recruitment campaigns | Yes (admin) |
| `/admin/campaigns/:id` | Campaign detail — AI content, queue, analytics per campaign | Yes (admin) |
| `/admin/groups` | Group Database — manage Facebook/recruitment groups | Yes (admin) |
| `/admin/queue` | Publishing Queue — scheduled/queued posts | Yes (admin) |
| `/admin/drivers` | Driver CRM — profiles, applications, placement tracking | Yes (admin) |
| `/admin/analytics` | Analytics — campaign performance, group ROI, source tracking | Yes (admin) |

## 3. Core Features
### Public Platform
- [x] SEO-optimized public homepage with job preview cards
- [x] Full job board with filters, category chips, sorting
- [x] Job detail pages with full carrier info, apply modal
- [x] Driver authentication (login/signup) with Supabase Auth
- [x] Driver profile collection (CDL status, experience, preferences)
- [x] Owner-operator dedicated section
- [x] Quick apply modal with 30-second application flow
- [x] Blog system with Supabase-backed articles for SEO
- [x] Employer lead capture form with Readdy form integration
- [x] Google Reviews section for social proof
- [x] Driver dashboard (saved jobs, application history)

### Recruitment CRM (Admin)
- [ ] Campaign Builder — create multi-channel recruitment campaigns
- [ ] AI Content Engine — generate headlines, descriptions, CTAs per campaign
- [ ] Group Database — manage recruitment groups across platforms
- [ ] Publishing Queue — schedule and manage publication pipeline
- [ ] Multi-Platform Publisher — Facebook, Craigslist, Reddit module interface
- [ ] Analytics Dashboard — source tracking, group ROI, campaign performance
- [ ] AI Optimization — analyze top/bottom performers, suggest improvements

## 4. Data Model Design

### Table: `profiles` (public schema)
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | FK to auth.users, primary key |
| full_name | TEXT | Driver's full name |
| phone | TEXT | Driver's phone number |
| has_cdl | BOOLEAN | Whether driver has Class A CDL |
| cdl_state | TEXT | State where CDL is issued |
| experience | TEXT | Years of experience |
| endorsement_type | TEXT | CDL endorsements |
| driver_type | TEXT | company_driver / owner_operator / team_driver / student |
| preferred_route | TEXT | OTR / Regional / Dedicated / Local / Team |
| preferred_equipment | TEXT | Dry Van / Reefer / Flatbed / etc. |
| home_time_preference | TEXT | Home Daily / Weekly / etc. |
| min_pay_expectation | TEXT | Minimum weekly pay goal |
| is_admin | BOOLEAN | Admin access flag |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

### Table: `blog_posts` (public schema)
| Field | Type | Description |
|-------|------|-------------|
| id | BIGSERIAL | Primary key |
| title | TEXT | Post title |
| slug | TEXT | URL-friendly slug |
| excerpt | TEXT | Short summary |
| content | TEXT | Full article content |
| category | TEXT | Article category |
| read_time | TEXT | Estimated read time |
| featured | BOOLEAN | Featured post flag |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

### Table: `saved_jobs` (public schema)
| Field | Type | Description |
|-------|------|-------------|
| id | BIGSERIAL | Primary key |
| user_id | UUID | FK to auth.users |
| job_id | INTEGER | Reference to job listing |
| created_at | TIMESTAMP | Auto |

### Table: `applications` (public schema)
| Field | Type | Description |
|-------|------|-------------|
| id | BIGSERIAL | Primary key |
| user_id | UUID | FK to auth.users |
| job_id | INTEGER | Reference to job listing |
| status | TEXT | submitted / reviewed / contacted / hired / rejected |
| notes | TEXT | Admin notes |
| source_campaign_id | BIGINT | FK to campaigns — which campaign generated this app |
| source_group_id | BIGINT | FK to recruitment_groups — which group |
| source_post_id | BIGINT | FK to published_posts — which specific post |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

### Table: `campaigns` (public schema)
| Field | Type | Description |
|-------|------|-------------|
| id | BIGSERIAL | Primary key |
| name | TEXT | Campaign name (e.g. "Texas CDL Drivers") |
| locations | JSONB | Array of target states/cities |
| job_type | TEXT | Regional / OTR / Dedicated / Local |
| benefits | JSONB | Array of benefits (Home Weekly, 401k, etc.) |
| cta | TEXT | Call to action text |
| duration_days | INT | Campaign duration in days |
| status | TEXT | draft / active / paused / completed |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

### Table: `recruitment_groups` (public schema)
| Field | Type | Description |
|-------|------|-------------|
| id | BIGSERIAL | Primary key |
| name | TEXT | Group name (e.g. "Truck Drivers USA") |
| platform | TEXT | facebook / craigslist / reddit / linkedin |
| url | TEXT | Group URL |
| members_count | INT | Approximate member count |
| category | TEXT | OTR / Regional / Local / All |
| state | TEXT | Target state (if location-specific) |
| allows_posts | BOOLEAN | Can we post to this group? |
| last_posted_at | TIMESTAMP | When we last published |
| status | TEXT | active / paused / banned |
| priority | TEXT | high / medium / low |
| notes | TEXT | Internal notes (e.g. "Morning posts perform best") |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

### Table: `queued_posts` (public schema)
| Field | Type | Description |
|-------|------|-------------|
| id | BIGSERIAL | Primary key |
| campaign_id | BIGINT | FK to campaigns |
| group_id | BIGINT | FK to recruitment_groups |
| headline | TEXT | Post headline |
| description | TEXT | Post body |
| cta | TEXT | Call to action |
| link_url | TEXT | URL to include |
| hashtags | JSONB | Array of hashtags |
| scheduled_at | TIMESTAMP | When to publish |
| status | TEXT | pending / published / failed / cancelled |
| platform | TEXT | facebook / craigslist / reddit |
| created_at | TIMESTAMP | Auto |
| updated_at | TIMESTAMP | Auto |

### Table: `published_posts` (public schema)
| Field | Type | Description |
|-------|------|-------------|
| id | BIGSERIAL | Primary key |
| queued_post_id | BIGINT | FK to queued_posts |
| campaign_id | BIGINT | FK to campaigns |
| group_id | BIGINT | FK to recruitment_groups |
| platform | TEXT | Platform it was published to |
| external_post_id | TEXT | Platform's post ID |
| published_at | TIMESTAMP | When it went live |
| status | TEXT | success / failed |
| error_message | TEXT | Error details if failed |
| created_at | TIMESTAMP | Auto |

### Table: `content_templates` (public schema)
| Field | Type | Description |
|-------|------|-------------|
| id | BIGSERIAL | Primary key |
| campaign_id | BIGINT | FK to campaigns |
| type | TEXT | headline / description / cta / question / hashtag |
| content | TEXT | The generated content |
| variant_index | INT | Variation number (1-100) |
| used | BOOLEAN | Whether this template has been used in a post |
| performance_score | NUMERIC | Optional: AI or manual quality score |
| created_at | TIMESTAMP | Auto |

### Table: `analytics_events` (public schema)
| Field | Type | Description |
|-------|------|-------------|
| id | BIGSERIAL | Primary key |
| campaign_id | BIGINT | FK to campaigns |
| group_id | BIGINT | FK to recruitment_groups |
| published_post_id | BIGINT | FK to published_posts |
| event_type | TEXT | click / application / hire / view |
| driver_id | UUID | FK to profiles (if driver identified) |
| metadata | JSONB | Extra data (IP, user agent, etc.) |
| created_at | TIMESTAMP | Auto |

## 5. Backend / Third-party Integration Plan
- **Supabase Auth**: Email/password authentication for driver accounts
- **Supabase Database**: All tables with RLS policies
- **Readdy Forms**: Employer lead capture form at `/for-fleets`
- **Supabase Edge Functions**: AI content generation, publishing integrations
- **Anthropic Claude API**: AI content generation (via Supabase Edge Function)
- **Facebook Graph API**: Future publishing integration (via Edge Function)
- **Stripe**: Future fleet subscription tiers (Phase 4)

## 6. Development Phase Plan

### Phase 1: Foundation & Public Pages ✅
- [x] Homepage with hero, job preview cards, Google Reviews
- [x] Blog system with listing and detail pages
- [x] Employer lead capture page (`/for-fleets`)
- [x] SEO optimization with semantic markup, structured data

### Phase 2: Auth & Gated Content ✅
- [x] Supabase Auth integration (login, signup, forgot password)
- [x] Driver profile collection during registration
- [x] Job detail pages locked behind login
- [x] Full job board with filters for logged-in users
- [x] AuthGuard component for protected routes
- [x] Navbar with auth state and user menu

### Phase 3: Driver Experience & Admin Basics ✅
- [x] Driver dashboard (saved jobs, application history)
- [x] Admin CRM (driver profiles, applications, status management)
- [x] AdminGuard component for admin-only routes
- [x] `is_admin` flag on profiles table
- [x] Blog SEO overhaul (24 posts, internal linking, structured data)
- [x] For-fleets form fix

### Phase 4: Recruitment CRM — Database & Layout
- [ ] Create all CRM database tables (campaigns, recruitment_groups, queued_posts, published_posts, content_templates, analytics_events)
- [ ] Add source tracking fields to applications table (source_campaign_id, source_group_id, source_post_id)
- [ ] Restructure admin into multi-page layout with sidebar navigation
- [ ] Admin dashboard overview with CRM stats

### Phase 5: Campaign Builder
- [ ] Campaign CRUD — create, edit, list, archive campaigns
- [ ] Campaign detail page with status management
- [ ] Benefits/locations as tag-based inputs
- [ ] Campaign overview stats (posts, clicks, applications, hires)

### Phase 6: Group Database
- [ ] Group CRUD — add, edit, categorize recruitment groups
- [ ] Group list with filters by platform, state, category, priority
- [ ] Group stats (last posted, total posts, performance)

### Phase 7: AI Content Engine
- [ ] Supabase Edge Function for Claude API content generation
- [ ] Content template generation per campaign (headlines, descriptions, CTAs)
- [ ] Content review/edit interface in campaign detail
- [ ] Regenerate/variation controls

### Phase 8: Publishing Queue
- [ ] Create queued posts from campaign + group + content
- [ ] Queue view with drag-to-reorder, schedule management
- [ ] Post preview before scheduling
- [ ] Campaign-level queue overview

### Phase 9: Analytics
- [ ] Analytics dashboard with campaign performance
- [ ] Group ROI ranking
- [ ] Source attribution for applications
- [ ] Time-of-day / day-of-week performance

### Phase 10: AI Optimization
- [ ] Top/bottom performing content analysis
- [ ] Auto-suggest improvements based on performance data
- [ ] Best posting times by group
- [ ] Campaign performance comparison

---

**Current Status:** Phase 3 complete. Moving into Phase 4 — CRM database setup and admin layout restructuring.