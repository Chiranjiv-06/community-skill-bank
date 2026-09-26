/**
 * Isolated Development Data for Stage 13 — Analytics Dashboard
 * 
 * Provides realistic aggregate analytics telemetry across:
 * - Executive KPIs
 * - Emergency Incident Metrics (Severity, Status, Hazard Type, Time Trends)
 * - Volunteer Demographics & Availability
 * - Skill Categories & Proficiency
 * - Tactical Response Times & Completion Rates
 * - Community Activity RSVPs & Participation
 * - Training & Credential Trust Distributions
 * - Notification Volume & Alert Severities
 * - Geographic Ward & Sector Operational Coverage
 * 
 * Supports time periods: 7d, 30d, 90d.
 */

export const TIME_PERIODS = {
  DAYS_7: '7d',
  DAYS_30: '30d',
  DAYS_90: '90d'
};

export const RAW_DEV_ANALYTICS = {
  // Executive Aggregate KPIs
  kpis: {
    totalEmergencies: 5,
    activeEmergencies: 3,
    registeredVolunteers: 128,
    availableVolunteers: 94,
    completedAssignments: 42,
    responseRate: 91.5,
    communityParticipation: 88.4,
    verifiedSkills: 312
  },

  // Emergency Incident Statistics
  emergencies: {
    bySeverity: [
      { name: 'Critical', count: 2, color: 'var(--color-critical)' },
      { name: 'High', count: 2, color: 'var(--color-warning)' },
      { name: 'Medium', count: 1, color: 'var(--color-info)' },
      { name: 'Low', count: 0, color: 'var(--text-muted)' }
    ],
    byStatus: [
      { name: 'Open', count: 2, color: 'var(--color-critical)' },
      { name: 'In Progress', count: 1, color: 'var(--color-orange-500)' },
      { name: 'Resolved', count: 2, color: 'var(--color-success)' },
      { name: 'Cancelled', count: 0, color: 'var(--text-muted)' }
    ],
    byDisasterType: [
      { type: 'Flood', count: 2, percent: 40 },
      { type: 'Wildfire', count: 1, percent: 20 },
      { type: 'Earthquake', count: 1, percent: 20 },
      { type: 'Industrial Accident', count: 1, percent: 20 }
    ],
    trends: {
      '7d': [
        { label: 'Mon', value: 1 },
        { label: 'Tue', value: 2 },
        { label: 'Wed', value: 2 },
        { label: 'Thu', value: 3 },
        { label: 'Fri', value: 3 },
        { label: 'Sat', value: 3 },
        { label: 'Sun', value: 3 }
      ],
      '30d': [
        { label: 'Week 1', value: 2 },
        { label: 'Week 2', value: 4 },
        { label: 'Week 3', value: 3 },
        { label: 'Week 4', value: 5 }
      ],
      '90d': [
        { label: 'Month 1', value: 7 },
        { label: 'Month 2', value: 11 },
        { label: 'Month 3', value: 9 }
      ]
    }
  },

  // Volunteer Demographics & Mobilization
  volunteers: {
    byRole: [
      { role: 'Skilled Volunteer', count: 82, color: 'var(--color-orange-500)' },
      { role: 'Citizen Volunteer', count: 36, color: 'var(--color-info)' },
      { role: 'Legacy Volunteer', count: 10, color: 'var(--text-muted)' }
    ],
    byAvailability: [
      { status: 'Available for Surge', count: 94, color: 'var(--color-success)' },
      { status: 'Active on Deployment', count: 18, color: 'var(--color-orange-500)' },
      { status: 'Standby / Off Duty', count: 16, color: 'var(--text-muted)' }
    ],
    verificationStatus: [
      { status: 'Fully Cleared / Verified', count: 96, percent: 75 },
      { status: 'Pending Review', count: 22, percent: 17 },
      { status: 'Certification Expiring', count: 10, percent: 8 }
    ],
    onboardingTrend: {
      '7d': [
        { label: 'Mon', value: 118 },
        { label: 'Tue', value: 120 },
        { label: 'Wed', value: 121 },
        { label: 'Thu', value: 123 },
        { label: 'Fri', value: 125 },
        { label: 'Sat', value: 126 },
        { label: 'Sun', value: 128 }
      ],
      '30d': [
        { label: 'Week 1', value: 98 },
        { label: 'Week 2', value: 108 },
        { label: 'Week 3', value: 119 },
        { label: 'Week 4', value: 128 }
      ],
      '90d': [
        { label: 'Month 1', value: 65 },
        { label: 'Month 2', value: 94 },
        { label: 'Month 3', value: 128 }
      ]
    }
  },

  // Skill Distributions & Operational Capacity
  skills: {
    byCategory: [
      { category: 'Search & Rescue', count: 54, color: 'var(--color-orange-500)' },
      { category: 'Medical & Trauma', count: 48, color: 'var(--color-critical)' },
      { category: 'Logistics & Shelter', count: 42, color: 'var(--color-info)' },
      { category: 'Comms & Mesh Radio', count: 36, color: 'var(--color-warning)' },
      { category: 'Fire & Hazmat Defense', count: 32, color: 'var(--color-orange-600)' }
    ],
    byProficiency: [
      { level: 'Expert', count: 45, color: 'var(--color-orange-500)' },
      { level: 'Advanced', count: 82, color: 'var(--color-info)' },
      { level: 'Intermediate', count: 115, color: 'var(--color-success)' },
      { level: 'Beginner', count: 70, color: 'var(--text-muted)' }
    ],
    highDemandSkills: [
      { skill: 'Swift Water & Flood Rescue', demand: 95, fulfillment: 92 },
      { skill: 'Emergency Triage & Trauma Care', demand: 90, fulfillment: 88 },
      { skill: 'Radio Mesh Relay Operation', demand: 85, fulfillment: 75 },
      { skill: 'Box Cribbing & Heavy Shoring', demand: 80, fulfillment: 70 },
      { skill: 'Rapid Shelter Intake & Hygiene', demand: 75, fulfillment: 85 }
    ]
  },

  // Tactical Response Performance
  response: {
    assignmentBreakdown: [
      { status: 'Completed', count: 42, color: 'var(--color-success)' },
      { status: 'Accepted & Mobilizing', count: 12, color: 'var(--color-info)' },
      { status: 'In Progress On-Scene', count: 6, color: 'var(--color-orange-500)' },
      { status: 'Declined / Re-routed', count: 4, color: 'var(--color-critical)' }
    ],
    completionRate: 91.3,
    avgResponseMinutes: 12.4,
    responseTrends: {
      '7d': [
        { label: 'Mon', value: 14.2 },
        { label: 'Tue', value: 13.5 },
        { label: 'Wed', value: 13.0 },
        { label: 'Thu', value: 12.8 },
        { label: 'Fri', value: 12.5 },
        { label: 'Sat', value: 12.4 },
        { label: 'Sun', value: 12.4 }
      ],
      '30d': [
        { label: 'Week 1', value: 16.5 },
        { label: 'Week 2', value: 15.0 },
        { label: 'Week 3', value: 13.8 },
        { label: 'Week 4', value: 12.4 }
      ],
      '90d': [
        { label: 'Month 1', value: 19.2 },
        { label: 'Month 2', value: 15.6 },
        { label: 'Month 3', value: 12.4 }
      ]
    }
  },

  // Community Activity Participation
  community: {
    byStatus: [
      { status: 'Completed', count: 6, color: 'var(--color-success)' },
      { status: 'Scheduled & Open', count: 4, color: 'var(--color-info)' },
      { status: 'In Progress', count: 1, color: 'var(--color-orange-500)' },
      { status: 'Cancelled', count: 1, color: 'var(--text-muted)' }
    ],
    totalRsvps: 156,
    attendanceRate: 88.4,
    byCategory: [
      { category: 'Flood Prep & Sandbagging', count: 58 },
      { category: 'Drills & Mass Scenarios', count: 45 },
      { category: 'First Aid & CPR Clinics', count: 35 },
      { category: 'Emergency Radio Nets', count: 18 }
    ]
  },

  // Training & Certification Compliance
  training: {
    verificationStatus: [
      { status: 'Verified & Cleared', count: 65, color: 'var(--color-success)' },
      { status: 'Pending Command Review', count: 14, color: 'var(--color-warning)' },
      { status: 'Documentation Rejected', count: 3, color: 'var(--color-critical)' }
    ],
    trustTiers: [
      { tier: 'Tier 3 — Verified Tactical', count: 38, color: 'var(--color-orange-500)' },
      { tier: 'Tier 2 — Operational Field', count: 52, color: 'var(--color-info)' },
      { tier: 'Tier 1 — Registered Community', count: 38, color: 'var(--text-muted)' }
    ],
    completionRate: 84.6
  },

  // Notification Operations
  notifications: {
    byCategory: [
      { category: 'Tactical Dispatches', count: 68, color: 'var(--color-orange-500)' },
      { category: 'Emergency Declarations', count: 45, color: 'var(--color-critical)' },
      { category: 'Community Notices', count: 32, color: 'var(--color-info)' },
      { category: 'Credential Clearances', count: 19, color: 'var(--color-success)' },
      { category: 'System Telemetry', count: 14, color: 'var(--text-muted)' }
    ],
    readRatio: { read: 82, unread: 18 },
    byPriority: [
      { priority: 'Critical', count: 24, color: 'var(--color-critical)' },
      { priority: 'High', count: 45, color: 'var(--color-warning)' },
      { priority: 'Normal', count: 85, color: 'var(--color-info)' },
      { priority: 'Info', count: 24, color: 'var(--text-muted)' }
    ]
  },

  // Geographic Ward & Sector Operational Telemetry
  geographic: {
    wards: [
      {
        id: 'ward-7',
        name: 'Ward 7 — Riverside Basin & Lowlands',
        activeEmergencies: 2,
        assignedVolunteers: 38,
        coveragePercent: 95,
        status: 'critical',
        coordinates: [34.0582, -118.2483]
      },
      {
        id: 'ward-3',
        name: 'Ward 3 — Central Downtown & Commercial',
        activeEmergencies: 1,
        assignedVolunteers: 32,
        coveragePercent: 90,
        status: 'high',
        coordinates: [34.0489, -118.2518]
      },
      {
        id: 'ward-9',
        name: 'Ward 9 — East Foothills & Wilderness',
        activeEmergencies: 1,
        assignedVolunteers: 24,
        coveragePercent: 85,
        status: 'warning',
        coordinates: [34.0722, -118.2255]
      },
      {
        id: 'ward-4',
        name: 'Ward 4 — Harbor & Industrial Terminal',
        activeEmergencies: 1,
        assignedVolunteers: 20,
        coveragePercent: 80,
        status: 'warning',
        coordinates: [34.0315, -118.2685]
      },
      {
        id: 'ward-2',
        name: 'Ward 2 — North Residential Heights',
        activeEmergencies: 0,
        assignedVolunteers: 14,
        coveragePercent: 98,
        status: 'normal',
        coordinates: [34.0815, -118.2612]
      }
    ]
  }
};

export default RAW_DEV_ANALYTICS;
