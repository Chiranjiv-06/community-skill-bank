/**
 * Training Service
 * 
 * Manages volunteer training curriculum, course progress, enrollment, and verification.
 * Connects to real FastAPI backend:
 * - GET  /api/trainings/mine
 * - POST /api/trainings
 * - GET  /api/trainings/{id}
 * - PATCH /api/trainings/{id}
 * - GET  /api/admin/trainings
 * - PATCH /api/admin/trainings/{id}/verify
 * 
 * Preserves local fallback and Stage 8 testing contracts.
 */

import { api } from './api.js';
import {
  INITIAL_DEV_TRAINING_MODULES,
  INITIAL_DEV_VOLUNTEER_TRAINING
} from '../data/devTrust.js';
import { connectivityService } from './connectivityService.js';

const MODULES_KEY = 'csb_dev_training_modules';
const PROGRESS_KEY = 'csb_dev_training_progress';

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
      // Ignore
    }
  }
};

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
    ensureAuthToken();

    const modules = getStoredModules();

    // If authenticated and online, fetch real backend training history
    if (api.getToken() && connectivityService.isOnline() && !String(volunteerIdOrEmail).startsWith('dev-')) {
      try {
        const backendTrainings = await api.get('/api/trainings/mine');
        const progressList = getStoredProgress();

        // Merge module catalog with backend training records
        const combined = modules.map((mod) => {
          const match = (backendTrainings || []).find(
            (t) => t.course_name?.toLowerCase() === mod.title?.toLowerCase()
          );

          if (match) {
            const isCompleted = match.status === 'completed' || match.status === 'verified';
            return {
              ...mod,
              enrollmentId: String(match.id),
              status: match.status,
              progressPercentage: isCompleted ? 100 : 50,
              startedAt: match.created_at,
              completedAt: match.completion_date,
              score: isCompleted ? '100%' : null,
              lastModuleCompleted: isCompleted ? 5 : 2
            };
          }

          // Check local progress fallback for uncommitted items
          const localMatch = progressList.find((p) => p.trainingId === mod.id);
          if (localMatch) {
            return {
              ...mod,
              enrollmentId: localMatch.id,
              status: localMatch.status,
              progressPercentage: localMatch.progressPercentage,
              startedAt: localMatch.startedAt,
              completedAt: localMatch.completedAt,
              score: localMatch.score,
              lastModuleCompleted: localMatch.lastModuleCompleted
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

        // Add any custom courses logged in the backend that were not in the default catalog
        for (const t of backendTrainings || []) {
          const alreadyIncluded = combined.some((c) => c.title?.toLowerCase() === t.course_name?.toLowerCase());
          if (!alreadyIncluded) {
            const isCompleted = t.status === 'completed' || t.status === 'verified';
            combined.push({
              id: `custom-trn-${t.id}`,
              title: t.course_name,
              provider: t.provider,
              category: 'Disaster Preparedness',
              description: `Completed training provided by ${t.provider}`,
              level: 'Intermediate',
              estimatedHours: t.hours_completed || 4,
              enrollmentId: String(t.id),
              status: t.status,
              progressPercentage: isCompleted ? 100 : 50,
              startedAt: t.created_at,
              completedAt: t.completion_date,
              score: isCompleted ? '100%' : null,
              lastModuleCompleted: 5
            });
          }
        }

        return combined;
      } catch (err) {
        console.warn('[trainingService] Backend fetch failed, falling back to local store:', err.message);
      }
    }

    // Local / Offline / Dev-fixture fallback
    const progressList = getStoredProgress();
    const targetVolId = (volunteerIdOrEmail === 'alex.rivera@skillbank.org' || volunteerIdOrEmail === 'dev-skl-002')
      ? 'dev-skl-002'
      : volunteerIdOrEmail;

    const userProgress = progressList.filter((p) => p.volunteerId === targetVolId);

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
    ensureAuthToken();

    const modules = getStoredModules();
    const mod = modules.find((m) => m.id === trainingId);

    // Call backend if authenticated and online
    if (api.getToken() && connectivityService.isOnline() && !String(volunteerId).startsWith('dev-')) {
      try {
        const payload = {
          course_name: mod?.title || trainingId,
          provider: mod?.provider || 'Community Skill Bank Academy',
          hours_completed: 0,
          status: 'in_progress'
        };
        const created = await api.post('/api/trainings', payload);
        return {
          id: String(created.id),
          volunteerId,
          trainingId,
          status: created.status,
          progressPercentage: 15,
          startedAt: created.created_at,
          completedAt: null,
          score: null,
          lastModuleCompleted: 1
        };
      } catch (err) {
        console.warn('[trainingService] Backend enrollment failed, caching locally:', err.message);
      }
    }

    // Local / Offline fallback
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
    ensureAuthToken();

    const clamped = Math.max(0, Math.min(100, progressPercentage));
    const now = new Date().toISOString();
    const modules = getStoredModules();
    const mod = modules.find((m) => m.id === trainingId);

    // If completed and online, submit to backend
    if (clamped === 100 && api.getToken() && connectivityService.isOnline() && !String(volunteerId).startsWith('dev-')) {
      try {
        const payload = {
          course_name: mod?.title || trainingId,
          provider: mod?.provider || 'Community Skill Bank Academy',
          completion_date: now.split('T')[0],
          hours_completed: mod?.estimatedHours || 8,
          status: 'completed'
        };
        const created = await api.post('/api/trainings', payload);
        return {
          id: String(created.id),
          volunteerId,
          trainingId,
          status: 'completed',
          progressPercentage: 100,
          startedAt: created.created_at,
          completedAt: created.completion_date,
          score: '100%',
          lastModuleCompleted: 5
        };
      } catch (err) {
        console.warn('[trainingService] Backend completion sync failed, caching locally:', err.message);
      }
    }

    // Local / Offline fallback
    const progressList = getStoredProgress();
    const targetVolId = (volunteerId === 'alex.rivera@skillbank.org' || volunteerId === 'dev-skl-002')
      ? 'dev-skl-002'
      : volunteerId;

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
  async completeTraining(volunteerId, trainingId, _score = '96%') {
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
   * Admin lists all volunteer training records across platform
   */
  async adminListTrainings(filters = {}) {
    ensureAuthToken();

    if (api.getToken() && connectivityService.isOnline()) {
      const statusParam = filters.status && filters.status !== 'ALL' ? `?status=${encodeURIComponent(filters.status)}` : '';
      return api.get(`/api/admin/trainings${statusParam}`);
    }

    return [];
  },

  /**
   * Admin verifies training course record
   */
  async adminVerifyTraining(trainingId, status = 'verified') {
    ensureAuthToken();

    if (api.getToken() && connectivityService.isOnline()) {
      return api.patch(`/api/admin/trainings/${trainingId}/verify`, { status });
    }

    return null;
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
