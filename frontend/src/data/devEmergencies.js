/**
 * Isolated Development Data for Emergency Management & Requirements (Stage 5)
 * 
 * In Stage 17 (Backend Integration), these will be fetched directly
 * from FastAPI / PostgreSQL endpoints.
 */

import { SKILL_CATEGORIES, PROFICIENCY_LEVELS } from './skillCategories.js';

export const EMERGENCY_STATUSES = [
  'open',
  'in_progress',
  'resolved',
  'cancelled'
];

export const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  cancelled: 'Cancelled'
};

export const STATUS_BADGE_VARIANTS = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  cancelled: 'neutral'
};

export const EMERGENCY_SEVERITIES = [
  'critical',
  'high',
  'medium',
  'low'
];

export const SEVERITY_LABELS = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low'
};

export const SEVERITY_BADGE_VARIANTS = {
  critical: 'critical',
  high: 'primary',
  medium: 'info',
  low: 'neutral'
};

export const REQUIREMENT_URGENCIES = [
  'immediate',
  'high',
  'medium',
  'low'
];

export const URGENCY_LABELS = {
  immediate: 'Immediate (Surge)',
  high: 'High Priority',
  medium: 'Medium Priority',
  low: 'Standard Support'
};

export const URGENCY_BADGE_VARIANTS = {
  immediate: 'critical',
  high: 'warning',
  medium: 'info',
  low: 'neutral'
};

/**
 * Initial Seed Emergencies with Requirements
 */
export const INITIAL_DEV_EMERGENCIES = [
  {
    id: 'emg-501',
    title: 'Flash Flood Rescue & Evacuation - Ward 7',
    description: 'Severe sudden torrential rainfall caused River Basin to overflow, trapping residents in sub-surface parking and low-lying residential sectors. Urgent evacuation and watercraft search required.',
    location: 'Ward 7 - Riverside Basin & Lowlands',
    latitude: 34.0582,
    longitude: -118.2483,
    severity: 'critical',
    status: 'open',
    requiredVolunteers: 25,
    createdTime: '2026-09-24T18:30:00.000Z',
    updatedTime: '2026-09-25T08:15:00.000Z',
    requirements: [
      {
        id: 'req-501-1',
        emergencyId: 'emg-501',
        skill: 'Swift Water & Flood Rescue',
        category: 'Search & Rescue (SAR)',
        minProficiency: 'Advanced',
        minVolunteers: 8,
        urgency: 'immediate',
        fulfillmentStatus: '0 / 8 Allocated (Dev Placeholder)'
      },
      {
        id: 'req-501-2',
        emergencyId: 'emg-501',
        skill: 'Emergency Triage & Trauma Care',
        category: 'Medical & Trauma Care',
        minProficiency: 'Intermediate',
        minVolunteers: 6,
        urgency: 'immediate',
        fulfillmentStatus: '0 / 6 Allocated (Dev Placeholder)'
      },
      {
        id: 'req-501-3',
        emergencyId: 'emg-501',
        skill: 'Emergency Ham Radio & Mesh Communications',
        category: 'Emergency Communications & Radio',
        minProficiency: 'Intermediate',
        minVolunteers: 4,
        urgency: 'high',
        fulfillmentStatus: '0 / 4 Allocated (Dev Placeholder)'
      }
    ]
  },
  {
    id: 'emg-502',
    title: 'Seismic Structural Collapse & Trapped Persons',
    description: 'Magnitude 5.8 tremor resulted in partial collapse of industrial storage warehouses and utility line ruptures. Heavy search teams and perimeter logistics needed.',
    location: 'Harbor Gateway - Industrial District 4',
    latitude: 33.8741,
    longitude: -118.2917,
    severity: 'critical',
    status: 'in_progress',
    requiredVolunteers: 18,
    createdTime: '2026-09-25T02:00:00.000Z',
    updatedTime: '2026-09-25T09:45:00.000Z',
    requirements: [
      {
        id: 'req-502-1',
        emergencyId: 'emg-502',
        skill: 'Heavy Equipment & Operations',
        category: 'Heavy Equipment & Operations',
        minProficiency: 'Expert',
        minVolunteers: 5,
        urgency: 'immediate',
        fulfillmentStatus: '0 / 5 Allocated (Dev Placeholder)'
      },
      {
        id: 'req-502-2',
        emergencyId: 'emg-502',
        skill: 'Incident Command & Coordination',
        category: 'Incident Command & Coordination',
        minProficiency: 'Advanced',
        minVolunteers: 3,
        urgency: 'high',
        fulfillmentStatus: '0 / 3 Allocated (Dev Placeholder)'
      }
    ]
  },
  {
    id: 'emg-503',
    title: 'Wildfire Peripheral Evacuation & Staging Support',
    description: 'Brush fire spreading along northern canyon slopes. Mobilizing citizen evacuation corridors, animal transport support, and hydration supply depots.',
    location: 'North Canyon Perimeter - Hillside Sector',
    latitude: 34.1808,
    longitude: -118.3090,
    severity: 'high',
    status: 'open',
    requiredVolunteers: 30,
    createdTime: '2026-09-25T05:20:00.000Z',
    updatedTime: '2026-09-25T07:10:00.000Z',
    requirements: [
      {
        id: 'req-503-1',
        emergencyId: 'emg-503',
        skill: 'Community Outreach & Evacuation',
        category: 'Community Outreach & Evacuation',
        minProficiency: 'Beginner',
        minVolunteers: 15,
        urgency: 'high',
        fulfillmentStatus: '0 / 15 Allocated (Dev Placeholder)'
      },
      {
        id: 'req-503-2',
        emergencyId: 'emg-503',
        skill: 'Disaster Relief Staging Logistics',
        category: 'Logistics & Supply Distribution',
        minProficiency: 'Intermediate',
        minVolunteers: 8,
        urgency: 'medium',
        fulfillmentStatus: '0 / 8 Allocated (Dev Placeholder)'
      }
    ]
  },
  {
    id: 'emg-504',
    title: 'Severe Storm Municipal Shelter Intake & Food Relief',
    description: 'Winter deep-freeze and power loss in East Ward. Temporary warming shelters established at Civic Pavilion and High School Gymnasium.',
    location: 'Civic Pavilion Hall B - East Ward',
    latitude: 34.0416,
    longitude: -118.2120,
    severity: 'medium',
    status: 'open',
    requiredVolunteers: 12,
    createdTime: '2026-09-24T12:00:00.000Z',
    updatedTime: '2026-09-24T20:00:00.000Z',
    requirements: [
      {
        id: 'req-504-1',
        emergencyId: 'emg-504',
        skill: 'Shelter Management & Food Relief',
        category: 'Shelter Management & Food Relief',
        minProficiency: 'Beginner',
        minVolunteers: 8,
        urgency: 'medium',
        fulfillmentStatus: '0 / 8 Allocated (Dev Placeholder)'
      }
    ]
  },
  {
    id: 'emg-505',
    title: 'Subway Flooding Mop-up & Grid Inspection',
    description: 'Sub-level concourse flooding from water main break. Incident was neutralized, cleanup completed, transit authority signed off.',
    location: 'Central Metro Station - Blue Line Underpass',
    latitude: 34.0489,
    longitude: -118.2586,
    severity: 'low',
    status: 'resolved',
    requiredVolunteers: 6,
    createdTime: '2026-09-23T09:00:00.000Z',
    updatedTime: '2026-09-24T16:30:00.000Z',
    requirements: []
  }
];

export default INITIAL_DEV_EMERGENCIES;
