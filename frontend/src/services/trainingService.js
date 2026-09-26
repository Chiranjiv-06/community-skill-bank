/**
 * Training Service (Stage 8)
 * 
 * Provides isolated frontend state management for disaster drills,
 * preparedness curriculums, and volunteer module progress.
 * 
 * Maps to future FastAPI endpoints in Stage 17:
 * - GET  /api/v1/training/modules
 * - GET  /api/v1/training/progress/:volunteerId
 * - POST /api/v1/training/enroll
 * - POST /api/v1/training/progress
 * - POST /api/v1/training/complete
 * 
 * DO NOT make real API calls or connect to backend in Stage 8.
 */

import {
  INITIAL_DEV_TRAINING_MODULES,
  INITIAL_DEV_VOLUNTEER_TRAINING,
  TRAINING_STATUSES
} from '../data/devTrust.js';

const MODULES_KEY = 'csb_dev_training_modules';
const PROGRESS_KEY = 'csb_dev_training_progress';

const getStoredModules = () => {
  try {
    const raw = localStorage.getItem(MODULES_KEY);
    if (!raw) {
      localStorage.setItem(MODULES_KEY, JSON.stringify(INITIAL_DEV_TRAINING_MODULES));
      return JSON.parse(JSON.stringify(INITIAL_DEV_TRAINING_MODULES));
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[trainingService] Error parsing localStorage training modules:', err);
    localStorage.setItem(MODULES_KEY, JSON.stringify(INITIAL_DEV_TRAINING_MODULES));
    return JSON.parse(JSON.stringify(INITIAL_DEV_TRAINING_MODULES));
  }
};

const getStoredProgress = () => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(INITIAL_DEV_VOLUNTEER_TRAINING));
      return JSON.parse(JSON.stringify(INITIAL_DEV_VOLUNTEER_TRAINING));
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[trainingService] Error parsing localStorage training progress:', err);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(INITIAL_DEV_VOLUNTEER_TRAINING));
    return JSON.parse(JSON.stringify(INITIAL_DEV_VOLUNTEER_TRAINING));
  }
};

const setStoredProgress = (items) => {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('[trainingService] Error persisting progress:', err);
  }
};

export const trainingService = {
  /**
   * Retrieve catalog of training courses
   */
  async getTrainingModules(filters = {}) {
    let list = getStoredModules();

    if (filters.category && filters.category !== 'ALL') {
      list = list.filter((m) => m.category === filters.category);
    }

    if (filters.level && filters.level !== 'ALL') {
      list = list.filter((m) => m.level === filters.level);
    }

    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.title?.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.category?.toLowerCase().includes(q) ||
          m.certificationRelationship?.toLowerCase().includes(q)
      );
    }

    return JSON.parse(JSON.stringify(list));
  },

  /**
   * Retrieve single training module by ID
   */
  async getTrainingModuleById(id) {
    const list = getStoredModules();
    const found = list.find((m) => m.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  },

  /**
   * Retrieve volunteer's enrolled modules with progress & status
   */
  async getVolunteerTraining(volunteerIdOrEmail) {
    const modules = getStoredModules();
    const progressList = getStoredProgress();

    // Support dev volunteer 'Alex Rivera'
    const targetVolId = (volunteerIdOrEmail === 'alex.rivera@skillbank.org' || volunteerIdOrEmail === 'dev-skl-002')
      ? 'dev-skl-002'
      : volunteerIdOrEmail;

    const userProgress = progressList.filter((p) => p.volunteerId === targetVolId);

    // Merge module metadata with progress
    const combined = modules.map((mod) => {
      const match = userProgress.find((p) => p.trainingId === mod.id);
      if (match) {
        return {
          ...mod,
          enrollmentId: match.id,
          status: match.status,
          progressPercentage: match.progressPercentage,
          startedAt: match.startedAt,
          completedAt: match.completedAt,
          score: match.score,
          lastModuleCompleted: match.lastModuleCompleted
        };
      }
      return {
        ...mod,
        enrollmentId: null,
        status: 'not_started',
        progressPercentage: 0,
        startedAt: null,
        completedAt: null,
        score: null,
        lastModuleCompleted: 0
      };
    });

    return JSON.parse(JSON.stringify(combined));
  },

  /**
   * Enroll volunteer in training module
   */
  async enrollInTraining(volunteerId, trainingId) {
    const progressList = getStoredProgress();
    const targetVolId = (volunteerId === 'alex.rivera@skillbank.org' || volunteerId === 'dev-skl-002')
      ? 'dev-skl-002'
      : volunteerId;

    let existing = progressList.find(
      (p) => p.volunteerId === targetVolId && p.trainingId === trainingId
    );

    const now = new Date().toISOString();

    if (existing) {
      if (existing.status === 'not_started') {
        existing.status = 'in_progress';
        existing.startedAt = now;
        existing.progressPercentage = 15;
      }
    } else {
      existing = {
        id: `vtr-${Date.now().toString().slice(-6)}`,
        volunteerId: targetVolId,
        trainingId,
        status: 'in_progress',
        progressPercentage: 15,
        startedAt: now,
        completedAt: null,
        score: null,
        lastModuleCompleted: 1
      };
      progressList.unshift(existing);
    }

    setStoredProgress(progressList);
    return JSON.parse(JSON.stringify(existing));
  },

  /**
   * Update volunteer training progress percentage
   */
  async updateTrainingProgress(volunteerId, trainingId, progressPercentage) {
    const progressList = getStoredProgress();
    const targetVolId = (volunteerId === 'alex.rivera@skillbank.org' || volunteerId === 'dev-skl-002')
      ? 'dev-skl-002'
      : volunteerId;

    const clamped = Math.max(0, Math.min(100, progressPercentage));
    const now = new Date().toISOString();

    let entry = progressList.find(
      (p) => p.volunteerId === targetVolId && p.trainingId === trainingId
    );

    if (!entry) {
      entry = {
        id: `vtr-${Date.now().toString().slice(-6)}`,
        volunteerId: targetVolId,
        trainingId,
        status: clamped === 100 ? 'completed' : 'in_progress',
        progressPercentage: clamped,
        startedAt: now,
        completedAt: clamped === 100 ? now : null,
        score: clamped === 100 ? '100%' : null,
        lastModuleCompleted: Math.ceil(clamped / 20)
      };
      progressList.unshift(entry);
    } else {
      entry.progressPercentage = clamped;
      if (clamped === 100) {
        entry.status = 'completed';
        entry.completedAt = now;
        entry.score = entry.score || '100%';
      } else {
        entry.status = 'in_progress';
      }
    }

    setStoredProgress(progressList);
    return JSON.parse(JSON.stringify(entry));
  },

  /**
   * Volunteer completes training module
   */
  async completeTraining(volunteerId, trainingId, score = '96%') {
    return this.updateTrainingProgress(volunteerId, trainingId, 100);
  },

  /**
   * Retrieve aggregate statistics for Admin view
   */
  async getTrainingStats() {
    const modules = getStoredModules();
    const progress = getStoredProgress();

    const totalModules = modules.length;
    const completedCount = progress.filter((p) => p.status === 'completed').length;
    const inProgressCount = progress.filter((p) => p.status === 'in_progress').length;

    return {
      totalCourses: totalModules,
      activeEnrolled: inProgressCount,
      completedCertifications: completedCount,
      completionRate: '88.4%'
    };
  },

  /**
   * Reset store to initial seed values
   */
  resetDevelopmentTraining() {
    localStorage.setItem(MODULES_KEY, JSON.stringify(INITIAL_DEV_TRAINING_MODULES));
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(INITIAL_DEV_VOLUNTEER_TRAINING));
    return {
      modules: JSON.parse(JSON.stringify(INITIAL_DEV_TRAINING_MODULES)),
      progress: JSON.parse(JSON.stringify(INITIAL_DEV_VOLUNTEER_TRAINING))
    };
  }
};

export default trainingService;
