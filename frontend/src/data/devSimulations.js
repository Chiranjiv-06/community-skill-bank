/**
 * Isolated Development Data for Stage 14 — Disaster Simulation
 * 
 * Provides realistic hypothetical disaster scenarios for planning and stress-testing:
 * - Scenario metadata (Disaster type, affected area, radius, duration, demand multiplier)
 * - Simulation requirements (Skill, category, min proficiency, headcount, urgency)
 * - Simulated outcome results (Demand, capacity, fulfilled, gaps, fulfillment %, pressure)
 * - Time-series simulation progression timeline
 * 
 * STRICT ISOLATION:
 * Simulation data NEVER mutates real emergencies, assignments, or notifications.
 */

export const SIMULATION_DISASTER_TYPES = [
  'Flood',
  'Earthquake',
  'Fire',
  'Cyclone',
  'Landslide',
  'Industrial Accident',
  'General Emergency'
];

export const SIMULATION_STATUSES = {
  DRAFT: 'Draft',
  CONFIGURED: 'Configured',
  READY: 'Ready',
  RUNNING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed'
};

export const INITIAL_DEV_SIMULATIONS = [
  {
    id: 'sim-01',
    name: 'Coastal Basin Category 4 Cyclone & Tidal Surge',
    disasterType: 'Cyclone',
    affectedArea: 'Ward 7 — Riverside Basin & Lowlands',
    coordinates: [34.0582, -118.2483],
    radius: 18,
    duration: 72,
    demandMultiplier: 1.5,
    status: SIMULATION_STATUSES.COMPLETED,
    createdAt: '2026-09-20T08:30:00.000Z',
    lastRun: '2026-09-24T14:15:00.000Z',
    notes: 'Hypothetical coastal inundation breaching secondary levee systems and stranding up to 1,200 residents across low-lying municipal sectors.',
    requirements: [
      {
        id: 'req-01-1',
        skill: 'Swift Water & Flood Rescue',
        category: 'Water & Flood Defense',
        minProficiency: 'Expert',
        minVolunteers: 14,
        urgency: 'Critical'
      },
      {
        id: 'req-01-2',
        skill: 'Emergency Triage & Trauma Care',
        category: 'Medical & Trauma Care',
        minProficiency: 'Advanced',
        minVolunteers: 18,
        urgency: 'Critical'
      },
      {
        id: 'req-01-3',
        skill: 'Radio Mesh Relay Operation',
        category: 'Emergency Communications & Radio',
        minProficiency: 'Intermediate',
        minVolunteers: 8,
        urgency: 'High'
      },
      {
        id: 'req-01-4',
        skill: 'Heavy Equipment & Box Shoring',
        category: 'Heavy Equipment & Operations',
        minProficiency: 'Intermediate',
        minVolunteers: 10,
        urgency: 'High'
      },
      {
        id: 'req-01-5',
        skill: 'Rapid Shelter Intake & Hygiene',
        category: 'Shelter Management & Food Relief',
        minProficiency: 'Beginner',
        minVolunteers: 12,
        urgency: 'Medium'
      }
    ],
    results: {
      totalDemand: 93,
      availableCapacity: 76,
      fulfilledDemand: 72,
      unfulfilledDemand: 21,
      fulfillmentRate: 77.4,
      responsePressureScore: 78,
      responsePressureTier: 'Severe',
      executedAt: '2026-09-24T14:15:00.000Z',
      skillGaps: [
        {
          skill: 'Swift Water & Flood Rescue',
          category: 'Water & Flood Defense',
          required: 21,
          available: 15,
          gap: 6,
          urgency: 'Critical'
        },
        {
          skill: 'Emergency Triage & Trauma Care',
          category: 'Medical & Trauma Care',
          required: 27,
          available: 20,
          gap: 7,
          urgency: 'Critical'
        },
        {
          skill: 'Radio Mesh Relay Operation',
          category: 'Emergency Communications & Radio',
          required: 12,
          available: 10,
          gap: 2,
          urgency: 'High'
        },
        {
          skill: 'Heavy Equipment & Box Shoring',
          category: 'Heavy Equipment & Operations',
          required: 15,
          available: 11,
          gap: 4,
          urgency: 'High'
        },
        {
          skill: 'Rapid Shelter Intake & Hygiene',
          category: 'Shelter Management & Food Relief',
          required: 18,
          available: 20,
          gap: 0,
          urgency: 'Medium'
        }
      ]
    },
    timeline: [
      { step: 'T+0h', label: 'T+0h (Onset & Surge Impact)', demand: 32, capacity: 14, fulfilled: 14, pressure: 88 },
      { step: 'T+6h', label: 'T+6h (Immediate Mobilization)', demand: 68, capacity: 36, fulfilled: 36, pressure: 84 },
      { step: 'T+18h', label: 'T+18h (Peak Response Pressure)', demand: 93, capacity: 62, fulfilled: 62, pressure: 78 },
      { step: 'T+36h', label: 'T+36h (Secondary Relief Staging)', demand: 85, capacity: 74, fulfilled: 70, pressure: 60 },
      { step: 'T+72h', label: 'T+72h (Stabilization & Demobilization)', demand: 45, capacity: 76, fulfilled: 45, pressure: 35 }
    ]
  },
  {
    id: 'sim-02',
    name: 'Downtown Faultline Magnitude 6.9 Seismic Event',
    disasterType: 'Earthquake',
    affectedArea: 'Ward 3 — Central Downtown & Commercial',
    coordinates: [34.0489, -118.2518],
    radius: 12,
    duration: 48,
    demandMultiplier: 2.0,
    status: SIMULATION_STATUSES.READY,
    createdAt: '2026-09-22T11:00:00.000Z',
    lastRun: null,
    notes: 'Simulated high-density commercial collapse scenario with localized gas main ruptures and telecommunication network blackouts.',
    requirements: [
      {
        id: 'req-02-1',
        skill: 'Confined Space & Collapse SAR',
        category: 'Search & Rescue (SAR)',
        minProficiency: 'Expert',
        minVolunteers: 12,
        urgency: 'Critical'
      },
      {
        id: 'req-02-2',
        skill: 'Mass Casualty Triage & Stabilization',
        category: 'Medical & Trauma Care',
        minProficiency: 'Advanced',
        minVolunteers: 16,
        urgency: 'Critical'
      },
      {
        id: 'req-02-3',
        skill: 'Structural Timber Shoring',
        category: 'Heavy Equipment & Operations',
        minProficiency: 'Advanced',
        minVolunteers: 10,
        urgency: 'High'
      },
      {
        id: 'req-02-4',
        skill: 'Auxiliary Power & Microgrid Setup',
        category: 'Emergency Communications & Radio',
        minProficiency: 'Intermediate',
        minVolunteers: 6,
        urgency: 'High'
      }
    ],
    results: null,
    timeline: []
  },
  {
    id: 'sim-03',
    name: 'East Foothills High-Wind Brushfire Perimeter',
    disasterType: 'Fire',
    affectedArea: 'Ward 9 — East Foothills & Wilderness',
    coordinates: [34.0722, -118.2255],
    radius: 25,
    duration: 36,
    demandMultiplier: 1.2,
    status: SIMULATION_STATUSES.CONFIGURED,
    createdAt: '2026-09-23T16:45:00.000Z',
    lastRun: null,
    notes: 'Simulated interface brushfire driven by 45mph Santa Ana winds endangering residential structures along canyon corridors.',
    requirements: [
      {
        id: 'req-03-1',
        skill: 'Wildfire Perimeter Defense & Structure Protection',
        category: 'Hazardous Materials & Safety',
        minProficiency: 'Advanced',
        minVolunteers: 15,
        urgency: 'Critical'
      },
      {
        id: 'req-03-2',
        skill: 'Vulnerable Population Evacuation Escort',
        category: 'Community Outreach & Evacuation',
        minProficiency: 'Intermediate',
        minVolunteers: 10,
        urgency: 'High'
      },
      {
        id: 'req-03-3',
        skill: 'Livestock & Domestic Animal Rescue',
        category: 'Logistics & Supply Distribution',
        minProficiency: 'Beginner',
        minVolunteers: 6,
        urgency: 'Medium'
      }
    ],
    results: null,
    timeline: []
  }
];

export default INITIAL_DEV_SIMULATIONS;
