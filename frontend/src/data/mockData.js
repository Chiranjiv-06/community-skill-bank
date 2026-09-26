/**
 * Isolated Temporary Data Foundation
 * Used solely for frontend layout demonstration.
 * In later stages, services will call api.js and fetch real database models.
 */

export const MOCK_STATISTICS = {
  activeEmergencies: 3,
  registeredVolunteers: 1420,
  skillsIndexed: 86,
  averageResponseMinutes: 12.4,
  activeDeployments: 18,
  readinessRate: '98.2%'
};

export const MOCK_EMERGENCIES = [
  {
    id: 'emg-101',
    title: 'Flash Flood Evacuation & Search Assistance',
    location: 'Riverside Basin - Sector 3',
    severity: 'critical',
    status: 'active',
    reportedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    requiredSkills: ['Swift Water Rescue', 'First Aid / EMT', 'Boat Operation', 'Ham Radio'],
    volunteersDeployed: 12,
    volunteersNeeded: 20
  },
  {
    id: 'emg-102',
    title: 'Post-Storm Electrical Grid & Debris Clearing',
    location: 'North Highland Corridor',
    severity: 'high',
    status: 'active',
    reportedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    requiredSkills: ['Heavy Machinery', 'Chainsaw Operation', 'Traffic Control'],
    volunteersDeployed: 8,
    volunteersNeeded: 15
  },
  {
    id: 'emg-103',
    title: 'Emergency Shelter Logistics & Triage Setup',
    location: 'Civic Pavilion Hall B',
    severity: 'moderate',
    status: 'active',
    reportedAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    requiredSkills: ['Shelter Management', 'Medical Triage', 'Food Distribution'],
    volunteersDeployed: 16,
    volunteersNeeded: 16
  }
];

export const MOCK_VOLUNTEER_PROFILE = {
  id: 'vol-8812',
  name: 'Alex Rivera',
  role: 'skilled_volunteer',
  badgeId: 'CSB-7749',
  trustScore: 98,
  verified: true,
  phone: '+1 (555) 234-8901',
  email: 'alex.rivera@skillbank.org',
  location: 'District 4 - Metro Sector',
  skills: [
    { id: 'sk-1', name: 'Emergency Triage & Trauma Care', level: 'Advanced', verified: true },
    { id: 'sk-2', name: 'Disaster Radio Communications', level: 'Certified', verified: true },
    { id: 'sk-3', name: 'Search & Canine Support', level: 'Intermediate', verified: true },
    { id: 'sk-4', name: 'Off-Road Vehicle Transport', level: 'Expert', verified: false }
  ],
  certifications: [
    { id: 'crt-1', name: 'FEMA ICS-100 Incident Command', issuedBy: 'Federal Emergency Agency', validUntil: '2027-12-31' },
    { id: 'crt-2', name: 'BLS / ACLS Healthcare Provider', issuedBy: 'Red Cross', validUntil: '2026-10-15' }
  ],
  assignmentsCompleted: 14,
  hoursContributed: 86
};

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'High Priority Alert: Flash Flood Sector 3',
    message: 'Your Swift Water Rescue & Trauma skills match an active incident.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    type: 'critical',
    read: false
  },
  {
    id: 'notif-2',
    title: 'Certification Verification Approved',
    message: 'Your FEMA ICS-100 credential has been verified by Admin Command.',
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    type: 'success',
    read: true
  }
];

export const MOCK_COMMUNITY_ACTIVITIES = [
  {
    id: 'act-1',
    title: 'Community Sandbagging & Flood Barrier Prep',
    date: 'Tomorrow, 08:00 AM',
    location: 'District 2 Riverwalk',
    participants: 34,
    organizer: 'Civic Resilience Team'
  },
  {
    id: 'act-2',
    title: 'Quarterly Emergency Radio Mesh Drill',
    date: 'Saturday, 10:00 AM',
    location: 'Summit Hill repeater station',
    participants: 18,
    organizer: 'Amateur Radio Response Corps'
  }
];
