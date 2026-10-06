/**
 * User & Volunteer Profile Service
 * 
 * Connects frontend User Profile and Volunteer Operational Profile to real FastAPI backend:
 * - GET  /api/users/me
 * - PATCH /api/users/me
 * - GET  /api/users/me/volunteer-profile
 * - PATCH /api/users/me/volunteer-profile
 * 
 * Preserves existing frontend profile object shape expected by ProfilePage.jsx
 * and preserves offline mutation queueing via offlineSyncService.
 */

import { api } from './api.js';
import { connectivityService } from './connectivityService.js';
import { offlineSyncService } from './offlineSyncService.js';

export const DEFAULT_PROFILE = {
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

export const getStorageKey = (userId) => `csb_dev_profile_${userId || 'current'}`;

/**
 * Safely parse a numeric experience_years value from an experience string or number.
 * @param {string|number|undefined} experienceVal
 * @returns {number}
 */
export const parseExperienceYears = (experienceVal) => {
  if (typeof experienceVal === 'number' && !isNaN(experienceVal)) {
    return Math.max(0, Math.floor(experienceVal));
  }
  if (typeof experienceVal === 'string') {
    const match = experienceVal.match(/\d+/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      if (!isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
  }
  return 0;
};

/**
 * Ensure active JWT token is set on the api client if available in storage.
 */
const ensureAuthToken = () => {
  if (!api.getToken() && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('csb_auth_session');
      if (raw) {
        const session = JSON.parse(raw);
        if (session?.token) {
          api.setToken(session.token);
        }
      }
    } catch {
      // Ignore storage read error
    }
  }
};

/**
 * Read cached profile from localStorage.
 */
const getCachedProfile = (userId) => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const key = getStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    if (userId && userId !== 'current') {
      const currentStored = localStorage.getItem(getStorageKey('current'));
      if (currentStored) {
        const parsed = JSON.parse(currentStored);
        if (String(parsed.id) === String(userId)) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('[userService] Failed to read cached profile:', err);
  }
  return null;
};

/**
 * Normalize backend user and volunteer-profile objects into the exact frontend profile format
 * expected by ProfilePage.jsx.
 */
export const normalizeProfile = (user, volunteerProfile = null, cachedProfile = null) => {
  if (!user) return null;

  const role = user.role || cachedProfile?.role || 'volunteer';
  const isActive = user.is_active !== undefined ? Boolean(user.is_active) : (cachedProfile?.is_active ?? true);
  const verificationStatus = user.verification_status || cachedProfile?.verification_status || (isActive ? 'verified' : 'pending');

  // Handle experience field: preserve rich text from cache if years match, else construct safe text
  let experienceText = '';
  if (volunteerProfile && volunteerProfile.experience_years !== undefined && volunteerProfile.experience_years !== null) {
    const years = volunteerProfile.experience_years;
    if (cachedProfile?.experience && parseExperienceYears(cachedProfile.experience) === years) {
      experienceText = cachedProfile.experience;
    } else if (years > 0) {
      experienceText = `${years} years of volunteer and emergency response experience.`;
    } else {
      experienceText = '0 years of emergency response experience.';
    }
  } else if (cachedProfile?.experience) {
    experienceText = cachedProfile.experience;
  } else {
    experienceText = 'No prior disaster experience recorded.';
  }

  // Handle emergency contact relationship (frontend-only, backend does not have this column)
  const relationship = cachedProfile?.emergencyContact?.relationship || '';

  return {
    id: user.id !== undefined && user.id !== null ? String(user.id) : (cachedProfile?.id || 'current'),
    email: user.email || cachedProfile?.email || '',
    role,
    is_active: isActive,
    verification_status: verificationStatus,
    fullName: user.full_name || user.name || cachedProfile?.fullName || '',
    phone: user.phone !== null && user.phone !== undefined ? user.phone : (cachedProfile?.phone || ''),
    bio: user.bio !== null && user.bio !== undefined ? user.bio : (cachedProfile?.bio || ''),
    location: user.location !== null && user.location !== undefined ? user.location : (cachedProfile?.location || ''),
    latitude: user.latitude !== null && user.latitude !== undefined ? user.latitude : (cachedProfile?.latitude ?? ''),
    longitude: user.longitude !== null && user.longitude !== undefined ? user.longitude : (cachedProfile?.longitude ?? ''),
    availability: user.availability || cachedProfile?.availability || 'Available 24/7 (Emergency Deployment)',

    // Volunteer operational fields
    transportation: volunteerProfile?.transportation_type || cachedProfile?.transportation || 'Personal Vehicle',
    maxTravelDistance: volunteerProfile?.max_travel_distance_km !== undefined && volunteerProfile?.max_travel_distance_km !== null
      ? volunteerProfile.max_travel_distance_km
      : (cachedProfile?.maxTravelDistance !== undefined ? cachedProfile.maxTravelDistance : 25),
    experience: experienceText,
    emergencyContact: {
      name: volunteerProfile?.emergency_contact_name || cachedProfile?.emergencyContact?.name || '',
      phone: volunteerProfile?.emergency_contact_phone || cachedProfile?.emergencyContact?.phone || '',
      relationship
    }
  };
};

export const userService = {
  /**
   * Fetch volunteer / user profile
   * Flow:
   * 1. GET /api/users/me
   * 2. If not admin, also GET /api/users/me/volunteer-profile (404 is treated as uninitialized)
   * 3. Normalize to frontend profile shape
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getProfile(userId = 'current') {
    ensureAuthToken();

    // Check if token exists or if offline/dev environment
    const hasToken = Boolean(api.getToken());

    if (!hasToken) {
      const cached = getCachedProfile(userId);
      if (cached) {
        return cached;
      }
      // SeedTest / fixture fallback for dev IDs when unauthenticated
      if (userId && String(userId).startsWith('dev-')) {
        return {
          ...DEFAULT_PROFILE,
          id: userId
        };
      }
    }

    try {
      // 1. Call GET /api/users/me
      const userRes = await api.get('/api/users/me');
      const cached = getCachedProfile(userRes.id || userId);

      // 2. For non-admin users, call GET /api/users/me/volunteer-profile
      let volunteerRes = null;
      if (userRes.role !== 'admin') {
        try {
          volunteerRes = await api.get('/api/users/me/volunteer-profile');
        } catch (vpErr) {
          // 404 is uninitialized profile, NOT a fatal error
          const isNotFound = vpErr.message && (
            vpErr.message.includes('404') ||
            vpErr.message.toLowerCase().includes('not found')
          );
          if (!isNotFound) {
            console.warn('[userService] Non-fatal volunteer-profile load failure:', vpErr.message);
          }
          volunteerRes = null;
        }
      }

      // 3. Normalize into frontend profile object
      const normalized = normalizeProfile(userRes, volunteerRes, cached);

      // 4. Cache into localStorage
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(getStorageKey(userRes.id), JSON.stringify(normalized));
          if (userId && userId !== 'current' && String(userId) !== String(userRes.id)) {
            localStorage.setItem(getStorageKey(userId), JSON.stringify(normalized));
          }
        } catch (cacheErr) {
          console.warn('[userService] Failed to cache profile:', cacheErr);
        }
      }

      return normalized;
    } catch (err) {
      // Handle network / offline failures with cached fallback if available
      const cached = getCachedProfile(userId);
      if (cached && (!connectivityService.isOnline() || err.message?.includes('Network') || err.message?.includes('Failed to fetch'))) {
        console.warn('[userService] Network unavailable, returning cached profile:', err.message);
        return cached;
      }

      // If running dev fixture without backend connectivity
      if (userId && String(userId).startsWith('dev-')) {
        return {
          ...DEFAULT_PROFILE,
          id: userId
        };
      }

      // Re-throw without silently replacing with fake data
      throw err;
    }
  },

  /**
   * Update editable user and volunteer profile fields
   * Server-controlled fields (id, email, role, is_active, verification_status) are protected
   * Splits payload safely between:
   * - PATCH /api/users/me (UserUpdate: full_name, phone, location, latitude, longitude, bio, availability)
   * - PATCH /api/users/me/volunteer-profile (VolunteerProfileUpdate: emergency_contact_name, emergency_contact_phone, transportation_type, max_travel_distance_km, experience_years)
   * 
   * @param {string} userId
   * @param {Object} profileData
   * @returns {Promise<Object>}
   */
  async updateProfile(userId = 'current', profileData = {}) {
    ensureAuthToken();

    // Offline / unauthenticated fallback
    if (!connectivityService.isOnline() || !api.getToken()) {
      const current = await this.getProfile(userId);
      const updated = {
        ...current,
        fullName: profileData.fullName !== undefined ? profileData.fullName.trim() : current.fullName,
        phone: profileData.phone !== undefined ? profileData.phone.trim() : current.phone,
        bio: profileData.bio !== undefined ? profileData.bio.trim() : current.bio,
        experience: profileData.experience !== undefined ? profileData.experience.trim() : current.experience,
        location: profileData.location !== undefined ? profileData.location.trim() : current.location,
        latitude: profileData.latitude !== undefined && profileData.latitude !== '' ? Number(profileData.latitude) : current.latitude,
        longitude: profileData.longitude !== undefined && profileData.longitude !== '' ? Number(profileData.longitude) : current.longitude,
        availability: profileData.availability || current.availability,
        emergencyContact: {
          name: profileData.emergencyContact?.name !== undefined ? profileData.emergencyContact.name.trim() : (current.emergencyContact?.name || ''),
          phone: profileData.emergencyContact?.phone !== undefined ? profileData.emergencyContact.phone.trim() : (current.emergencyContact?.phone || ''),
          relationship: profileData.emergencyContact?.relationship || current.emergencyContact?.relationship || ''
        },
        transportation: profileData.transportation || current.transportation,
        maxTravelDistance: profileData.maxTravelDistance !== undefined && profileData.maxTravelDistance !== '' ? Number(profileData.maxTravelDistance) : current.maxTravelDistance,
        id: current.id,
        email: current.email,
        role: current.role,
        is_active: current.is_active,
        verification_status: current.verification_status
      };

      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
        } catch (err) {
          console.warn('[userService] Failed to cache offline profile update:', err);
        }
      }

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

    // Authenticated online updates
    // 1. Prepare strictly filtered UserUpdate payload for PATCH /api/users/me
    const userPayload = {};
    const fullName = profileData.fullName !== undefined ? profileData.fullName : profileData.full_name;
    if (fullName !== undefined) userPayload.full_name = fullName ? fullName.trim() : '';
    if (profileData.phone !== undefined) userPayload.phone = profileData.phone ? profileData.phone.trim() : null;
    if (profileData.location !== undefined) userPayload.location = profileData.location ? profileData.location.trim() : null;
    if (profileData.bio !== undefined) userPayload.bio = profileData.bio ? profileData.bio.trim() : null;
    if (profileData.availability !== undefined) userPayload.availability = profileData.availability || null;

    if (profileData.latitude !== undefined) {
      if (profileData.latitude === '' || profileData.latitude === null) {
        userPayload.latitude = null;
      } else {
        const lat = Number(profileData.latitude);
        if (!isNaN(lat) && lat >= -90 && lat <= 90) {
          userPayload.latitude = lat;
        }
      }
    }

    if (profileData.longitude !== undefined) {
      if (profileData.longitude === '' || profileData.longitude === null) {
        userPayload.longitude = null;
      } else {
        const lng = Number(profileData.longitude);
        if (!isNaN(lng) && lng >= -180 && lng <= 180) {
          userPayload.longitude = lng;
        }
      }
    }

    let updatedUser = null;
    if (Object.keys(userPayload).length > 0) {
      updatedUser = await api.patch('/api/users/me', userPayload);
    } else {
      updatedUser = await api.get('/api/users/me');
    }

    // 2. Prepare strictly filtered VolunteerProfileUpdate payload for PATCH /api/users/me/volunteer-profile
    // Admin users return 403, so skip volunteer profile for admin
    let updatedVolunteer = null;
    if (updatedUser.role !== 'admin') {
      const volunteerPayload = {};

      if (profileData.emergencyContact?.name !== undefined) {
        volunteerPayload.emergency_contact_name = profileData.emergencyContact.name ? profileData.emergencyContact.name.trim() : null;
      }
      if (profileData.emergencyContact?.phone !== undefined) {
        volunteerPayload.emergency_contact_phone = profileData.emergencyContact.phone ? profileData.emergencyContact.phone.trim() : null;
      }
      if (profileData.transportation !== undefined) {
        volunteerPayload.transportation_type = profileData.transportation || null;
      }
      if (profileData.maxTravelDistance !== undefined && profileData.maxTravelDistance !== '' && profileData.maxTravelDistance !== null) {
        const dist = Number(profileData.maxTravelDistance);
        if (!isNaN(dist) && dist > 0) {
          volunteerPayload.max_travel_distance_km = dist;
        }
      }
      if (profileData.experience !== undefined) {
        volunteerPayload.experience_years = parseExperienceYears(profileData.experience);
      } else if (profileData.experience_years !== undefined) {
        volunteerPayload.experience_years = Number(profileData.experience_years) || 0;
      }

      if (Object.keys(volunteerPayload).length > 0) {
        updatedVolunteer = await api.patch('/api/users/me/volunteer-profile', volunteerPayload);
      } else {
        try {
          updatedVolunteer = await api.get('/api/users/me/volunteer-profile');
        } catch {
          updatedVolunteer = null;
        }
      }
    }

    // 3. Preserve frontend-only fields (e.g., emergencyContact.relationship and experience text)
    const cached = getCachedProfile(userId || updatedUser.id);
    const relationship = profileData.emergencyContact?.relationship !== undefined
      ? profileData.emergencyContact.relationship
      : (cached?.emergencyContact?.relationship || '');

    const normalized = normalizeProfile(updatedUser, updatedVolunteer, {
      ...cached,
      ...profileData,
      emergencyContact: {
        ...(cached?.emergencyContact || {}),
        ...(profileData.emergencyContact || {}),
        relationship
      }
    });

    // 4. Cache updated profile into localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(getStorageKey(updatedUser.id), JSON.stringify(normalized));
        if (userId && userId !== 'current' && String(userId) !== String(updatedUser.id)) {
          localStorage.setItem(getStorageKey(userId), JSON.stringify(normalized));
        }
      } catch (err) {
        console.warn('[userService] Failed to cache profile update:', err);
      }
    }

    // 5. Enqueue offline mutation if connection dropped during save
    if (!connectivityService.isOnline()) {
      offlineSyncService.enqueueMutation({
        entityType: 'profile',
        entityId: normalized.id,
        operation: 'UPDATE',
        description: `Updated profile details for "${normalized.fullName}"`,
        payload: normalized,
        userId: normalized.id,
        role: normalized.role
      }).catch(() => {});
    }

    return normalized;
  }
};

export default userService;
