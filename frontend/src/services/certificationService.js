/**
 * Certification Service
 * 
 * Manages volunteer emergency credentials, licenses, and admin verification workflow.
 * Connects to real FastAPI backend:
 * - GET  /api/certifications/mine
 * - POST /api/certifications
 * - GET  /api/certifications/{id}
 * - PATCH /api/certifications/{id}
 * - GET  /api/admin/certifications
 * - PATCH /api/admin/certifications/{id}/verify
 * 
 * Preserves local fallback and Stage 8 testing contracts.
 */

import { api } from './api.js';
import {
  INITIAL_DEV_CERTIFICATIONS
} from '../data/devTrust.js';
import { realtimeService } from './realtimeService.js';
import { connectivityService } from './connectivityService.js';
import { offlineSyncService } from './offlineSyncService.js';

const STORAGE_KEY = 'csb_dev_certifications';

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

const getCurrentSessionUser = () => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem('csb_auth_session');
    if (!raw) return null;
    return JSON.parse(raw)?.user || null;
  } catch {
    return null;
  }
};

const getStoredCertifications = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_CERTIFICATIONS));
      return JSON.parse(JSON.stringify(INITIAL_DEV_CERTIFICATIONS));
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[certificationService] Error parsing localStorage certifications:', err);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_CERTIFICATIONS));
    return JSON.parse(JSON.stringify(INITIAL_DEV_CERTIFICATIONS));
  }
};

const setStoredCertifications = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('[certificationService] Error persisting certifications:', err);
  }
};

/**
 * Normalize backend certification to frontend shape expected by CertificationCard.jsx
 */
export const normalizeCertification = (c) => {
  if (!c) return null;
  const isVerified = c.verification_status === 'verified';
  const isExpired = c.verification_status === 'expired';
  const status = isVerified ? 'active' : (isExpired ? 'expired' : 'pending_review');

  return {
    id: String(c.id),
    name: c.title || '',
    category: c.skill_title || 'General Emergency',
    issuingOrg: c.issuing_organization || '',
    credentialId: c.credential_id || `CERT-${c.id}`,
    issueDate: c.issue_date || '',
    expiryDate: c.expiry_date || null,
    status,
    verificationStatus: c.verification_status || 'pending',
    verifiedAt: c.verified_at || null,
    verifiedBy: c.verified_by_id ? `Admin #${c.verified_by_id}` : null,
    verified_by_id: c.verified_by_id,
    documentName: c.title ? `${c.title.replace(/\\s+/g, '_')}_Certificate.pdf` : 'Credential.pdf',
    documentUrl: '#',
    evidenceNotes: c.verification_notes || 'Submitted by volunteer for clearance.',
    rejectionReason: c.verification_status === 'rejected' ? (c.verification_notes || 'Documentation could not be verified.') : null,
    volunteerId: String(c.user_id),
    volunteerName: c.user_full_name || 'Volunteer',
    volunteerEmail: c.user_email || '',
    createdTime: c.created_at || new Date().toISOString()
  };
};

export const certificationService = {
  /**
   * Retrieve certifications with optional filters
   */
  async getCertifications(filters = {}) {
    ensureAuthToken();

    const currentUser = getCurrentSessionUser();
    const isAdmin = currentUser?.role === 'admin';

    // Live backend call when authenticated and online
    if (api.getToken() && connectivityService.isOnline()) {
      try {
        let rawList = [];
        if (isAdmin && (filters.verificationStatus || filters.status)) {
          const statusParam = filters.verificationStatus && filters.verificationStatus !== 'ALL'
            ? filters.verificationStatus
            : (filters.status && filters.status !== 'ALL' ? filters.status : undefined);
          const endpoint = statusParam ? `/api/admin/certifications?status=${encodeURIComponent(statusParam)}` : '/api/admin/certifications';
          rawList = await api.get(endpoint);
        } else {
          const endpoint = filters.verificationStatus && filters.verificationStatus !== 'ALL'
            ? `/api/certifications/mine?status=${encodeURIComponent(filters.verificationStatus)}`
            : '/api/certifications/mine';
          rawList = await api.get(endpoint);
        }

        let list = (rawList || []).map(normalizeCertification);

        if (filters.category && filters.category !== 'ALL') {
          list = list.filter((c) => c.category === filters.category);
        }

        if (filters.search && filters.search.trim() !== '') {
          const q = filters.search.toLowerCase().trim();
          list = list.filter(
            (c) =>
              c.name?.toLowerCase().includes(q) ||
              c.volunteerName?.toLowerCase().includes(q) ||
              c.issuingOrg?.toLowerCase().includes(q) ||
              c.credentialId?.toLowerCase().includes(q)
          );
        }

        list.sort((a, b) => new Date(b.createdTime || 0) - new Date(a.createdTime || 0));
        return list;
      } catch (err) {
        console.warn('[certificationService] Backend fetch failed, falling back to local store:', err.message);
      }
    }

    // Local / Offline / Test fallback
    let list = getStoredCertifications();

    if (filters.status && filters.status !== 'ALL') {
      list = list.filter((c) => c.status === filters.status);
    }

    if (filters.verificationStatus && filters.verificationStatus !== 'ALL') {
      list = list.filter((c) => c.verificationStatus === filters.verificationStatus);
    }

    if (filters.category && filters.category !== 'ALL') {
      list = list.filter((c) => c.category === filters.category);
    }

    if (filters.volunteerId && filters.volunteerId !== 'ALL') {
      list = list.filter(
        (c) =>
          c.volunteerId === filters.volunteerId ||
          c.volunteerEmail === filters.volunteerId ||
          (filters.volunteerId === 'dev-skl-002' && (c.volunteerName === 'Alex Rivera' || c.volunteerId === 'dev-skl-002'))
      );
    }

    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.volunteerName?.toLowerCase().includes(q) ||
          c.issuingOrg?.toLowerCase().includes(q) ||
          c.credentialId?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => new Date(b.createdTime || 0) - new Date(a.createdTime || 0));
    return JSON.parse(JSON.stringify(list));
  },

  /**
   * Retrieve single certification by ID
   */
  async getCertificationById(id) {
    ensureAuthToken();

    const isNumeric = /^\d+$/.test(String(id));
    if (api.getToken() && connectivityService.isOnline() && isNumeric) {
      try {
        const raw = await api.get(`/api/certifications/${id}`);
        return normalizeCertification(raw);
      } catch (err) {
        console.warn('[certificationService] Failed to get certification by ID:', err.message);
      }
    }

    const list = getStoredCertifications();
    const found = list.find((c) => c.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  },

  /**
   * Retrieve certifications owned by a specific volunteer
   */
  async getCertificationsForVolunteer(volunteerIdOrEmail) {
    return this.getCertifications({ volunteerId: volunteerIdOrEmail });
  },

  /**
   * Retrieve all pending verification items for admin queue
   */
  async getPendingVerifications() {
    return this.getCertifications({ verificationStatus: 'pending' });
  },

  /**
   * Volunteer submits a new certification credential for review
   */
  async submitCertification(data) {
    const name = data?.name?.trim() || data?.title?.trim();
    const issuingOrg = data?.issuingOrg?.trim() || data?.issuing_organization?.trim();

    if (!name) {
      throw new Error('Certification name is required.');
    }
    if (!issuingOrg) {
      throw new Error('Issuing organization is required.');
    }

    ensureAuthToken();

    // Live backend call when authenticated and online
    if (api.getToken() && connectivityService.isOnline() && !String(data.volunteerId).startsWith('dev-')) {
      const payload = {
        title: name,
        issuing_organization: issuingOrg,
        credential_id: data.credentialId ? data.credentialId.trim() : null,
        issue_date: data.issueDate || null,
        expiry_date: data.expiryDate || null,
        skill_id: (data.skill_id && !isNaN(Number(data.skill_id))) ? Number(data.skill_id) : null
      };

      const created = await api.post('/api/certifications', payload);
      const normalized = normalizeCertification(created);

      try {
        realtimeService.dispatchRealtimeEvent({
          type: 'certification',
          priority: 'normal',
          title: 'New Credential Submitted for Review',
          message: `${normalized.volunteerName} submitted "${normalized.name}".`,
          targetRole: 'admin',
          entityType: 'certification',
          entityId: normalized.id,
          link: '/admin/verification-queue'
        }).catch(() => {});
      } catch {}

      return normalized;
    }

    // Offline / test fallback
    const list = getStoredCertifications();
    const now = new Date().toISOString();

    const newCert = {
      id: `cert-${Date.now().toString().slice(-6)}`,
      volunteerId: data.volunteerId || 'dev-skl-002',
      volunteerName: data.volunteerName || 'Alex Rivera',
      volunteerEmail: data.volunteerEmail || 'alex.rivera@skillbank.org',
      name,
      category: data.category || 'Incident Command',
      issuingOrg,
      credentialId: data.credentialId ? data.credentialId.trim() : `CERT-${Date.now().toString().slice(-5)}`,
      issueDate: data.issueDate || now.split('T')[0],
      expiryDate: data.expiryDate || null,
      status: 'pending_review',
      verificationStatus: 'pending',
      verifiedAt: null,
      verifiedBy: null,
      documentName: data.documentName || 'Credential_Document.pdf',
      documentUrl: '#',
      evidenceNotes: data.evidenceNotes ? data.evidenceNotes.trim() : 'Submitted by volunteer for clearance.',
      rejectionReason: null,
      createdTime: now
    };

    list.unshift(newCert);
    setStoredCertifications(list);

    try {
      realtimeService.dispatchRealtimeEvent({
        type: 'certification',
        priority: 'normal',
        title: 'New Credential Submitted for Review',
        message: `${newCert.volunteerName} submitted "${newCert.name}" (${newCert.issuingOrg}).`,
        targetRole: 'admin',
        entityType: 'certification',
        entityId: newCert.id,
        link: '/admin/verification-queue'
      }).catch(() => {});
    } catch {}

    if (!connectivityService.isOnline()) {
      offlineSyncService.enqueueMutation({
        entityType: 'certification',
        entityId: newCert.id,
        operation: 'CREATE',
        description: `Submitted credential "${newCert.name}" for review`,
        payload: newCert,
        userId: newCert.volunteerId,
        role: 'volunteer'
      }).catch(() => {});
    }

    return JSON.parse(JSON.stringify(newCert));
  },

  /**
   * Admin verifies and approves a certification
   */
  async verifyCertification(id, { adminName = 'Cmdr. Sarah Vance', notes = '' } = {}) {
    ensureAuthToken();

    const isNumeric = /^\d+$/.test(String(id));
    if (api.getToken() && connectivityService.isOnline() && isNumeric) {
      const payload = {
        verification_status: 'verified',
        verification_notes: notes || `Approved by ${adminName}`
      };
      const updated = await api.patch(`/api/admin/certifications/${id}/verify`, payload);
      return normalizeCertification(updated);
    }

    // Local / test fallback
    const list = getStoredCertifications();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Certification with ID "${id}" not found.`);

    const now = new Date().toISOString();
    list[index].verificationStatus = 'verified';
    list[index].status = 'active';
    list[index].verifiedAt = now;
    list[index].verifiedBy = adminName;
    if (notes) {
      list[index].evidenceNotes = notes;
    }
    list[index].rejectionReason = null;

    setStoredCertifications(list);
    return JSON.parse(JSON.stringify(list[index]));
  },

  /**
   * Admin rejects a certification submission
   */
  async rejectCertification(id, { adminName = 'Cmdr. Sarah Vance', reason = 'Credential documentation insufficient or unverified.' } = {}) {
    ensureAuthToken();

    const isNumeric = /^\d+$/.test(String(id));
    if (api.getToken() && connectivityService.isOnline() && isNumeric) {
      const payload = {
        verification_status: 'rejected',
        verification_notes: reason
      };
      const updated = await api.patch(`/api/admin/certifications/${id}/verify`, payload);
      return normalizeCertification(updated);
    }

    // Local / test fallback
    const list = getStoredCertifications();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Certification with ID "${id}" not found.`);

    const now = new Date().toISOString();
    list[index].verificationStatus = 'rejected';
    list[index].status = 'pending_review';
    list[index].verifiedAt = now;
    list[index].verifiedBy = adminName;
    list[index].rejectionReason = reason;

    setStoredCertifications(list);
    return JSON.parse(JSON.stringify(list[index]));
  },

  /**
   * Admin revokes a previously verified certification
   */
  async revokeCertification(id, { adminName = 'Cmdr. Sarah Vance', reason = 'Certification expired or revoked by issuing authority.' } = {}) {
    ensureAuthToken();

    const isNumeric = /^\d+$/.test(String(id));
    if (api.getToken() && connectivityService.isOnline() && isNumeric) {
      const payload = {
        verification_status: 'rejected',
        verification_notes: reason
      };
      const updated = await api.patch(`/api/admin/certifications/${id}/verify`, payload);
      return normalizeCertification(updated);
    }

    // Local / test fallback
    const list = getStoredCertifications();
    const index = list.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`Certification with ID "${id}" not found.`);

    const now = new Date().toISOString();
    list[index].verificationStatus = 'rejected';
    list[index].status = 'expired';
    list[index].verifiedAt = now;
    list[index].verifiedBy = adminName;
    list[index].rejectionReason = reason;

    setStoredCertifications(list);
    return JSON.parse(JSON.stringify(list[index]));
  },

  /**
   * Delete or archive certification
   */
  async deleteCertification(id) {
    const list = getStoredCertifications();
    const filtered = list.filter((c) => c.id !== id);
    if (filtered.length === list.length) {
      // If not in local store, treat as ok
    }
    setStoredCertifications(filtered);
    return true;
  },

  /**
   * Reset store to initial seed values
   */
  resetDevelopmentCertifications() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEV_CERTIFICATIONS));
    return JSON.parse(JSON.stringify(INITIAL_DEV_CERTIFICATIONS));
  }
};

export default certificationService;
