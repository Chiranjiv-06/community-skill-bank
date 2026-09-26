/**
 * Emergency Intelligence Service (Stage 6)
 * 
 * Provides automated incident intelligence assessment, risk flags,
 * location validation, and decision reasoning using isolated development state.
 * 
 * In Stage 17: Will call api.get('/emergencies/:id/intelligence').
 * 
 * DO NOT calculate risk or intelligence scores in JavaScript.
 */

import { DEV_EMERGENCY_INTELLIGENCE } from '../data/devMatching.js';
import { emergencyService } from './emergencyService.js';

export const intelligenceService = {
  /**
   * Get intelligence analysis report for an emergency
   * @param {string} emergencyId
   * @returns {Promise<Object>}
   */
  async getEmergencyIntelligence(emergencyId) {
    if (DEV_EMERGENCY_INTELLIGENCE[emergencyId]) {
      return JSON.parse(JSON.stringify(DEV_EMERGENCY_INTELLIGENCE[emergencyId]));
    }

    // Dynamic fallback representation for other emergencies
    const emg = await emergencyService.getEmergencyById(emergencyId);
    if (!emg) {
      throw new Error(`Emergency with ID "${emergencyId}" was not found.`);
    }

    return {
      emergencyId: emg.id,
      title: emg.title,
      severity: emg.severity,
      urgency: emg.severity === 'critical' ? 'immediate' : emg.severity === 'high' ? 'high' : 'medium',
      staffingRequirement: `${emg.requiredVolunteers} Responders Target Quota`,
      requiredSkillsSummary: (emg.requirements || []).map((r) => `${r.skill} (Min: ${r.minProficiency})`),
      locationValidation: {
        status: 'Validated (Sector Verified)',
        sector: emg.location,
        jurisdiction: 'Municipal Emergency Management Sector',
        coordinates: emg.latitude && emg.longitude ? `${emg.latitude}° N, ${emg.longitude}° W` : 'Coordinates Recorded',
        accessCondition: 'Transit routes subject to local incident command check.'
      },
      riskFlags: [
        {
          id: 'rf-fallback-1',
          level: emg.severity,
          title: `Active ${emg.severity.toUpperCase()} Priority Incident`,
          description: emg.description
        }
      ],
      reasoning: `Incident analysis based on registered location in ${emg.location}. Recommended dispatch focuses on declared requirements with priority on certified local volunteers.`
    };
  }
};

export default intelligenceService;
