import type { CarrierConfig } from "./types.js";

/**
 * Registry of carriers to scrape.
 * All URLs are publicly accessible career pages — no authentication required.
 * Schema-org strategy extracts JSON-LD JobPosting data (what Google Jobs reads).
 * This is the legally cleanest approach: the structured data exists specifically
 * for machine consumption (hiQ v. LinkedIn 2022, Feist v. Rural Telephone 1991).
 */
export const CARRIERS: CarrierConfig[] = [

  // ── DRY VAN · OTR ───────────────────────────────────────────────────────

  {
    name: "Werner Enterprises",
    url: "https://jobs.werner.com/jobs",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "OTR",
  },
  {
    name: "Schneider National",
    url: "https://schneiderjobs.com/truck-driving-jobs",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    extraUrls: [
      "https://schneiderjobs.com/truck-driving-jobs/dedicated",
      "https://schneiderjobs.com/truck-driving-jobs/regional",
    ],
  },
  {
    name: "Heartland Express",
    url: "https://www.heartlandexpress.com/drive-for-us/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "OTR",
  },
  {
    name: "USA Truck",
    url: "https://www.usatruck.com/drivers/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "OTR",
  },
  {
    name: "Crete Carrier",
    url: "https://jobs.cretecarrier.com/jobs",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
  },
  {
    name: "Covenant Logistics",
    url: "https://covenanttransport.com/careers/truck-driving-jobs",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    extraUrls: [
      "https://covenanttransport.com/careers/team-driving-jobs",
    ],
  },
  {
    name: "Western Express",
    url: "https://www.westernexp.com/drivers/company-drivers/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "OTR",
    extraUrls: [
      "https://www.westernexp.com/drivers/owner-operators/",
    ],
  },
  {
    name: "Nussbaum Transportation",
    url: "https://nussbaum.com/drive/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "Regional",
  },
  {
    name: "Pam Transport",
    url: "https://www.pamtransport.com/careers/drivers/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "OTR",
  },
  {
    name: "Cargo Transporters",
    url: "https://www.cargotransporters.com/careers/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "Regional",
  },
  {
    name: "Abilene Motor Express",
    url: "https://www.abilenemotor.com/careers/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "Regional",
  },
  {
    name: "Bison Transport",
    url: "https://www.bisontransport.com/careers/driver-opportunities/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "OTR",
  },
  {
    name: "PTL (Paschall Truck Lines)",
    url: "https://www.ptl-inc.com/drive-for-ptl/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
  },
  {
    name: "US Xpress",
    url: "https://www.usxpress.com/drive/company-drivers/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "OTR",
    extraUrls: [
      "https://www.usxpress.com/drive/dedicated/",
    ],
  },
  {
    name: "Ozark Motor Lines",
    url: "https://www.ozarkmotorlines.com/careers/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "Regional",
  },

  // ── REFRIGERATED / REEFER ────────────────────────────────────────────────

  {
    name: "Prime Inc",
    url: "https://careers.primeinc.com/jobs",
    strategy: "schema-org",
    defaultEquipment: "Reefer",
    defaultRouteType: "OTR",
    extraUrls: [
      "https://careers.primeinc.com/jobs?category=Company+Driver",
    ],
  },
  {
    name: "Stevens Transport",
    url: "https://stevenstransport.com/become-a-driver/",
    strategy: "schema-org",
    defaultEquipment: "Reefer",
    defaultRouteType: "OTR",
  },
  {
    name: "C.R. England",
    url: "https://www.crengland.com/driver-jobs/",
    strategy: "schema-org",
    defaultEquipment: "Reefer",
    defaultRouteType: "OTR",
    extraUrls: [
      "https://www.crengland.com/driver-jobs/regional/",
      "https://www.crengland.com/driver-jobs/dedicated/",
    ],
  },
  {
    name: "Marten Transport",
    url: "https://www.marten.com/drive-for-marten/",
    strategy: "schema-org",
    defaultEquipment: "Reefer",
    defaultRouteType: "OTR",
  },
  {
    name: "Millis Transfer",
    url: "https://www.millistransfer.com/driver-jobs/",
    strategy: "schema-org",
    defaultEquipment: "Reefer",
    defaultRouteType: "Regional",
  },

  // ── FLATBED ──────────────────────────────────────────────────────────────

  {
    name: "Melton Truck Lines",
    url: "https://www.meltontruck.com/drivers/",
    strategy: "schema-org",
    defaultEquipment: "Flatbed",
  },
  {
    name: "Maverick Transportation",
    url: "https://maverickusa.com/drivers",
    strategy: "schema-org",
    defaultEquipment: "Flatbed",
    extraUrls: [
      "https://maverickusa.com/drivers/owner-operators",
    ],
  },
  {
    name: "TMC Transportation",
    url: "https://www.tmctrans.com/drive-for-tmc/",
    strategy: "schema-org",
    defaultEquipment: "Flatbed",
    defaultRouteType: "OTR",
  },
  {
    name: "Boyd Bros Transportation",
    url: "https://www.boydbros.com/careers/",
    strategy: "schema-org",
    defaultEquipment: "Flatbed",
    defaultRouteType: "OTR",
  },
  {
    name: "Daseke",
    url: "https://www.daseke.com/careers/drivers/",
    strategy: "schema-org",
    defaultEquipment: "Flatbed",
    extraUrls: [
      "https://www.daseke.com/careers/owner-operators/",
    ],
  },
  {
    name: "Roehl Transport",
    url: "https://www.roehl.net/driving-jobs/",
    strategy: "schema-org",
    defaultEquipment: "Flatbed",
    extraUrls: [
      "https://www.roehl.net/driving-jobs/refrigerated/",
      "https://www.roehl.net/driving-jobs/tanker/",
    ],
  },

  // ── TANKER ───────────────────────────────────────────────────────────────

  {
    name: "Groendyke Transport",
    url: "https://www.groendyke.com/careers/",
    strategy: "schema-org",
    defaultEquipment: "Tanker",
    defaultRouteType: "OTR",
  },
  {
    name: "Quality Carriers",
    url: "https://www.qualitycarriers.com/careers/drivers/",
    strategy: "schema-org",
    defaultEquipment: "Tanker",
  },
  {
    name: "Kenan Advantage Group",
    url: "https://www.kag.com/careers/",
    strategy: "schema-org",
    defaultEquipment: "Tanker",
    extraUrls: [
      "https://www.kag.com/careers/drivers/",
    ],
  },

  // ── DEDICATED / MIXED ────────────────────────────────────────────────────

  {
    name: "Cardinal Logistics",
    url: "https://www.cardinallogistics.com/careers/drivers/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "Dedicated",
  },
  {
    name: "NFI Industries",
    url: "https://www.nfiindustries.com/careers/drivers/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "Dedicated",
  },

  // ── LTL / REGIONAL ───────────────────────────────────────────────────────

  {
    name: "R+L Carriers",
    url: "https://www.rlcarriers.com/careers/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "Regional",
  },
  {
    name: "Saia Inc",
    url: "https://www.saia.com/careers/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "Regional",
  },
  {
    name: "Averitt Express",
    url: "https://www.averitt.com/careers/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "Regional",
  },

  // ── TRUCKING JOB BOARDS ──────────────────────────────────────────────────

  {
    name: "CDLjobs.com",
    url: "https://www.cdljobs.com/jobs/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "OTR",
  },
  {
    name: "iHireTransportation",
    url: "https://www.ihiretransportation.com/jobs/q-cdl-class-a-truck-driver/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "OTR",
  },
  {
    name: "JobsInTrucks.com",
    url: "https://www.jobsintrucks.com/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "OTR",
  },
  {
    name: "TruckingUnlimited.com",
    url: "https://truckingunlimited.com/jobs/",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "OTR",
  },
  {
    name: "HireMilitary.com",
    url: "https://hiremilitary.com/jobs/?q=truck+driver+CDL",
    strategy: "schema-org",
    defaultEquipment: "Dry Van",
    defaultRouteType: "OTR",
  },

];
