/**
 * Isolated Development Data for Assignments & Responses (Stage 7)
 * 
 * In Stage 17 (Backend Integration), these will be fetched directly
 * from FastAPI / PostgreSQL assignment endpoints.
 * 
 * Progression:
 * assigned -> accepted (or declined) -> in_progress -> completed
 */

export const ASSIGNMENT_STATUSES = [
  'assigned',
  'accepted',
  'in_progress',
  'completed',
  'declined'
];

export const ASSIGNMENT_STATUS_LABELS = {
  assigned: 'Assigned',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  completed: 'Completed',
  declined: 'Declined'
};

export const ASSIGNMENT_STATUS_VARIANTS = {
  assigned: 'warning',
  accepted: 'info',
  in_progress: 'primary',
  completed: 'success',
  declined: 'critical'
};

export const ASSIGNMENT_PRIORITIES = [
  'Critical Surge',
  'High Priority',
  'Standard Deployment',
  'Secondary Reserve'
];

/**
 * Initial Seed Development Assignments
 */
export const INITIAL_DEV_ASSIGNMENTS = [
  {
    id: 'asg-701',
    emergencyId: 'emg-501',
    emergencyTitle: 'Flash Flood Rescue & Evacuation - Ward 7',
    emergencyLocation: 'Ward 7 - Riverside Basin & Lowlands',
    emergencySeverity: 'critical',
    volunteerId: 'dev-skl-002',
    volunteerName: 'Alex Rivera',
    volunteerEmail: 'alex.rivera@skillbank.org',
    volunteerPhone: '+1 (555) 234-8901',
    skill: 'Swift Water & Flood Rescue',
    proficiency: 'Advanced',
    category: 'Search & Rescue (SAR)',
    status: 'assigned',
    priority: 'Critical Surge',
    stagingArea: 'Ward 7 Levee Pier 3 - Incident Staging Post',
    instructions: 'Deploy with inflatable watercraft and personal protective equipment. Assist Section Chief with residential door-to-door evacuation along flooded lowlands.',
    assignedBy: 'Cmdr. Sarah Vance (Incident Command)',
    createdTime: '2026-09-25T10:15:00.000Z',
    updatedTime: '2026-09-25T10:15:00.000Z',
    responseInfo: null,
    inProgressInfo: null,
    completionInfo: null
  },
  {
    id: 'asg-702',
    emergencyId: 'emg-501',
    emergencyTitle: 'Flash Flood Rescue & Evacuation - Ward 7',
    emergencyLocation: 'Ward 7 - Riverside Basin & Lowlands',
    emergencySeverity: 'critical',
    volunteerId: 'vol-501-1',
    volunteerName: 'Marcus Vance',
    volunteerEmail: 'marcus.vance@example.org',
    volunteerPhone: '+1 (555) 345-6789',
    skill: 'Swift Water & Flood Rescue',
    proficiency: 'Expert',
    category: 'Search & Rescue (SAR)',
    status: 'in_progress',
    priority: 'Critical Surge',
    stagingArea: 'Ward 7 Levee Sector B Watercraft Launch',
    instructions: 'Lead rapid extraction watercraft team to rescue trapped motorists on the inundated North Crossing bypass.',
    assignedBy: 'Cmdr. Sarah Vance (Incident Command)',
    createdTime: '2026-09-25T08:30:00.000Z',
    updatedTime: '2026-09-25T09:20:00.000Z',
    responseInfo: {
      respondedAt: '2026-09-25T08:42:00.000Z',
      response: 'accepted',
      notes: 'Gear secured in 4x4. Mobile and en route to Sector B watercraft ramp.'
    },
    inProgressInfo: {
      startedAt: '2026-09-25T09:15:00.000Z',
      notes: 'Watercraft launched on river channel. 4 motorists evacuated safely to high-ground staging post.'
    },
    completionInfo: null
  },
  {
    id: 'asg-703',
    emergencyId: 'emg-502',
    emergencyTitle: 'Seismic Structural Collapse & Trapped Persons',
    emergencyLocation: 'Harbor Gateway - Industrial District 4',
    emergencySeverity: 'critical',
    volunteerId: 'vol-502-1',
    volunteerName: 'Hector Gutierrez',
    volunteerEmail: 'hector.gutierrez@example.org',
    volunteerPhone: '+1 (555) 222-3344',
    skill: 'Heavy Equipment & Operations',
    proficiency: 'Expert',
    category: 'Heavy Equipment & Operations',
    status: 'accepted',
    priority: 'Critical Surge',
    stagingArea: 'Industrial District 4 - Gate 3 Staging Depot',
    instructions: 'Operate hydraulic excavator to clear concrete structural slabs blocking primary collapsed warehouse entrance.',
    assignedBy: 'Cmdr. Sarah Vance (Incident Command)',
    createdTime: '2026-09-25T09:00:00.000Z',
    updatedTime: '2026-09-25T09:18:00.000Z',
    responseInfo: {
      respondedAt: '2026-09-25T09:18:00.000Z',
      response: 'accepted',
      notes: 'Low-bed machinery trailer dispatched. Estimated time of arrival at Gate 3 is 20 minutes.'
    },
    inProgressInfo: null,
    completionInfo: null
  },
  {
    id: 'asg-704',
    emergencyId: 'emg-505',
    emergencyTitle: 'Subway Flooding Mop-up & Grid Inspection',
    emergencyLocation: 'Central Metro Station - Blue Line Underpass',
    emergencySeverity: 'low',
    volunteerId: 'dev-skl-002',
    volunteerName: 'Alex Rivera',
    volunteerEmail: 'alex.rivera@skillbank.org',
    volunteerPhone: '+1 (555) 234-8901',
    skill: 'Emergency Triage & Trauma Care',
    proficiency: 'Advanced',
    category: 'Medical & Trauma Care',
    status: 'completed',
    priority: 'Standard Deployment',
    stagingArea: 'Central Metro Concourse Level 2',
    instructions: 'Establish medical evaluation post for transit maintenance crew working on flooded electrical sub-panels.',
    assignedBy: 'Cmdr. Sarah Vance (Incident Command)',
    createdTime: '2026-09-24T10:00:00.000Z',
    updatedTime: '2026-09-24T16:45:00.000Z',
    responseInfo: {
      respondedAt: '2026-09-24T10:12:00.000Z',
      response: 'accepted',
      notes: 'First aid kits and trauma bag loaded. On-site in 15 minutes.'
    },
    inProgressInfo: {
      startedAt: '2026-09-24T10:35:00.000Z',
      notes: 'Triage canopy set up at turnstile checkpoint. Evaluating maintenance technicians.'
    },
    completionInfo: {
      completedAt: '2026-09-24T16:45:00.000Z',
      completionNotes: 'All 14 transit workers screened. Minor abrasions treated; zero hypothermia or electrical injuries. Transit Authority officially signed off.'
    }
  },
  {
    id: 'asg-705',
    emergencyId: 'emg-503',
    emergencyTitle: 'Wildfire Peripheral Evacuation & Staging Support',
    emergencyLocation: 'North Canyon Perimeter - Hillside Sector',
    emergencySeverity: 'high',
    volunteerId: 'vol-503-1',
    volunteerName: 'Carlos Mendez',
    volunteerEmail: 'carlos.mendez@example.org',
    volunteerPhone: '+1 (555) 667-8899',
    skill: 'Community Outreach & Evacuation',
    proficiency: 'Intermediate',
    category: 'Community Outreach & Evacuation',
    status: 'assigned',
    priority: 'High Priority',
    stagingArea: 'North Canyon Ranger Outpost - Evacuation Checkpoint A',
    instructions: 'Assist county sheriffs with bilingual residential notifications along West Canyon Ridge.',
    assignedBy: 'Cmdr. Sarah Vance (Incident Command)',
    createdTime: '2026-09-25T11:00:00.000Z',
    updatedTime: '2026-09-25T11:00:00.000Z',
    responseInfo: null,
    inProgressInfo: null,
    completionInfo: null
  }
];

export default {
  ASSIGNMENT_STATUSES,
  ASSIGNMENT_STATUS_LABELS,
  ASSIGNMENT_STATUS_VARIANTS,
  ASSIGNMENT_PRIORITIES,
  INITIAL_DEV_ASSIGNMENTS
};
