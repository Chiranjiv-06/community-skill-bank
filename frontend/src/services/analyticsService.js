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
 * Architecture:
 * Analytics UI -> Analytics Service -> Development Analytics Adapter -> Development Analytics Data
 * 
 * Future Stage 17 Integration:
 * Analytics UI -> Analytics Service -> API Client -> GET /api/analytics -> FastAPI -> PostgreSQL
 * 
 * DO NOT connect to real backend or invent ad-hoc formulas in React components.
 */

import { RAW_DEV_ANALYTICS, TIME_PERIODS } from '../data/devAnalytics.js';

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
   * @param {Object} filters
   * @returns {Promise<Object>}
   */
  async getExecutiveKpis(filters = {}) {
    const data = getStoredAnalytics();
    let kpis = { ...data.kpis };

    // Apply severity filter scaling if specified
    if (filters.severity && filters.severity !== 'ALL') {
      const sev = filters.severity.toLowerCase();
      const match = data.emergencies.bySeverity.find((s) => s.name.toLowerCase() === sev);
      kpis.totalEmergencies = match ? match.count : 0;
      kpis.activeEmergencies = match ? Math.min(match.count, 2) : 0;
    }

    return JSON.parse(JSON.stringify(kpis));
  },

  /**
   * Retrieve emergency statistics (severity, status, disaster type, time trend)
   * @param {Object} filters
   * @returns {Promise<Object>}
   */
  async getEmergencyAnalytics(filters = {}) {
    const data = getStoredAnalytics();
    const period = filters.timePeriod || TIME_PERIODS.DAYS_7;
    let emergencies = { ...data.emergencies };

    // Apply disaster type filter
    if (filters.disasterType && filters.disasterType !== 'ALL') {
      const dt = filters.disasterType.toLowerCase();
      emergencies.byDisasterType = emergencies.byDisasterType.filter(
        (d) => d.type.toLowerCase() === dt
      );
    }

    // Apply severity filter
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
   * @param {Object} filters
   * @returns {Promise<Object>}
   */
  async getVolunteerAnalytics(filters = {}) {
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
   * @returns {Promise<Object>}
   */
  async getSkillAnalytics() {
    const data = getStoredAnalytics();
    return {
      byCategory: data.skills.byCategory,
      byProficiency: data.skills.byProficiency,
      highDemandSkills: data.skills.highDemandSkills
    };
  },

  /**
   * Retrieve response performance analytics
   * @param {Object} filters
   * @returns {Promise<Object>}
   */
  async getResponseAnalytics(filters = {}) {
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
   * @returns {Promise<Object>}
   */
  async getCommunityAnalytics() {
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
   * @returns {Promise<Object>}
   */
  async getTrainingAnalytics() {
    const data = getStoredAnalytics();
    return {
      verificationStatus: data.training.verificationStatus,
      trustTiers: data.training.trustTiers,
      completionRate: data.training.completionRate
    };
  },

  /**
   * Retrieve notification operations analytics
   * @returns {Promise<Object>}
   */
  async getNotificationAnalytics() {
    const data = getStoredAnalytics();
    return {
      byCategory: data.notifications.byCategory,
      readRatio: data.notifications.readRatio,
      byPriority: data.notifications.byPriority
    };
  },

  /**
   * Retrieve geographic ward operational telemetry
   * @returns {Promise<Object>}
   */
  async getGeographicAnalytics() {
    const data = getStoredAnalytics();
    return {
      wards: data.geographic.wards
    };
  },

  /**
   * Retrieve complete aggregate dashboard dataset
   * @param {Object} filters - { timePeriod, severity, disasterType }
   * @returns {Promise<Object>}
   */
  async getFullDashboardData(filters = {}) {
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
