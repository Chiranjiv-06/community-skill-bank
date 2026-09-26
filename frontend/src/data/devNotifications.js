/**
 * Isolated Development Data for Stage 10 — Notifications + WebSocket-Ready Architecture
 * 
 * Provides realistic development notification fixtures for testing
 * emergency alerts, assignment dispatches, volunteer responses,
 * community activities, and certification verifications.
 */

export const NOTIFICATION_TYPES = [
  'emergency',
  'assignment',
  'community',
  'certification',
  'system'
];

export const NOTIFICATION_PRIORITIES = ['critical', 'high', 'normal', 'info'];

export const INITIAL_DEV_NOTIFICATIONS = [
  {
    id: 'ntf-101',
    type: 'emergency',
    priority: 'critical',
    title: 'Critical Emergency Declared: Urban Flash Flooding',
    message: 'High priority flood evacuation declared in Riverside Basin (Sector 4). Swift Water Rescue & Trauma teams on standby.',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    read: false,
    targetRole: 'all',
    volunteerId: null,
    entityType: 'emergency',
    entityId: 'emg-501',
    link: '/volunteer/emergencies/emg-501'
  },
  {
    id: 'ntf-102',
    type: 'assignment',
    priority: 'high',
    title: 'New Tactical Assignment Dispatched',
    message: 'You have been assigned to Swift Water Rescue deployment for Urban Flash Flooding at Sector 4 North Bridge.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    read: false,
    targetRole: 'volunteer',
    volunteerId: 'dev-skl-002',
    entityType: 'assignment',
    entityId: 'asg-701',
    link: '/volunteer/assignments'
  },
  {
    id: 'ntf-103',
    type: 'assignment',
    priority: 'normal',
    title: 'Volunteer Response Confirmed: Alex Rivera',
    message: 'Responder Alex Rivera accepted assignment asg-701. Mobilizing Zodiac rescue craft with 12m ETA.',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    read: true,
    targetRole: 'admin',
    volunteerId: 'dev-skl-002',
    entityType: 'assignment',
    entityId: 'asg-701',
    link: '/admin/response-monitoring'
  },
  {
    id: 'ntf-104',
    type: 'certification',
    priority: 'normal',
    title: 'Credential Verified: Swift Water Rescue Technician',
    message: 'Your Rescue 3 International certification (NFPA 1670) has been verified by Cmdr. Sarah Vance.',
    timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    read: false,
    targetRole: 'volunteer',
    volunteerId: 'dev-skl-002',
    entityType: 'certification',
    entityId: 'cert-802',
    link: '/volunteer/certifications'
  },
  {
    id: 'ntf-105',
    type: 'certification',
    priority: 'normal',
    title: 'Pending Credential Submitted: FAA Part 107',
    message: 'Responder Alex Rivera submitted FAA Part 107 Remote Pilot credential awaiting administrative clearance.',
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    read: false,
    targetRole: 'admin',
    volunteerId: 'dev-skl-002',
    entityType: 'certification',
    entityId: 'cert-804',
    link: '/admin/verification-queue'
  },
  {
    id: 'ntf-106',
    type: 'community',
    priority: 'normal',
    title: 'Community Activity Scheduled: Sandbagging & Flood Barrier',
    message: 'New flood defense mobilization scheduled for Oct 2 at District 2 Riverwalk Depot. Volunteers needed.',
    timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    read: true,
    targetRole: 'all',
    volunteerId: null,
    entityType: 'activity',
    entityId: 'act-901',
    link: '/volunteer/activities'
  },
  {
    id: 'ntf-107',
    type: 'community',
    priority: 'normal',
    title: 'Volunteer RSVP Confirmed: Maria Gonzalez',
    message: 'Maria Gonzalez joined "Community Sandbagging & Flood Barrier Assembly". 28/40 spots filled.',
    timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    read: true,
    targetRole: 'admin',
    volunteerId: 'dev-cit-003',
    entityType: 'activity',
    entityId: 'act-901',
    link: '/admin/activities'
  },
  {
    id: 'ntf-108',
    type: 'system',
    priority: 'info',
    title: 'Real-Time Event Adapter Ready (Simulated)',
    message: 'WebSocket-ready event architecture initialized with Development Event Source adapter.',
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    read: true,
    targetRole: 'all',
    volunteerId: null,
    entityType: 'system',
    entityId: null,
    link: null
  }
];
