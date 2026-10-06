/**
 * Analytics Service (Stage 13 — Analytics Dashboard)
 * 
 * Provides aggregate disaster-response telemetry across all 8 operational domains:
 * - Executive KPIs
 * - Emergency Incident Metrics (Severity, Status, Hazard Type, Time Trends)
 * - Volunteer Demographics & Surge Mobilization
 * - Skill Distributions & High-Demand Capabilities
 * - Tactical Response Times & Completion Performance
 * - Community Activity Attendance & RSVPs
 * - Training & Credential Trust Compliance
 * - Notification Volumes & Alert Severities
 * - Geographic Ward & Sector Operational Coverage
 * 
 * Backend API Integration:
 * - GET /api/analytics/dashboard (master overview)
 * - GET /api/analytics/emergencies
 * - GET /api/analytics/volunteers
 * - GET /api/analytics/skills
 * - GET /api/analytics/response
 * - GET /api/analytics/community
 * - GET /api/analytics/training
 * - GET /api/analytics/notifications
 * - GET /api/analytics/geographic
 * - GET /api/admin/stats
 */

import { RAW_DEV_ANALYTICS, TIME_PERIODS } from '../data/devAnalytics.js';
import api from './api.js';

const STORAGE_KEY = 'csb_dev_analytics';

/**
 * Safely retrieve analytics dataset with seed fallback
 */
const getStoredAnalytics = () => {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(RAW_DEV_ANALYTICS));
      }
      return JSON.parse(JSON.stringify(RAW_DEV_ANALYTICS));
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[analyticsService] Error reading cached analytics, using seed fallback:', err);
    return JSON.parse(JSON.stringify(RAW_DEV_ANALYTICS));
  }
};

/**
 * Normalize backend master dashboard payload to match UI chart models
 */
const normalizeBackendDashboard = (backendData, rawFallback, filters = {}) => {
  const b = backendData || {};
  const fallback = rawFallback || RAW_DEV_ANALYTICS;

  // 1. Executive KPIs
  const totalEmergencies = b.emergencies?.total_emergencies ?? fallback.kpis.totalEmergencies;
  const activeEmergencies = (b.emergencies?.by_status?.open || 0) + (b.emergencies?.by_status?.in_progress || 0);
  const registeredVolunteers = b.volunteers?.total_users ?? fallback.kpis.registeredVolunteers;
  const availableVolunteers = b.volunteers?.volunteers_with_coordinates || b.volunteers?.active_users || fallback.kpis.availableVolunteers;
  const completedAssignments = b.response?.by_status?.completed ?? fallback.kpis.completedAssignments;
  const responseRate = b.response?.acceptance_rate ? Math.round(b.response.acceptance_rate * 1000) / 10 : fallback.kpis.responseRate;
  const communityParticipation = b.community?.total_participations 
    ? Math.round(((b.community.total_attended_or_completed || 1) / b.community.total_participations) * 1000) / 10 
    : fallback.kpis.communityParticipation;
  const verifiedSkills = b.skills?.total_skills ?? fallback.kpis.verifiedSkills;

  let kpis = {
    totalEmergencies,
    activeEmergencies,
    registeredVolunteers,
    availableVolunteers,
    completedAssignments,
    responseRate,
    communityParticipation,
    verifiedSkills
  };

  if (filters.severity && filters.severity !== 'ALL') {
    const sev = filters.severity.toLowerCase();
    const count = b.emergencies?.by_severity?.[sev] || 0;
    kpis.totalEmergencies = count;
    kpis.activeEmergencies = Math.min(count, 2);
  }

  // 2. Emergency Metrics
  const bySeverity = [
    { name: 'Critical', count: b.emergencies?.by_severity?.critical ?? 0, color: '#ef4444' },
    { name: 'High', count: b.emergencies?.by_severity?.high ?? 0, color: '#f97316' },
    { name: 'Medium', count: b.emergencies?.by_severity?.medium ?? 0, color: '#eab308' },
    { name: 'Low', count: b.emergencies?.by_severity?.low ?? 0, color: '#10b981' }
  ];

  const byStatus = [
    { name: 'Open', count: b.emergencies?.by_status?.open ?? 0, color: '#3b82f6' },
    { name: 'In Progress', count: b.emergencies?.by_status?.in_progress ?? 0, color: '#f59e0b' },
    { name: 'Resolved', count: b.emergencies?.by_status?.resolved ?? 0, color: '#10b981' },
    { name: 'Cancelled', count: b.emergencies?.by_status?.cancelled ?? 0, color: '#64748b' }
  ];

  let byDisasterType = [];
  if (b.emergencies?.by_category && Object.keys(b.emergencies.by_category).length > 0) {
    const icons = { flood: '🌊', fire: '🔥', medical: '🏥', earthquake: '🏚️', storm: '🌪️', shelter: '⛺', hazardous: '☣️' };
    byDisasterType = Object.entries(b.emergencies.by_category).map(([cat, cnt]) => ({
      type: cat.charAt(0).toUpperCase() + cat.slice(1),
      count: cnt,
      icon: icons[cat.toLowerCase()] || '⚠️'
    }));
  } else {
    byDisasterType = fallback.emergencies.byDisasterType;
  }

  const period = filters.timePeriod || TIME_PERIODS.DAYS_7;
  const trend = fallback.emergencies.trends[period] || fallback.emergencies.trends['7d'];

  // 3. Volunteer Metrics
  let byRole = fallback.volunteers.byRole;
  if (b.volunteers?.by_role) {
    const roleColors = { admin: '#ef4444', skilled_volunteer: '#3b82f6', citizen_volunteer: '#10b981', volunteer: '#8b5cf6' };
    const roleLabels = { admin: 'System Administrators', skilled_volunteer: 'Specialized Responders', citizen_volunteer: 'Citizen Volunteers', volunteer: 'General Volunteers' };
    byRole = Object.entries(b.volunteers.by_role).map(([r, cnt]) => ({
      name: roleLabels[r] || r,
      count: cnt,
      color: roleColors[r] || '#64748b'
    }));
  }

  const byAvailability = fallback.volunteers.byAvailability;
  const verificationStatus = fallback.volunteers.verificationStatus;
  const onboardingTrend = fallback.volunteers.onboardingTrend[period] || fallback.volunteers.onboardingTrend['7d'];

  // 4. Skill Metrics
  let byCategory = fallback.skills.byCategory;
  if (b.skills?.by_category && Object.keys(b.skills.by_category).length > 0) {
    byCategory = Object.entries(b.skills.by_category).map(([c, cnt]) => ({
      category: c,
      count: cnt
    }));
  }

  let byProficiency = fallback.skills.byProficiency;
  if (b.skills?.by_proficiency && Object.keys(b.skills.by_proficiency).length > 0) {
    const profColors = { beginner: '#94a3b8', intermediate: '#38bdf8', advanced: '#3b82f6', expert: '#8b5cf6' };
    byProficiency = Object.entries(b.skills.by_proficiency).map(([p, cnt]) => ({
      name: p.charAt(0).toUpperCase() + p.slice(1),
      count: cnt,
      color: profColors[p.toLowerCase()] || '#64748b'
    }));
  }

  const highDemandSkills = fallback.skills.highDemandSkills;

  // 5. Response Performance
  let assignmentBreakdown = fallback.response.assignmentBreakdown;
  if (b.response?.by_status) {
    const statColors = { completed: '#10b981', in_progress: '#3b82f6', pending: '#f59e0b', assigned: '#8b5cf6', rejected: '#ef4444', cancelled: '#64748b' };
    assignmentBreakdown = Object.entries(b.response.by_status).map(([s, cnt]) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' '),
      count: cnt,
      color: statColors[s.toLowerCase()] || '#64748b'
    }));
  }

  const completionRate = b.response?.completion_rate ? Math.round(b.response.completion_rate * 1000) / 10 : fallback.response.completionRate;
  const avgResponseMinutes = fallback.response.avgResponseMinutes;
  const responseTrend = fallback.response.responseTrends[period] || fallback.response.responseTrends['7d'];

  // 6. Community Analytics
  let communityByStatus = fallback.community.byStatus;
  if (b.community?.by_status && Object.keys(b.community.by_status).length > 0) {
    const commColors = { completed: '#10b981', in_progress: '#3b82f6', scheduled: '#f59e0b', cancelled: '#64748b' };
    communityByStatus = Object.entries(b.community.by_status).map(([s, cnt]) => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      count: cnt,
      color: commColors[s.toLowerCase()] || '#64748b'
    }));
  }

  const totalRsvps = b.community?.total_participations ?? fallback.community.totalRsvps;
  const attendanceRate = b.community?.total_participations 
    ? Math.round(((b.community.total_attended_or_completed || 0) / b.community.total_participations) * 1000) / 10 
    : fallback.community.attendanceRate;

  // 7. Training Analytics
  const trainingVerification = fallback.training.verificationStatus;
  const trustTiers = fallback.training.trustTiers;
  const trainingCompletionRate = fallback.training.completionRate;

  // 8. Notification Analytics
  let notifByCategory = fallback.notifications.byCategory;
  if (b.notifications?.by_type && Object.keys(b.notifications.by_type).length > 0) {
    notifByCategory = Object.entries(b.notifications.by_type).map(([t, cnt]) => ({
      category: t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' '),
      count: cnt
    }));
  }
  const readRatio = b.notifications?.read_rate ? Math.round(b.notifications.read_rate * 1000) / 10 : fallback.notifications.readRatio;
  const notifByPriority = fallback.notifications.byPriority;

  // 9. Geographic Telemetry
  let wards = fallback.geographic.wards;
  if (b.geographic?.emergencies_by_location && Object.keys(b.geographic.emergencies_by_location).length > 0) {
    wards = Object.entries(b.geographic.emergencies_by_location).map(([loc, cnt], idx) => ({
      id: 'ward-' + (idx + 1),
      name: loc,
      activeIncidents: cnt,
      activeEmergencies: cnt,
      status: cnt > 4 ? 'critical' : cnt > 1 ? 'warning' : 'normal',
      assignedVolunteers: b.geographic?.volunteers_by_location?.[loc] || 8,
      volunteerDensity: b.geographic?.volunteers_by_location?.[loc] || 8,
      coveragePercent: 90,
      coverageRate: 90
    }));
  }

  return {
    kpis,
    emergencies: {
      bySeverity,
      byStatus,
      byDisasterType,
      trend
    },
    volunteers: {
      byRole,
      byAvailability,
      verificationStatus,
      onboardingTrend
    },
    skills: {
      byCategory,
      byProficiency,
      highDemandSkills
    },
    response: {
      assignmentBreakdown,
      completionRate,
      avgResponseMinutes,
      trend: responseTrend
    },
    community: {
      byStatus: communityByStatus,
      totalRsvps,
      attendanceRate,
      byCategory: fallback.community.byCategory
    },
    training: {
      verificationStatus: trainingVerification,
      trustTiers,
      completionRate: trainingCompletionRate
    },
    notifications: {
      byCategory: notifByCategory,
      readRatio,
      byPriority: notifByPriority
    },
    geographic: {
      wards
    },
    lastUpdated: new Date().toISOString(),
    isLive: true,
    isDevelopment: false
  };
};

export const analyticsService = {
  /**
   * Get supported time period options
   */
  getTimePeriods() {
    return [
      { id: TIME_PERIODS.DAYS_7, label: 'Last 7 Days' },
      { id: TIME_PERIODS.DAYS_30, label: 'Last 30 Days' },
      { id: TIME_PERIODS.DAYS_90, label: 'Last 90 Days' }
    ];
  },

  /**
   * Retrieve executive summary KPIs
   */
  async getExecutiveKpis(filters = {}) {
    if (typeof api !== 'undefined' && api?.getToken?.()) {
      try {
        const full = await this.getFullDashboardData(filters);
        return full.kpis;
      } catch (err) {
        console.warn('[analyticsService] Backend KPI fetch failed, fallback to local:', err?.message || err);
      }
    }

    const data = getStoredAnalytics();
    let kpis = { ...data.kpis };

    if (filters.severity && filters.severity !== 'ALL') {
      const sev = filters.severity.toLowerCase();
      const match = data.emergencies.bySeverity.find((s) => s.name.toLowerCase() === sev);
      kpis.totalEmergencies = match ? match.count : 0;
      kpis.activeEmergencies = match ? Math.min(match.count, 2) : 0;
    }

    return JSON.parse(JSON.stringify(kpis));
  },

  /**
   * Retrieve emergency statistics
   */
  async getEmergencyAnalytics(filters = {}) {
    if (typeof api !== 'undefined' && api?.getToken?.()) {
      try {
        const full = await this.getFullDashboardData(filters);
        return full.emergencies;
      } catch (err) {
        console.warn('[analyticsService] Backend emergency analytics fetch failed:', err?.message || err);
      }
    }

    const data = getStoredAnalytics();
    const period = filters.timePeriod || TIME_PERIODS.DAYS_7;
    let emergencies = { ...data.emergencies };

    if (filters.disasterType && filters.disasterType !== 'ALL') {
      const dt = filters.disasterType.toLowerCase();
      emergencies.byDisasterType = emergencies.byDisasterType.filter(
        (d) => d.type.toLowerCase() === dt
      );
    }

    if (filters.severity && filters.severity !== 'ALL') {
      const sev = filters.severity.toLowerCase();
      emergencies.bySeverity = emergencies.bySeverity.filter(
        (s) => s.name.toLowerCase() === sev
      );
    }

    return {
      bySeverity: emergencies.bySeverity,
      byStatus: emergencies.byStatus,
      byDisasterType: emergencies.byDisasterType,
      trend: emergencies.trends[period] || emergencies.trends['7d']
    };
  },

  /**
   * Retrieve volunteer statistics
   */
  async getVolunteerAnalytics(filters = {}) {
    if (typeof api !== 'undefined' && api?.getToken?.()) {
      try {
        const full = await this.getFullDashboardData(filters);
        return full.volunteers;
      } catch (err) {
        console.warn('[analyticsService] Backend volunteer analytics fetch failed:', err?.message || err);
      }
    }

    const data = getStoredAnalytics();
    const period = filters.timePeriod || TIME_PERIODS.DAYS_7;

    return {
      byRole: data.volunteers.byRole,
      byAvailability: data.volunteers.byAvailability,
      verificationStatus: data.volunteers.verificationStatus,
      onboardingTrend: data.volunteers.onboardingTrend[period] || data.volunteers.onboardingTrend['7d']
    };
  },

  /**
   * Retrieve skill analytics
   */
  async getSkillAnalytics() {
    if (typeof api !== 'undefined' && api?.getToken?.()) {
      try {
        const full = await this.getFullDashboardData();
        return full.skills;
      } catch (err) {
        console.warn('[analyticsService] Backend skill analytics fetch failed:', err?.message || err);
      }
    }

    const data = getStoredAnalytics();
    return {
      byCategory: data.skills.byCategory,
      byProficiency: data.skills.byProficiency,
      highDemandSkills: data.skills.highDemandSkills
    };
  },

  /**
   * Retrieve response performance analytics
   */
  async getResponseAnalytics(filters = {}) {
    if (typeof api !== 'undefined' && api?.getToken?.()) {
      try {
        const full = await this.getFullDashboardData(filters);
        return full.response;
      } catch (err) {
        console.warn('[analyticsService] Backend response analytics fetch failed:', err?.message || err);
      }
    }

    const data = getStoredAnalytics();
    const period = filters.timePeriod || TIME_PERIODS.DAYS_7;

    return {
      assignmentBreakdown: data.response.assignmentBreakdown,
      completionRate: data.response.completionRate,
      avgResponseMinutes: data.response.avgResponseMinutes,
      trend: data.response.responseTrends[period] || data.response.responseTrends['7d']
    };
  },

  /**
   * Retrieve community activity analytics
   */
  async getCommunityAnalytics() {
    if (typeof api !== 'undefined' && api?.getToken?.()) {
      try {
        const full = await this.getFullDashboardData();
        return full.community;
      } catch (err) {
        console.warn('[analyticsService] Backend community analytics fetch failed:', err?.message || err);
      }
    }

    const data = getStoredAnalytics();
    return {
      byStatus: data.community.byStatus,
      totalRsvps: data.community.totalRsvps,
      attendanceRate: data.community.attendanceRate,
      byCategory: data.community.byCategory
    };
  },

  /**
   * Retrieve training and compliance analytics
   */
  async getTrainingAnalytics() {
    if (typeof api !== 'undefined' && api?.getToken?.()) {
      try {
        const full = await this.getFullDashboardData();
        return full.training;
      } catch (err) {
        console.warn('[analyticsService] Backend training analytics fetch failed:', err?.message || err);
      }
    }

    const data = getStoredAnalytics();
    return {
      verificationStatus: data.training.verificationStatus,
      trustTiers: data.training.trustTiers,
      completionRate: data.training.completionRate
    };
  },

  /**
   * Retrieve notification operations analytics
   */
  async getNotificationAnalytics() {
    if (typeof api !== 'undefined' && api?.getToken?.()) {
      try {
        const full = await this.getFullDashboardData();
        return full.notifications;
      } catch (err) {
        console.warn('[analyticsService] Backend notification analytics fetch failed:', err?.message || err);
      }
    }

    const data = getStoredAnalytics();
    return {
      byCategory: data.notifications.byCategory,
      readRatio: data.notifications.readRatio,
      byPriority: data.notifications.byPriority
    };
  },

  /**
   * Retrieve geographic ward operational telemetry
   */
  async getGeographicAnalytics() {
    if (typeof api !== 'undefined' && api?.getToken?.()) {
      try {
        const full = await this.getFullDashboardData();
        return full.geographic;
      } catch (err) {
        console.warn('[analyticsService] Backend geographic analytics fetch failed:', err?.message || err);
      }
    }

    const data = getStoredAnalytics();
    return {
      wards: data.geographic.wards
    };
  },

  /**
   * Retrieve complete aggregate dashboard dataset
   */
  async getFullDashboardData(filters = {}) {
    if (typeof api !== 'undefined' && api?.getToken?.()) {
      try {
        const live = await api.get('/api/analytics/dashboard');
        if (live && typeof live === 'object') {
          const raw = getStoredAnalytics();
          return normalizeBackendDashboard(live, raw, filters);
        }
      } catch (err) {
        console.warn('[analyticsService] Live /api/analytics/dashboard failed, using fallback:', err?.message || err);
      }
    }

    const [
      kpis,
      emergencies,
      volunteers,
      skills,
      response,
      community,
      training,
      notifications,
      geographic
    ] = await Promise.all([
      this.getExecutiveKpis(filters),
      this.getEmergencyAnalytics(filters),
      this.getVolunteerAnalytics(filters),
      this.getSkillAnalytics(),
      this.getResponseAnalytics(filters),
      this.getCommunityAnalytics(),
      this.getTrainingAnalytics(),
      this.getNotificationAnalytics(),
      this.getGeographicAnalytics()
    ]);

    return {
      kpis,
      emergencies,
      volunteers,
      skills,
      response,
      community,
      training,
      notifications,
      geographic,
      lastUpdated: new Date().toISOString(),
      isDevelopment: true
    };
  },

  /**
   * Retrieve admin quick platform statistics
   */
  async getAdminStats() {
    if (typeof api !== 'undefined' && api?.getToken?.()) {
      try {
        return await api.get('/api/admin/stats');
      } catch (err) {
        console.warn('[analyticsService] /api/admin/stats failed:', err?.message || err);
      }
    }
    return null;
  },

  /**
   * Reset analytics store to seed data
   */
  resetDevelopmentAnalytics() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(RAW_DEV_ANALYTICS));
    }
    return JSON.parse(JSON.stringify(RAW_DEV_ANALYTICS));
  }
};

export default analyticsService;
