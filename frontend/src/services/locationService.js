/**
 * Location & Nearby Volunteers Service (Stage 6)
 * 
 * Provides geospatial incident context, coordinates, and nearby volunteer listings
 * using isolated frontend development state.
 * 
 * In Stage 17: Will call api.get('/emergencies/:id/location') and
 * api.get('/emergencies/:id/nearby-volunteers').
 * 
 * DO NOT calculate geographic distances or coordinates inside JavaScript components.
 */

import { emergencyService } from './emergencyService.js';
import { DEV_NEARBY_VOLUNTEERS } from '../data/devMatching.js';

export const locationService = {
  /**
   * Get location data for an emergency
   * @param {string} emergencyId
   * @returns {Promise<Object>}
   */
  async getEmergencyLocation(emergencyId) {
    const emergency = await emergencyService.getEmergencyById(emergencyId);
    if (!emergency) {
      throw new Error(`Emergency with ID "${emergencyId}" was not found.`);
    }

    return {
      emergencyId: emergency.id,
      title: emergency.title,
      location: emergency.location,
      latitude: emergency.latitude !== null && emergency.latitude !== undefined ? Number(emergency.latitude) : 34.0522,
      longitude: emergency.longitude !== null && emergency.longitude !== undefined ? Number(emergency.longitude) : -118.2437,
      severity: emergency.severity,
      status: emergency.status
    };
  },

  /**
   * Get nearby volunteers for an emergency incident
   * @param {string} emergencyId
   * @returns {Promise<Array>}
   */
  async getNearbyVolunteers(emergencyId) {
    const list = DEV_NEARBY_VOLUNTEERS[emergencyId] || DEV_NEARBY_VOLUNTEERS['emg-501'] || [];
    return JSON.parse(JSON.stringify(list));
  }
};

export default locationService;
