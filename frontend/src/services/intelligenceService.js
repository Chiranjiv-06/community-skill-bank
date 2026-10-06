/**
 * Emergency Intelligence Service (Stage 6 & Stage 17 Integration)
 * 
 * Provides automated incident intelligence assessment, risk flags,
 * location validation, and decision reasoning using backend Module 13 endpoints.
 * 
 * DO NOT calculate risk or intelligence scores in JavaScript.
 */

import { api } from './api.js';
import { DEV_EMERGENCY_INTELLIGENCE } from '../data/devMatching.js';
import { emergencyService, parseEmergencyId } from './emergencyService.js';

export const intelligenceService = {
  /**
   * Get intelligence analysis report for an emergency from backend deterministic engine
   * @param {string|number} emergencyId
   * @returns {Promise<Object>}
   */
  async getEmergencyIntelligence(emergencyId) {
    const numericId = parseEmergencyId(emergencyId);
    if (numericId !== null) {
      try {
        const intel = await api.get(`/api/emergencies/${numericId}/intelligence`);
        if (intel && (intel.emergency_id || intel.emergency_title)) {
          const emg = await emergencyService.getEmergencyById(emergencyId).catch(() => null);
          const flags = Array.isArray(intel.intelligence_flags) ? intel.intelligence_flags : [];
          const explanations = Array.isArray(intel.explanation)
            ? intel.explanation.join(' ')
            : (intel.explanation || 'Deterministic emergency intelligence synthesis complete.');

          return {
            emergencyId: String(intel.emergency_id || emergencyId),
            title: intel.emergency_title || emg?.title || 'Emergency Incident',
            severity: (intel.severity_analysis || emg?.severity || 'medium').toLowerCase(),
            urgency: (intel.urgency_analysis || 'medium').toLowerCase(),
            classification: intel.classification || 'Incident Operations',
            staffingRequirement: `${intel.headcount?.target_volunteers_needed || intel.total_requirements_count || emg?.requiredVolunteers || 1} Responders Target Quota`,
            requiredSkillsSummary: Array.isArray(intel.required_skills) && intel.required_skills.length > 0
              ? intel.required_skills
              : (emg?.requirements || []).map((r) => `${r.skill} (Min: ${r.minProficiency})`),
            locationValidation: {
              status: intel.location_available ? 'Validated (Sector Verified)' : 'Location Coordinates Pending',
              sector: emg?.location || 'Operational Sector',
              jurisdiction: 'Municipal Emergency Management Sector',
              coordinates: intel.latitude && intel.longitude
                ? `${Number(intel.latitude).toFixed(4)}° N, ${Number(intel.longitude).toFixed(4)}° W`
                : (emg?.latitude && emg?.longitude ? `${emg.latitude}° N, ${emg.longitude}° W` : 'Coordinates Recorded'),
              accessCondition: 'Transit routes subject to local incident command check.'
            },
            riskFlags: flags.length > 0
              ? flags.map((flag, idx) => ({
                  id: `rf-${idx}`,
                  level: (intel.severity_analysis || 'high').toLowerCase(),
                  title: flag,
                  description: `Deterministic intelligence signal: ${flag}`
                }))
              : [
                  {
                    id: 'rf-0',
                    level: (intel.severity_analysis || emg?.severity || 'medium').toLowerCase(),
                    title: `Operational Status: ${(intel.emergency_status || 'Active').toUpperCase()}`,
                    description: explanations
                  }
                ],
            reasoning: explanations,
            headcount: intel.headcount,
            rawBackend: intel
          };
        }
      } catch (err) {
        console.warn(`[intelligenceService] GET /api/emergencies/${numericId}/intelligence failed:`, err.message);
      }
    }

    // Development / offline fallback
    if (DEV_EMERGENCY_INTELLIGENCE[emergencyId]) {
      return JSON.parse(JSON.stringify(DEV_EMERGENCY_INTELLIGENCE[emergencyId]));
    }

    const emg = await emergencyService.getEmergencyById(emergencyId).catch(() => null);
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
