/**
 * User & Volunteer Profile Service
 * 
 * Provides profile retrieval and update boundaries.
 * In Stage 4: Uses an isolated frontend development profile store with local persistence.
 * In Stage 17: Will call api.get('/users/profile') and api.put('/users/profile', data).
 */

import { connectivityService } from './connectivityService.js';
import { offlineSyncService } from './offlineSyncService.js';

const DEFAULT_PROFILE = {
  id: 'dev-skl-002',
  email: 'alex.rivera@skillbank.org',
  role: 'skilled_volunteer',
  is_active: true,
  verification_status: 'verified',
  fullName: 'Alex Rivera',
  phone: '+1 (555) 234-8901',
  bio: 'Certified emergency medical technician and swift water rescue volunteer with 6 years active service in municipal flood and storm responses.',
  experience: '6 years frontline volunteer service with City Search & Rescue. Participated in 14 flood and seismic disaster deployments. FEMA ICS-100 certified.',
  location: 'District 4 - Metro Sector',
  latitude: 34.0522,
  longitude: -118.2437,
  availability: 'Available 24/7 (Emergency Deployment)',
  emergencyContact: {
    name: 'Elena Rivera',
    phone: '+1 (555) 987-6543',
    relationship: 'Spouse'
  },
  transportation: 'Personal 4x4 / Off-Road Vehicle',
  maxTravelDistance: 35
};

const getStorageKey = (userId) => `csb_dev_profile_${userId || 'current'}`;

export const userService = {
  /**
   * Fetch volunteer profile
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getProfile(userId = 'current') {
    try {
      const key = getStorageKey(userId);
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.warn('[userService] Failed to read cached profile:', err);
    }

    // Default profile seeded with user-specific fallback if provided
    return {
      ...DEFAULT_PROFILE,
      id: userId || DEFAULT_PROFILE.id
    };
  },

  /**
   * Update editable volunteer profile fields
   * Server-controlled fields (id, email, role, is_active, verification_status) are protected
   * @param {string} userId
   * @param {Object} profileData
   * @returns {Promise<Object>}
   */
  async updateProfile(userId = 'current', profileData = {}) {
    const current = await this.getProfile(userId);

    // Protected server-controlled fields cannot be modified by frontend
    const updated = {
      ...current,
      fullName: profileData.fullName !== undefined ? profileData.fullName.trim() : current.fullName,
      phone: profileData.phone !== undefined ? profileData.phone.trim() : current.phone,
      bio: profileData.bio !== undefined ? profileData.bio.trim() : current.bio,
      experience: profileData.experience !== undefined ? profileData.experience.trim() : current.experience,
      location: profileData.location !== undefined ? profileData.location.trim() : current.location,
      latitude: profileData.latitude !== undefined ? Number(profileData.latitude) : current.latitude,
      longitude: profileData.longitude !== undefined ? Number(profileData.longitude) : current.longitude,
      availability: profileData.availability || current.availability,
      emergencyContact: {
        name: profileData.emergencyContact?.name !== undefined ? profileData.emergencyContact.name.trim() : current.emergencyContact?.name || '',
        phone: profileData.emergencyContact?.phone !== undefined ? profileData.emergencyContact.phone.trim() : current.emergencyContact?.phone || '',
        relationship: profileData.emergencyContact?.relationship || current.emergencyContact?.relationship || ''
      },
      transportation: profileData.transportation || current.transportation,
      maxTravelDistance: profileData.maxTravelDistance !== undefined ? Number(profileData.maxTravelDistance) : current.maxTravelDistance,
      // Ensure server-controlled fields are strictly preserved
      id: current.id,
      email: current.email,
      role: current.role,
      is_active: current.is_active,
      verification_status: current.verification_status
    };

    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
    } catch (err) {
      console.warn('[userService] Failed to cache profile update:', err);
    }

    // Stage 11 Offline Sync queueing
    if (!connectivityService.isOnline()) {
      offlineSyncService.enqueueMutation({
        entityType: 'profile',
        entityId: updated.id,
        operation: 'UPDATE',
        description: `Updated profile details for "${updated.fullName}"`,
        payload: updated,
        userId: updated.id,
        role: updated.role
      }).catch(() => {});
    }

    return updated;
  }
};

export default userService;
