/**
 * Isolated Development Source for Emergency & Disaster Skill Categories
 * 
 * In Stage 17 (Backend Integration), these will be fetched directly
 * from FastAPI / PostgreSQL taxonomy endpoints.
 */

export const SKILL_CATEGORIES = [
  'Medical & Trauma Care',
  'Search & Rescue (SAR)',
  'Emergency Communications & Radio',
  'Logistics & Supply Distribution',
  'Heavy Equipment & Operations',
  'Shelter Management & Food Relief',
  'Mental Health & Crisis Counseling',
  'Incident Command & Coordination',
  'Hazardous Materials & Safety',
  'Water & Flood Defense',
  'Community Outreach & Evacuation'
];

/**
 * Strict Proficiency Levels specified in master instruction
 */
export const PROFICIENCY_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert'
];

/**
 * Availability Options for Volunteer Profiles
 */
export const AVAILABILITY_OPTIONS = [
  'Available 24/7 (Emergency Deployment)',
  'Weekends & Holidays Only',
  'Weekday Evenings & Weekends',
  'On-Call / Rapid Surge Only',
  'Scheduled Drills Only',
  'Temporarily Unavailable'
];

/**
 * Transportation Options for Volunteer Profiles
 */
export const TRANSPORTATION_OPTIONS = [
  'Personal 4x4 / Off-Road Vehicle',
  'Standard Passenger Vehicle (Sedan / SUV)',
  'Light Truck / Van (Cargo Capacity)',
  'Motorcycle / Scooter',
  'Bicycle / e-Bike',
  'Public Transit / Carpool Only',
  'On Foot / Staging Area Only'
];

export default SKILL_CATEGORIES;
