/**
 * Trust & Skill Passport Service (Stage 8)
 * 
 * Provides isolated frontend state management for volunteer trust metrics,
 * verification indicators, and digital skill passports.
 * 
 * CRITICAL REQUIREMENT:
 * - Trust scores and tiers are BACKEND / DEVELOPMENT-PROVIDED DATA.
 * - NO mathematical trust scoring algorithms are calculated in React or JavaScript.
 * 
 * In Stage 17, this maps to:
 * - GET /api/v1/trust/profile/:volunteerId
 * - GET /api/v1/trust/profiles
 * - GET /api/v1/trust/summary
 */

import { INITIAL_DEV_TRUST_PROFILES } from '../data/devTrust.js';

const STORAGE_KEY = 'csb_dev_trust_profiles';

const getStoredProfiles = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_TRUST_PROFILES));
      return JSON.parse(JSON.stringify(INITIAL_DEV_TRUST_PROFILES));
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[trustService] Error parsing localStorage trust profiles, resetting:', err);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_TRUST_PROFILES));
    return JSON.parse(JSON.stringify(INITIAL_DEV_TRUST_PROFILES));
  }
};

const setStoredProfiles = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('[trustService] Error persisting trust profiles:', err);
  }
};

export const trustService = {
  /**
   * Retrieve trust profile for a volunteer
   * Returns pre-computed development/backend trust score and indicators
   */
  async getTrustProfile(volunteerIdOrEmail) {
    const profiles = getStoredProfiles();
    const target = (volunteerIdOrEmail === 'alex.rivera@skillbank.org' || volunteerIdOrEmail === 'dev-skl-002')
      ? 'dev-skl-002'
      : volunteerIdOrEmail;

    let found = profiles.find(
      (p) => p.volunteerId === target || p.volunteerEmail === target
    );

    if (!found) {
      // Default baseline profile for newly registered volunteers
      found = {
        volunteerId: target,
        volunteerName: 'Registered Community Volunteer',
        volunteerEmail: typeof target === 'string' && target.includes('@') ? target : 'volunteer@skillbank.org',
        passportId: `CSB-PASS-${Date.now().toString().slice(-5)}`,
        trustTier: 'Tier 1 — Registered Volunteer Responder',
        trustScore: 70, // Development fixture. NOT calculated in React.
        verificationStatus: 'Partially Verified',
        identityVerified: true,
        backgroundCheckStatus: 'Pending Verification',
        backgroundCheckDate: null,
        lastAuditDate: new Date().toISOString(),
        verifiedCertificationsCount: 0,
        pendingCertificationsCount: 0,
        completedTrainingsCount: 0,
        inProgressTrainingsCount: 0,
        completedDeploymentsCount: 0,
        fieldHoursRecorded: 0,
        trustIndicators: [
          {
            id: 'ind-gen-1',
            title: 'Account Authentication',
            category: 'Identity',
            status: 'verified',
            description: 'Registered and verified email credentials.'
          }
        ],
        badges: [
          {
            id: 'bdg-gen-1',
            name: 'New Responder',
            category: 'Community',
            tier: 'Member',
            icon: 'UserCheck',
            awardedDate: new Date().toISOString().split('T')[0],
            description: 'Enrolled in Community Skill Bank disaster network.'
          }
        ]
      };
    }

    return JSON.parse(JSON.stringify(found));
  },

  /**
   * Retrieve all volunteer trust profiles for administrative inspection
   */
  async getAllTrustProfiles() {
    const profiles = getStoredProfiles();
    return JSON.parse(JSON.stringify(profiles));
  },

  /**
   * Summary metrics for Admin Verification & Trust Center
   */
  async getVerificationSummary() {
    const profiles = getStoredProfiles();
    const fullyVerified = profiles.filter((p) => p.verificationStatus === 'Fully Verified').length;
    const partiallyVerified = profiles.filter((p) => p.verificationStatus === 'Partially Verified').length;

    return {
      totalVolunteersAudited: profiles.length,
      fullyVerified,
      partiallyVerified,
      averageTrustScore: 82, // Backend fixture
      complianceRate: '94.6%'
    };
  },

  /**
   * Reset store to initial seed values
   */
  resetDevelopmentTrust() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_TRUST_PROFILES));
    return JSON.parse(JSON.stringify(INITIAL_DEV_TRUST_PROFILES));
  }
};

export default trustService;
