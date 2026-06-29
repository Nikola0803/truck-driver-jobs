export interface StateInfo { abbr: string; name: string }
export interface EquipmentInfo { label: string; dbValue: string }

export const STATE_SLUGS: Record<string, StateInfo> = {
  "texas":          { abbr: "TX", name: "Texas" },
  "florida":        { abbr: "FL", name: "Florida" },
  "georgia":        { abbr: "GA", name: "Georgia" },
  "illinois":       { abbr: "IL", name: "Illinois" },
  "pennsylvania":   { abbr: "PA", name: "Pennsylvania" },
  "ohio":           { abbr: "OH", name: "Ohio" },
  "mississippi":    { abbr: "MS", name: "Mississippi" },
  "indiana":        { abbr: "IN", name: "Indiana" },
  "north-carolina": { abbr: "NC", name: "North Carolina" },
  "alabama":        { abbr: "AL", name: "Alabama" },
  "virginia":       { abbr: "VA", name: "Virginia" },
  "california":     { abbr: "CA", name: "California" },
  "tennessee":      { abbr: "TN", name: "Tennessee" },
  "south-carolina": { abbr: "SC", name: "South Carolina" },
  "new-jersey":     { abbr: "NJ", name: "New Jersey" },
  "wisconsin":      { abbr: "WI", name: "Wisconsin" },
  "new-york":       { abbr: "NY", name: "New York" },
  "maryland":       { abbr: "MD", name: "Maryland" },
  "louisiana":      { abbr: "LA", name: "Louisiana" },
};

export const EQUIPMENT_SLUGS: Record<string, EquipmentInfo> = {
  "dry-van":  { label: "Dry Van",  dbValue: "Dry Van" },
  "flatbed":  { label: "Flatbed",  dbValue: "Flatbed" },
  "reefer":   { label: "Reefer",   dbValue: "Reefer" },
  "tanker":   { label: "Tanker",   dbValue: "Tanker" },
};

export function resolveSlug(slug: string):
  | { type: "state";     state: StateInfo }
  | { type: "equipment"; equipment: EquipmentInfo }
  | null {
  if (STATE_SLUGS[slug])     return { type: "state",     state: STATE_SLUGS[slug] };
  if (EQUIPMENT_SLUGS[slug]) return { type: "equipment", equipment: EQUIPMENT_SLUGS[slug] };
  return null;
}
