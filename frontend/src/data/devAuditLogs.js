/**
 * Isolated Development Data for Stage 15 — Audit Logs
 * 
 * Provides realistic security, compliance, and operational event history.
 * Supported exact event types:
 * - AUTH_LOGIN_SUCCESS
 * - AUTH_LOGIN_FAILURE
 * - USER_ROLE_CHANGE
 * - CERTIFICATION_VERIFY
 * - TRAINING_VERIFY
 * - EMERGENCY_STATUS_CHANGE
 * - ASSIGNMENT_STATUS_CHANGE
 * - ASSIGNMENT_CANCEL
 * - NOTIFICATION_BROADCAST
 * - SIMULATION_RUN
 * - SYNC_CONFLICT
 * 
 * STRICT COMPLIANCE:
 * Never contains passwords, JWTs, secrets, or sensitive credentials.
 */

export const AUDIT_EVENT_TYPES = {
  AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGIN_FAILURE: 'AUTH_LOGIN_FAILURE',
  USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
  CERTIFICATION_VERIFY: 'CERTIFICATION_VERIFY',
  TRAINING_VERIFY: 'TRAINING_VERIFY',
  EMERGENCY_STATUS_CHANGE: 'EMERGENCY_STATUS_CHANGE',
  ASSIGNMENT_STATUS_CHANGE: 'ASSIGNMENT_STATUS_CHANGE',
  ASSIGNMENT_CANCEL: 'ASSIGNMENT_CANCEL',
  NOTIFICATION_BROADCAST: 'NOTIFICATION_BROADCAST',
  SIMULATION_RUN: 'SIMULATION_RUN',
  SYNC_CONFLICT: 'SYNC_CONFLICT'
};

export const INITIAL_DEV_AUDIT_LOGS = [
  {
    id: 'aud-001',
    timestamp: '2026-09-25T15:20:10.000Z',
    actor: 'admin@skillbank.org',
    action: AUDIT_EVENT_TYPES.SIMULATION_RUN,
    entity: 'Simulation',
    entityId: 'sim-01',
    status: 'Success',
    requestId: 'req-sim-9901-a1b2',
    metadata: {
      scenarioName: 'Coastal Basin Category 4 Cyclone & Tidal Surge',
      demandMultiplier: 1.5,
      fulfillmentRate: 77.4,
      pressureTier: 'Severe'
    }
  },
  {
    id: 'aud-002',
    timestamp: '2026-09-25T14:45:22.000Z',
    actor: 'admin@skillbank.org',
    action: AUDIT_EVENT_TYPES.EMERGENCY_STATUS_CHANGE,
    entity: 'Emergency',
    entityId: 'emg-501',
    status: 'Success',
    requestId: 'req-emg-8821-c3d4',
    metadata: {
      title: 'Riverside Flash Flood & Levee Breach',
      previousStatus: 'open',
      newStatus: 'in_progress',
      severity: 'critical'
    }
  },
  {
    id: 'aud-003',
    timestamp: '2026-09-25T14:10:05.000Z',
    actor: 'admin@skillbank.org',
    action: AUDIT_EVENT_TYPES.CERTIFICATION_VERIFY,
    entity: 'Certification',
    entityId: 'cert-101',
    status: 'Success',
    requestId: 'req-cert-7734-e5f6',
    metadata: {
      volunteerEmail: 'marcus.vance@example.com',
      credentialName: 'FEMA Swift Water Rescue Technician IV',
      decision: 'Approved'
    }
  },
  {
    id: 'aud-004',
    timestamp: '2026-09-25T13:30:40.000Z',
    actor: 'system',
    action: AUDIT_EVENT_TYPES.NOTIFICATION_BROADCAST,
    entity: 'Notification',
    entityId: 'notif-201',
    status: 'Success',
    requestId: 'req-ntf-6612-g7h8',
    metadata: {
      channel: 'Emergency Broadcast Mesh',
      recipientCount: 128,
      priority: 'Critical',
      title: 'FLASH FLOOD EMERGENCY — EVACUATION ROUTE CLEARANCE'
    }
  },
  {
    id: 'aud-005',
    timestamp: '2026-09-25T12:55:18.000Z',
    actor: 'admin@skillbank.org',
    action: AUDIT_EVENT_TYPES.ASSIGNMENT_STATUS_CHANGE,
    entity: 'Assignment',
    entityId: 'asg-301',
    status: 'Success',
    requestId: 'req-asg-5503-i9j0',
    metadata: {
      volunteerName: 'Sarah Jenkins',
      previousStatus: 'assigned',
      newStatus: 'in_progress',
      emergencyId: 'emg-501'
    }
  },
  {
    id: 'aud-006',
    timestamp: '2026-09-25T12:15:33.000Z',
    actor: 'system',
    action: AUDIT_EVENT_TYPES.SYNC_CONFLICT,
    entity: 'Sync',
    entityId: 'mut-109',
    status: 'Success',
    requestId: 'req-syn-4491-k1l2',
    metadata: {
      entityType: 'emergency',
      entityId: 'emg-501',
      conflictType: 'CONCURRENT_UPDATE',
      resolvedVia: 'local'
    }
  },
  {
    id: 'aud-007',
    timestamp: '2026-09-25T11:40:50.000Z',
    actor: 'admin@skillbank.org',
    action: AUDIT_EVENT_TYPES.ASSIGNMENT_CANCEL,
    entity: 'Assignment',
    entityId: 'asg-304',
    status: 'Success',
    requestId: 'req-asg-3329-m3n4',
    metadata: {
      emergencyId: 'emg-502',
      reason: 'Perimeter reassessed by field commander; responder re-assigned to levee.'
    }
  },
  {
    id: 'aud-008',
    timestamp: '2026-09-25T10:20:15.000Z',
    actor: 'admin@skillbank.org',
    action: AUDIT_EVENT_TYPES.TRAINING_VERIFY,
    entity: 'Training',
    entityId: 'trn-402',
    status: 'Success',
    requestId: 'req-trn-2218-o5p6',
    metadata: {
      courseName: 'Mass Triage & START Protocol Certification',
      volunteerEmail: 'elena.rodriguez@example.com',
      verificationStatus: 'Verified'
    }
  },
  {
    id: 'aud-009',
    timestamp: '2026-09-25T09:12:00.000Z',
    actor: 'super_admin@skillbank.org',
    action: AUDIT_EVENT_TYPES.USER_ROLE_CHANGE,
    entity: 'User',
    entityId: 'usr-105',
    status: 'Success',
    requestId: 'req-usr-1102-q7r8',
    metadata: {
      targetEmail: 'elena.rodriguez@example.com',
      previousRole: 'volunteer',
      newRole: 'skilled_volunteer'
    }
  },
  {
    id: 'aud-010',
    timestamp: '2026-09-25T08:30:12.000Z',
    actor: 'admin@skillbank.org',
    action: AUDIT_EVENT_TYPES.AUTH_LOGIN_SUCCESS,
    entity: 'Auth',
    entityId: 'auth-session-889',
    status: 'Success',
    requestId: 'req-ath-0091-s9t0',
    metadata: {
      role: 'admin',
      clientIp: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  },
  {
    id: 'aud-011',
    timestamp: '2026-09-25T08:15:44.000Z',
    actor: 'unknown_operator@unauthorized.net',
    action: AUDIT_EVENT_TYPES.AUTH_LOGIN_FAILURE,
    entity: 'Auth',
    entityId: 'auth-attempt-012',
    status: 'Failure',
    requestId: 'req-ath-0082-u1v2',
    metadata: {
      attemptedEmail: 'unknown_operator@unauthorized.net',
      reason: 'Invalid credentials provided',
      clientIp: '198.51.100.24'
    }
  },
  {
    id: 'aud-012',
    timestamp: '2026-09-24T18:40:00.000Z',
    actor: 'admin@skillbank.org',
    action: AUDIT_EVENT_TYPES.EMERGENCY_STATUS_CHANGE,
    entity: 'Emergency',
    entityId: 'emg-503',
    status: 'Success',
    requestId: 'req-emg-9912-w3x4',
    metadata: {
      title: 'Downtown Electrical Substation Fire',
      previousStatus: 'in_progress',
      newStatus: 'resolved'
    }
  }
];

export default INITIAL_DEV_AUDIT_LOGS;
