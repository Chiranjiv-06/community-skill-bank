/**
 * Volunteer Matching & Recommendations Service (Stage 6 & Stage 17 Integration)
 * 
 * Provides candidate matches and intelligent recommendations for disaster emergencies
 * using backend two-stage rule-based scoring (Module 6 & 14) with local fallback.
 * 
 * DO NOT calculate Match Scores or Recommendation Scores in JavaScript.
 * Matching and recommendation calculations belong exclusively to the backend.
 */

import { api } from './api.js';
import { parseEmergencyId } from './emergencyService.js';
import { DEV_NEARBY_VOLUNTEERS } from '../data/devMatching.js';

export const matchingService = {
  /**
   * Get volunteer matching results for an emergency from backend rule-based engine
   * @param {string|number} emergencyId
   * @param {Object} filters - { skill, eligibility }
   * @returns {Promise<Array>}
   */
  async getEmergencyMatches(emergencyId, filters = {}) {
    const numericId = parseEmergencyId(emergencyId);
    if (numericId !== null) {
      try {
        const data = await api.get(`/api/emergencies/${numericId}/match-volunteers`);
        if (data && Array.isArray(data.matches)) {
          let matches = data.matches.map((m) => {
            const primaryReq = m.matched_requirements?.[0] || {};
            return {
              id: `match-${m.volunteer_id}`,
              volunteerId: String(m.volunteer_id),
              volunteerName: m.full_name,
              skill: primaryReq.skill_title || primaryReq.skill_category || 'Disaster First Responder',
              category: primaryReq.skill_category || 'General',
              proficiency: primaryReq.proficiency || 'Intermediate',
              experience: `${m.score_breakdown?.experience_score || 0} pts`,
              distance: `${m.distance_km} km`,
              distance_km: m.distance_km,
              matchScore: `${Math.round(m.match_score)}%`,
              rawScore: m.match_score,
              eligibility: 'Eligible - Rapid Surge',
              isAvailable: true,
              phone: m.phone || 'Recorded',
              email: m.email,
              transportation: 'Field Ready',
              scoreBreakdown: m.score_breakdown,
              matchedRequirements: m.matched_requirements
            };
          });

          if (filters.skill && filters.skill !== 'ALL') {
            matches = matches.filter((m) => m.skill === filters.skill || m.category === filters.skill);
          }
          if (filters.eligibility && filters.eligibility !== 'ALL') {
            matches = matches.filter((m) => m.eligibility?.toLowerCase().includes(filters.eligibility.toLowerCase()));
          }

          return matches;
        }
      } catch (err) {
        console.warn(`[matchingService] GET /api/emergencies/${numericId}/match-volunteers failed:`, err.message);
      }
    }

    // Development / offline fallback
    const rawList = DEV_NEARBY_VOLUNTEERS[emergencyId] || DEV_NEARBY_VOLUNTEERS['emg-501'] || [];
    let matches = rawList.map((vol) => ({
      id: `match-${vol.id}`,
      volunteerId: vol.id,
      volunteerName: vol.name,
      skill: vol.skill,
      category: vol.category,
      proficiency: vol.proficiency,
      experience: vol.experience,
      distance: vol.distance,
      matchScore: vol.matchScore,
      eligibility: vol.eligibility,
      isAvailable: vol.isAvailable,
      phone: vol.phone,
      transportation: vol.transportation
    }));

    if (filters.skill && filters.skill !== 'ALL') {
      matches = matches.filter((m) => m.skill === filters.skill || m.category === filters.skill);
    }
    if (filters.eligibility && filters.eligibility !== 'ALL') {
      matches = matches.filter((m) => m.eligibility?.toLowerCase().includes(filters.eligibility.toLowerCase()));
    }

    return JSON.parse(JSON.stringify(matches));
  },

  /**
   * Get intelligent recommendations for an emergency (Admin only)
   * @param {string|number} emergencyId
   * @returns {Promise<Array>}
   */
  async getEmergencyRecommendations(emergencyId) {
    const numericId = parseEmergencyId(emergencyId);
    if (numericId !== null) {
      try {
        const data = await api.get(`/api/emergencies/${numericId}/recommendations`);
        if (data && Array.isArray(data.recommendations)) {
          return data.recommendations.map((r, index) => {
            const primary = r.primary_requirement || {};
            const skillName = primary.skill_title || primary.skill_category || 'Disaster Specialist';
            const prof = primary.min_proficiency || 'Intermediate';
            const reasons = Array.isArray(r.recommendation_reasons) && r.recommendation_reasons.length > 0
              ? r.recommendation_reasons.join(' ')
              : 'High priority capability match for incident requirements.';

            return {
              id: `rec-${r.volunteer_id}`,
              volunteerId: String(r.volunteer_id),
              volunteerName: r.full_name,
              skill: skillName,
              category: primary.skill_category || 'General',
              proficiency: prof,
              experience: `${r.verified_service_hours || 0} service hrs`,
              distance: `${r.distance_km} km`,
              distance_km: r.distance_km,
              matchScore: `${Math.round(r.matching_score)}%`,
              recommendationScore: `${Math.round(r.recommendation_score)}%`,
              certificationCount: r.verified_certifications_count || 0,
              requirement: `${skillName} (${prof})`,
              priority: primary.urgency === 'critical' ? 'Urgent' : 'High',
              trustScore: `${Math.min(100, Math.round((r.verified_service_hours || 10) * 2))}%`,
              phone: r.phone || 'Recorded',
              transportation: 'Field Ready',
              reasoning: reasons,
              rank: index + 1
            };
          });
        }
      } catch (err) {
        console.warn(`[matchingService] GET /api/emergencies/${numericId}/recommendations failed:`, err.message);
      }
    }

    // Development / offline fallback
    const rawList = DEV_NEARBY_VOLUNTEERS[emergencyId] || DEV_NEARBY_VOLUNTEERS['emg-501'] || [];
    const recommendations = rawList
      .filter((vol) => vol.isAvailable && !vol.eligibility.includes('Below'))
      .map((vol, index) => ({
        id: `rec-${vol.id}`,
        volunteerId: vol.id,
        volunteerName: vol.name,
        skill: vol.skill,
        category: vol.category,
        proficiency: vol.proficiency,
        experience: vol.experience,
        distance: vol.distance,
        matchScore: vol.matchScore,
        recommendationScore: vol.recommendationScore,
        certificationCount: vol.certificationCount,
        requirement: `${vol.skill} (${vol.proficiency})`,
        priority: vol.priority,
        trustScore: vol.trustScore,
        phone: vol.phone,
        transportation: vol.transportation,
        reasoning: vol.reasoning,
        rank: index + 1
      }));

    return JSON.parse(JSON.stringify(recommendations));
  },

  /**
   * Get inspection details for a single recommendation
   * @param {string|number} emergencyId
   * @param {string} recommendationId
   * @returns {Promise<Object|null>}
   */
  async getRecommendationDetails(emergencyId, recommendationId) {
    const all = await this.getEmergencyRecommendations(emergencyId);
    const found = all.find((r) => r.id === recommendationId || r.volunteerId === recommendationId);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }
};

export default matchingService;
