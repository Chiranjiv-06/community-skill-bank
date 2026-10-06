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
];

/**
 * Master Disaster & Emergency Skills Taxonomy
 * Official ontology defining capabilities, certification requirements, and verification standards.
 */
export const MASTER_SKILLS_TAXONOMY = [
  {
    id: 'sk-tax-01',
    title: 'Emergency Triage & Trauma Care',
    category: 'Medical & Trauma Care',
    description: 'Rapid START triage classification, severe hemorrhage control with tactical tourniquets, airway stabilization, and mass casualty intake.',
    proficiency: 'Expert',
    requiredCertifications: ['BLS / ACLS Healthcare Provider', 'EMT-Basic or Paramedic'],
    verificationCriteria: 'Active state medical license or verified American Heart Association registry transcript.',
    disasterScenarios: ['Mass Casualty', 'Earthquake', 'Flash Flood'],
    status: 'Standardized'
  },
  {
    id: 'sk-tax-02',
    title: 'Swift Water & Flood Rescue',
    category: 'Water & Flood Defense',
    description: 'Deployment of motorized inflatable rescue craft, high-line technical rope rigging, throw-bag retrieval, and turbulent river evacuation.',
    proficiency: 'Advanced',
    requiredCertifications: ['NFPA 1670 Swiftwater Technician', 'Rescue 3 SRT'],
    verificationCriteria: 'Accredited international rescue academy practical examination certificate.',
    disasterScenarios: ['River Surge', 'Dam Breach', 'Atmospheric Storm'],
    status: 'Standardized'
  },
  {
    id: 'sk-tax-03',
    title: 'Emergency Radio Mesh & Tactical Telecommunications',
    category: 'Emergency Communications & Radio',
    description: 'Establishment of off-grid VHF/UHF amateur repeaters, LoRa emergency packet mesh networks, and Winlink disaster email systems without grid power.',
    proficiency: 'Intermediate',
    requiredCertifications: ['FCC Amateur Radio License (General/Extra)', 'ARRL ARES Level 2'],
    verificationCriteria: 'Federal Communications Commission Universal Licensing System callsign match.',
    disasterScenarios: ['Grid Blackout', 'Earthquake', 'Wildfire Telecom Severance'],
    status: 'Standardized'
  },
  {
    id: 'sk-tax-04',
    title: 'Urban Search & Canine Rescue (USAR)',
    category: 'Search & Rescue (SAR)',
    description: 'Structural collapse void-space search, acoustic listening telemetry, disaster canine direction, and victim extrication coordination.',
    proficiency: 'Expert',
    requiredCertifications: ['FEMA USAR Specialist', 'NASAR SARTECH II'],
    verificationCriteria: 'National search and rescue association field certification and canine registry.',
    disasterScenarios: ['Earthquake', 'Structural Collapse', 'Tornado'],
    status: 'Standardized'
  },
  {
    id: 'sk-tax-05',
    title: 'Hazardous Materials Containment & Decon',
    category: 'Hazardous Materials & Safety',
    description: 'Chemical perimeter isolation, Level B/C encapsulated suit operations, containment boom deployment, and gross decontamination corridors.',
    proficiency: 'Advanced',
    requiredCertifications: ['OSHA HAZWOPER 40-hr', 'NFPA 472 Hazmat Operations'],
    verificationCriteria: 'Certified training academy course certificate and annual refresher documentation.',
    disasterScenarios: ['Chemical Spill', 'Train Derailment', 'Pipeline Leak'],
    status: 'Standardized'
  },
  {
    id: 'sk-tax-06',
    title: 'Disaster Relief Staging Logistics & Intake',
    category: 'Logistics & Supply Distribution',
    description: 'Emergency supply chain staging, pallet manifest tracking, distribution point (POD) setup, and emergency freight intake operations.',
    proficiency: 'Intermediate',
    requiredCertifications: ['FEMA IS-26: Points of Distribution', 'OSHA Forklift Operator'],
    verificationCriteria: 'FEMA Emergency Management Institute credential and powered vehicle card.',
    disasterScenarios: ['Regional Evacuation', 'Hurricane Relief', 'Prolonged Outage'],
    status: 'Standardized'
  },
  {
    id: 'sk-tax-07',
    title: 'Mass Evacuation Shelter Operations',
    category: 'Shelter Management & Food Relief',
    description: 'Congregate evacuee shelter registration, cot staging, ADA accessibility accommodations, sanitary food distribution, and family reunification.',
    proficiency: 'Intermediate',
    requiredCertifications: ['Red Cross Disaster Shelter Fundamentals', 'ServSafe Food Handler'],
    verificationCriteria: 'American Red Cross Disaster Services volunteer authorization transcript.',
    disasterScenarios: ['Wildfire Evacuation', 'Hurricane Landfall', 'Tsunami Warning'],
    status: 'Standardized'
  },
  {
    id: 'sk-tax-08',
    title: 'Crisis Psychological First Aid (PFA)',
    category: 'Mental Health & Crisis Counseling',
    description: 'Acute psychological trauma support, survivor emotional grounding, bereavement guidance, and frontline responder debriefing sessions.',
    proficiency: 'Advanced',
    requiredCertifications: ['Psychological First Aid (PFA) NCTSN', 'Licensed Counselor / MSW'],
    verificationCriteria: 'State behavioral health licensing board or national PFA training certificate.',
    disasterScenarios: ['All-Hazards Trauma', 'Prolonged Displacement', 'Responder Fatigue'],
    status: 'Standardized'
  },
  {
    id: 'sk-tax-09',
    title: 'Incident Command System (ICS) Section Operations',
    category: 'Incident Command & Coordination',
    description: 'Incident Action Plan (IAP) formulation, branch director oversight, operational period briefings, and unified command inter-agency liaison.',
    proficiency: 'Expert',
    requiredCertifications: ['FEMA ICS-100', 'FEMA ICS-200', 'FEMA ICS-300'],
    verificationCriteria: 'FEMA Emergency Management Institute official course completions.',
    disasterScenarios: ['Major Disaster Declaration', 'Multi-Jurisdictional Crisis'],
    status: 'Standardized'
  },
  {
    id: 'sk-tax-10',
    title: 'Heavy Equipment & Structural Shoring',
    category: 'Heavy Equipment & Operations',
    description: 'Operation of hydraulic excavators and skid-steers for debris clearance, timber T-shore and vertical shoring for compromised building envelopes.',
    proficiency: 'Advanced',
    requiredCertifications: ['State Commercial Operator License', 'FEMA Structural Collapse Shoring'],
    verificationCriteria: 'Department of Transportation heavy machinery certification and trade guild proof.',
    disasterScenarios: ['Earthquake Debris', 'Landslide', 'Structural Collapse'],
    status: 'Standardized'
  }
];

export default SKILL_CATEGORIES;

