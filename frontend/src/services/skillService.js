/**
 * Skill Service
 * 
 * Manages volunteer disaster & emergency skill declarations, categories, and proficiencies.
 * In Stage 4: Uses an isolated frontend development store with local persistence.
 * In Stage 17: Will call api.get('/skills/me'), api.post('/skills/me'), api.put('/skills/:id'), api.delete('/skills/:id').
 */

import { SKILL_CATEGORIES, PROFICIENCY_LEVELS } from '../data/skillCategories.js';
import { connectivityService } from './connectivityService.js';
import { offlineSyncService } from './offlineSyncService.js';

const DEFAULT_SKILLS = [
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

const getStorageKey = (userId) => `csb_dev_skills_${userId || 'current'}`;

export const skillService = {
  /**
   * Get all skills declared by the user
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getUserSkills(userId = 'current') {
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

    // Stage 11 Offline Sync queueing
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
    const currentSkills = await this.getUserSkills(userId);
    const index = currentSkills.findIndex((s) => s.id === skillId);

    if (index === -1) {
      throw new Error('Skill not found.');
    }

    const proficiency = skillData.proficiency || currentSkills[index].proficiency;
    if (!PROFICIENCY_LEVELS.includes(proficiency)) {
      throw new Error(`Proficiency must be one of: ${PROFICIENCY_LEVELS.join(', ')}`);
    }

    const updatedSkill = {
      ...currentSkills[index],
      name: skillData.name !== undefined ? skillData.name.trim() : currentSkills[index].name,
      category: skillData.category || currentSkills[index].category,
      experience: skillData.experience !== undefined ? skillData.experience.trim() : currentSkills[index].experience,
      proficiency
    };

    currentSkills[index] = updatedSkill;

    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(currentSkills));
    } catch (err) {
      console.warn('[skillService] Failed to save updated skill:', err);
    }

    // Stage 11 Offline Sync queueing
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
    const currentSkills = await this.getUserSkills(userId);
    const filtered = currentSkills.filter((s) => s.id !== skillId);

    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(filtered));
    } catch (err) {
      console.warn('[skillService] Failed to persist deleted skill:', err);
    }

    return { success: true, id: skillId };
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
