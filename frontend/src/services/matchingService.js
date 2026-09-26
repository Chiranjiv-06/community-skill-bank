/**
 * Volunteer Matching & Recommendations Service (Stage 6)
 * 
 * Provides candidate matches and intelligent recommendations for disaster emergencies
 * using isolated frontend development state.
 * 
 * In Stage 17: Will call api.get('/emergencies/:id/matches') and
 * api.get('/emergencies/:id/recommendations').
 * 
 * DO NOT calculate Match Scores or Recommendation Scores in JavaScript.
 * Matching and recommendation calculations belong exclusively to the backend.
 */

import { DEV_NEARBY_VOLUNTEERS } from '../data/devMatching.js';

export const matchingService = {
  /**
   * Get volunteer matching results for an emergency
   * @param {string} emergencyId
   * @param {Object} filters - { skill, eligibility }
   * @returns {Promise<Array>}
   */
  async getEmergencyMatches(emergencyId, filters = {}) {
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
      matchScore: vol.matchScore, // Pre-calculated backend mock value
      eligibility: vol.eligibility,
      isAvailable: vol.isAvailable,
      phone: vol.phone,
      transportation: vol.transportation
    }));

    if (filters.skill && filters.skill !== 'ALL') {
      matches = matches.filter((m) => m.skill === filters.skill || m.category === filters.skill);
    }

    if (filters.eligibility && filters.eligibility !== 'ALL') {
      matches = matches.filter((m) => m.eligibility.toLowerCase().includes(filters.eligibility.toLowerCase()));
    }

    return JSON.parse(JSON.stringify(matches));
  },

  /**
   * Get intelligent recommendations for an emergency (Admin only)
   * @param {string} emergencyId
   * @returns {Promise<Array>}
   */
  async getEmergencyRecommendations(emergencyId) {
    const rawList = DEV_NEARBY_VOLUNTEERS[emergencyId] || DEV_NEARBY_VOLUNTEERS['emg-501'] || [];

    // Filter to top recommended candidates
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
        matchScore: vol.matchScore, // Pre-calculated backend mock value
        recommendationScore: vol.recommendationScore, // Pre-calculated backend mock value
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
   * @param {string} emergencyId
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
