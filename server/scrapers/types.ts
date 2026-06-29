export interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  city?: string;
  state?: string;
  route_type?: string;
  equipment?: string;
  experience_required?: string;
  pay_rate?: string;
  pay_period?: string;
  home_time?: string;
  description?: string;
  benefits?: string[];
  requirements?: string[];
  source_url: string;
  source_carrier: string;
  external_apply_url?: string;
}

export interface CarrierConfig {
  name: string;
  /** Main jobs listing URL to scrape */
  url: string;
  /** Scraper strategy */
  strategy: "schema-org" | "cheerio" | "xml-feed";
  /** Optional additional URLs (pagination, specific category pages) */
  extraUrls?: string[];
  /** Overrides for equipment type if not in scraped data */
  defaultEquipment?: string;
  defaultRouteType?: string;
}

export interface ScrapeResult {
  carrier: string;
  url: string;
  jobs: ScrapedJob[];
  error?: string;
  scrapedAt: string;
}
