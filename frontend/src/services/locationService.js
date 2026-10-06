/**
 * Location & Nearby Volunteers Service (Stage 6 & Stage 17 Integration)
 * 
 * Provides geospatial incident context, coordinates, and nearby volunteer listings
 * using backend pure Python Haversine GIS with local fallback.
 * 
 * DO NOT calculate geographic distances or coordinates inside JavaScript components.
 */

import { api } from './api.js';
import { emergencyService, parseEmergencyId } from './emergencyService.js';
import { DEV_NEARBY_VOLUNTEERS } from '../data/devMatching.js';

export const locationService = {
  /**
   * Get location data for an emergency
   * @param {string|number} emergencyId
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
   * Get nearby volunteers for an emergency incident from backend Haversine GIS
   * @param {string|number} emergencyId
   * @param {number} radiusKm
   * @returns {Promise<Array>}
   */
  async getNearbyVolunteers(emergencyId, radiusKm = 20) {
    const numericId = parseEmergencyId(emergencyId);
    if (numericId !== null) {
      try {
        const data = await api.get(`/api/emergencies/${numericId}/nearby-volunteers?radius_km=${radiusKm}`);
        if (data && Array.isArray(data.volunteers)) {
          return data.volunteers.map((v) => ({
            id: String(v.id),
            volunteerId: String(v.id),
            name: v.full_name,
            volunteerName: v.full_name,
            role: v.role,
            distance: `${v.distance_km} km`,
            distance_km: v.distance_km,
            location: v.location || 'Sector Area',
            phone: v.phone || 'Recorded',
            email: v.email,
            isAvailable: true,
            eligibility: 'Eligible - Rapid Surge',
            skill: 'Disaster Volunteer',
            proficiency: 'Intermediate'
          }));
        }
      } catch (err) {
        console.warn(`[locationService] GET /api/emergencies/${numericId}/nearby-volunteers failed:`, err.message);
      }
    }

    // Development / offline fallback
    const list = DEV_NEARBY_VOLUNTEERS[emergencyId] || DEV_NEARBY_VOLUNTEERS['emg-501'] || [];
    return JSON.parse(JSON.stringify(list));
  },

  /**
   * Reverse geocode coordinates to a human-readable location address/sector.
   * Gracefully handles network issues, offline mode, and invalid coordinates.
   * @param {number|string} latitude
   * @param {number|string} longitude
   * @returns {Promise<string>}
   */
  async reverseGeocode(latitude, longitude) {
    const lat = Number(latitude);
    const lon = Number(longitude);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return '';
    }

    // Check fast cache
    const cacheKey = `geo_${lat.toFixed(3)}_${lon.toFixed(3)}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) return cached;
    } catch (_) {}

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=14`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const parts = [
            data.address.suburb || data.address.neighbourhood || data.address.road,
            data.address.city || data.address.town || data.address.county,
            data.address.state
          ].filter(Boolean);
          if (parts.length > 0) {
            const formatted = parts.join(', ');
            try { sessionStorage.setItem(cacheKey, formatted); } catch (_) {}
            return formatted;
          }
        }
        if (data && data.display_name) {
          const parts = data.display_name.split(',').slice(0, 3).map((s) => s.trim()).join(', ');
          try { sessionStorage.setItem(cacheKey, parts); } catch (_) {}
          return parts;
        }
      }
    } catch (_) {
      // Offline or network timeout fallback
    }

    const fallbackSector = `Sector Zone (${lat >= 0 ? lat.toFixed(3) + '°N' : Math.abs(lat).toFixed(3) + '°S'}, ${lon >= 0 ? lon.toFixed(3) + '°E' : Math.abs(lon).toFixed(3) + '°W'})`;
    return fallbackSector;
  },

  /**
   * Format GPS coordinates into standardized tactical display format
   * @param {number|string} lat
   * @param {number|string} lng
   * @returns {string}
   */
  formatCoordinates(lat, lng) {
    const nLat = Number(lat);
    const nLng = Number(lng);
    if (isNaN(nLat) || isNaN(nLng)) return 'Coordinates not set';
    const latDir = nLat >= 0 ? 'N' : 'S';
    const lngDir = nLng >= 0 ? 'E' : 'W';
    return `${Math.abs(nLat).toFixed(4)}° ${latDir}, ${Math.abs(nLng).toFixed(4)}° ${lngDir}`;
  }
};

export default locationService;
