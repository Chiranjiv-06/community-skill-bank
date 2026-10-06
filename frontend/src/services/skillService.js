/**
 * Skill Service
 * 
 * Manages volunteer disaster & emergency skill declarations, categories, and proficiencies.
 * Connects to real FastAPI backend:
 * - GET  /api/skills/mine
 * - POST /api/skills/
 * - PATCH /api/skills/{id}
 * - DELETE /api/skills/{id}
 * - GET  /api/skills/categories
 * 
 * Preserves existing frontend data contracts and fallback for offline/test environments.
 */

import { api } from './api.js';
import { SKILL_CATEGORIES, PROFICIENCY_LEVELS, MASTER_SKILLS_TAXONOMY } from '../data/skillCategories.js';
import { connectivityService } from './connectivityService.js';
import { offlineSyncService } from './offlineSyncService.js';

export const DEFAULT_SKILLS = [
  {
    id: 'sk-101',
    name: 'Emergency Triage & Trauma Care',
    category: 'Medical & Trauma Care',
    experience: '6 years frontline field triage',
    proficiency: 'Expert'
  },
  {
    id: 'sk-102',
    name: 'Swift Water & Flood Rescue',
    category: 'Search & Rescue (SAR)',
    experience: '4 years river rescue deployment',
    proficiency: 'Advanced'
  },
  {
    id: 'sk-103',
    name: 'Emergency Ham Radio & Mesh Communications',
    category: 'Emergency Communications & Radio',
    experience: '3 years licensed amateur radio',
    proficiency: 'Intermediate'
  },
  {
    id: 'sk-104',
    name: 'Disaster Relief Staging Logistics',
    category: 'Logistics & Supply Distribution',
    experience: '2 years depot intake coordination',
    proficiency: 'Intermediate'
  }
];

export const getStorageKey = (userId) => `csb_dev_skills_${userId || 'current'}`;

/**
 * Safely parse a numeric experience_years value from an experience string or number.
 */
export const parseExperienceYears = (val) => {
  if (typeof val === 'number' && !isNaN(val)) return Math.max(0, Math.floor(val));
  if (typeof val === 'string') {
    const match = val.match(/\d+/);
    if (match) {
      const p = parseInt(match[0], 10);
      if (!isNaN(p) && p >= 0) return p;
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
 * Normalize backend skill object into frontend shape expected by SkillsPage.jsx
 */
export const normalizeSkill = (s) => {
  if (!s) return null;
  const rawProf = s.proficiency || 'intermediate';
  const capitalizedProf = rawProf.charAt(0).toUpperCase() + rawProf.slice(1).toLowerCase();

  return {
    id: String(s.id),
    name: s.title || '',
    category: s.category || SKILL_CATEGORIES[0],
    description: s.description || '',
    experience: s.description || (s.experience_years ? `${s.experience_years} years` : '0 years'),
    experience_years: s.experience_years || 0,
    proficiency: PROFICIENCY_LEVELS.includes(capitalizedProf) ? capitalizedProf : 'Intermediate',
    owner_id: s.owner_id,
    created_at: s.created_at
  };
};

export const skillService = {
  /**
   * Get all skills declared by the user
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getUserSkills(userId = 'current') {
    ensureAuthToken();

    // Live backend fetch when authenticated
    if (api.getToken() && connectivityService.isOnline() && !String(userId).startsWith('dev-')) {
      try {
        const skills = await api.get('/api/skills/mine');
        const normalized = (skills || []).map(normalizeSkill);

        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem(getStorageKey(userId), JSON.stringify(normalized));
          } catch {
            // ignore cache write error
          }
        }

        return normalized;
      } catch (err) {
        console.warn('[skillService] Backend fetch failed, falling back to cache:', err.message);
      }
    }

    // Local / Offline / Dev-fixture fallback
    try {
      const key = getStorageKey(userId);
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.warn('[skillService] Failed to read cached skills:', err);
    }

    return [...DEFAULT_SKILLS];
  },

  /**
   * Add a new skill
   * @param {string} userId
   * @param {Object} skillData - { name, category, experience, proficiency }
   * @returns {Promise<Object>}
   */
  async addSkill(userId = 'current', skillData) {
    const name = skillData?.name?.trim();
    const category = skillData?.category || SKILL_CATEGORIES[0];
    const experience = skillData?.experience?.trim() || '1 year';
    const proficiency = skillData?.proficiency || 'Beginner';

    if (!name) {
      throw new Error('Skill name is required.');
    }

    if (!PROFICIENCY_LEVELS.includes(proficiency)) {
      throw new Error(`Proficiency must be one of: ${PROFICIENCY_LEVELS.join(', ')}`);
    }

    ensureAuthToken();

    // Live backend call when authenticated
    if (api.getToken() && connectivityService.isOnline() && !String(userId).startsWith('dev-')) {
      const payload = {
        title: name,
        category,
        description: experience,
        experience_years: parseExperienceYears(experience),
        proficiency: proficiency.toLowerCase()
      };

      const created = await api.post('/api/skills/', payload);
      const normalized = normalizeSkill(created);

      // Update cached skills
      try {
        const currentSkills = await this.getUserSkills(userId);
        const exists = currentSkills.some((s) => s.id === normalized.id);
        const updated = exists ? currentSkills : [normalized, ...currentSkills];
        localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
      } catch {
        // ignore
      }

      return normalized;
    }

    // Offline / dev fallback
    const currentSkills = await this.getUserSkills(userId);
    const newSkill = {
      id: `sk-${Date.now()}`,
      name,
      category,
      experience,
      proficiency
    };

    const updated = [newSkill, ...currentSkills];

    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
    } catch (err) {
      console.warn('[skillService] Failed to save new skill:', err);
    }

    if (!connectivityService.isOnline()) {
      offlineSyncService.enqueueMutation({
        entityType: 'skill',
        entityId: newSkill.id,
        operation: 'CREATE',
        description: `Added skill "${newSkill.name}" (${newSkill.proficiency})`,
        payload: newSkill,
        userId
      }).catch(() => {});
    }

    return newSkill;
  },

  /**
   * Update an existing skill
   * @param {string} userId
   * @param {string} skillId
   * @param {Object} skillData
   * @returns {Promise<Object>}
   */
  async updateSkill(userId = 'current', skillId, skillData) {
    const proficiency = skillData.proficiency;
    if (proficiency && !PROFICIENCY_LEVELS.includes(proficiency)) {
      throw new Error(`Proficiency must be one of: ${PROFICIENCY_LEVELS.join(', ')}`);
    }

    ensureAuthToken();

    // Check if skillId is numeric (backend ID)
    const isBackendId = /^\d+$/.test(String(skillId));

    if (api.getToken() && connectivityService.isOnline() && isBackendId && !String(userId).startsWith('dev-')) {
      const payload = {};
      if (skillData.name !== undefined) payload.title = skillData.name.trim();
      if (skillData.category !== undefined) payload.category = skillData.category;
      if (skillData.experience !== undefined) {
        payload.description = skillData.experience.trim();
        payload.experience_years = parseExperienceYears(skillData.experience);
      }
      if (skillData.description !== undefined) payload.description = skillData.description.trim();
      if (skillData.experience_years !== undefined) payload.experience_years = Number(skillData.experience_years);
      if (skillData.proficiency !== undefined) payload.proficiency = skillData.proficiency.toLowerCase();

      const updated = await api.patch(`/api/skills/${skillId}`, payload);
      const normalized = normalizeSkill(updated);

      try {
        const currentSkills = await this.getUserSkills(userId);
        const updatedList = currentSkills.map((s) => (String(s.id) === String(skillId) ? normalized : s));
        localStorage.setItem(getStorageKey(userId), JSON.stringify(updatedList));
      } catch {
        // ignore
      }

      return normalized;
    }

    // Offline / dev fallback
    const currentSkills = await this.getUserSkills(userId);
    const index = currentSkills.findIndex((s) => String(s.id) === String(skillId));

    if (index === -1) {
      throw new Error('Skill not found.');
    }

    const updatedSkill = {
      ...currentSkills[index],
      name: skillData.name !== undefined ? skillData.name.trim() : currentSkills[index].name,
      category: skillData.category || currentSkills[index].category,
      experience: skillData.experience !== undefined ? skillData.experience.trim() : currentSkills[index].experience,
      proficiency: proficiency || currentSkills[index].proficiency
    };

    currentSkills[index] = updatedSkill;

    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(currentSkills));
    } catch (err) {
      console.warn('[skillService] Failed to save updated skill:', err);
    }

    if (!connectivityService.isOnline()) {
      offlineSyncService.enqueueMutation({
        entityType: 'skill',
        entityId: skillId,
        operation: 'UPDATE',
        description: `Updated skill "${updatedSkill.name}" proficiency`,
        payload: updatedSkill,
        userId
      }).catch(() => {});
    }

    return updatedSkill;
  },

  /**
   * Delete a skill
   * @param {string} userId
   * @param {string} skillId
   * @returns {Promise<{ success: boolean, id: string }>}
   */
  async deleteSkill(userId = 'current', skillId) {
    ensureAuthToken();

    const isBackendId = /^\d+$/.test(String(skillId));

    if (api.getToken() && connectivityService.isOnline() && isBackendId && !String(userId).startsWith('dev-')) {
      await api.delete(`/api/skills/${skillId}`);

      try {
        const currentSkills = await this.getUserSkills(userId);
        const filtered = currentSkills.filter((s) => String(s.id) !== String(skillId));
        localStorage.setItem(getStorageKey(userId), JSON.stringify(filtered));
      } catch {
        // ignore
      }

      return { success: true, id: String(skillId) };
    }

    // Offline / dev fallback
    const currentSkills = await this.getUserSkills(userId);
    const filtered = currentSkills.filter((s) => String(s.id) !== String(skillId));

    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(filtered));
    } catch (err) {
      console.warn('[skillService] Failed to persist deleted skill:', err);
    }

    return { success: true, id: String(skillId) };
  },

  /**
   * Get master emergency skills taxonomy
   * Integrates backend /api/skills/ query endpoint with master disaster ontology fallback.
   * @param {Object} filters - { category, search, proficiency }
   * @returns {Promise<Array>}
   */
  async getSkillsTaxonomy(filters = {}) {
    ensureAuthToken();
    const { category = 'ALL', search = '', proficiency = 'ALL' } = filters;

    // 1. Try real backend catalog
    try {
      const params = new URLSearchParams();
      if (category && category !== 'ALL') params.append('category', category);
      if (search && search.trim()) params.append('search', search.trim());
      if (proficiency && proficiency !== 'ALL') params.append('proficiency', proficiency.toLowerCase());
      const queryStr = params.toString() ? `?${params.toString()}` : '';

      const liveSkills = await api.get(`/api/skills/${queryStr}`);
      if (Array.isArray(liveSkills) && liveSkills.length > 0) {
        return liveSkills.map((s) => {
          const norm = normalizeSkill(s);
          const matchedTax = MASTER_SKILLS_TAXONOMY.find(
            (t) => t.title.toLowerCase() === norm.name.toLowerCase() || t.category === norm.category
          );
          return {
            id: norm.id,
            title: norm.name,
            category: norm.category,
            description: norm.description || matchedTax?.description || 'Operational emergency response capability.',
            proficiency: norm.proficiency,
            requiredCertifications: matchedTax?.requiredCertifications || ['Accredited Response Credential'],
            verificationCriteria: matchedTax?.verificationCriteria || 'Official institutional verification check.',
            disasterScenarios: matchedTax?.disasterScenarios || ['All-Hazards Emergency'],
            status: 'Standardized'
          };
        });
      }
    } catch (err) {
      console.warn('[skillService] Backend /api/skills/ unavailable, using master taxonomy:', err.message);
    }

    // 2. Master taxonomy filter
    return MASTER_SKILLS_TAXONOMY.filter((item) => {
      if (category && category !== 'ALL' && item.category !== category) {
        return false;
      }
      if (proficiency && proficiency !== 'ALL' && item.proficiency !== proficiency) {
        return false;
      }
      if (search && search.trim() !== '') {
        const q = search.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        const matchesCerts = item.requiredCertifications?.some((c) => c.toLowerCase().includes(q));
        const matchesScenarios = item.disasterScenarios?.some((d) => d.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesCategory && !matchesCerts && !matchesScenarios) {
          return false;
        }
      }
      return true;
    });
  },

  /**
   * Available skill categories
   */
  getCategories() {
    return [...SKILL_CATEGORIES];
  },

  /**
   * Approved proficiency levels
   */
  getProficiencies() {
    return [...PROFICIENCY_LEVELS];
  }
};

export default skillService;
